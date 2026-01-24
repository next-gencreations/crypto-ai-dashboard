// app/api/proxy/_lib.js
export const runtime = "nodejs";

/**
 * Pick the upstream base URL.
 * (Your Vercel env already has UPSTREAM_API_URL)
 */
export function getApiBase() {
  const base =
    process.env.UPSTREAM_API_URL ||
    process.env.API_BASE ||
    process.env.API_URL ||
    "https://crypto-ai-api-1-7cte.onrender.com";

  const clean = String(base).trim().replace(/\/$/, "");
  if (!/^https?:\/\//i.test(clean)) {
    throw new Error(`Invalid upstream base URL: ${clean}`);
  }
  return clean;
}

/**
 * SAFELY clone headers (prevents "Headers constructor" crashes).
 */
function safeCloneHeaders(src) {
  const out = new Headers();
  try {
    if (src?.forEach) {
      src.forEach((value, key) => {
        try {
          out.set(key, value);
        } catch {
          // Ignore invalid header values
        }
      });
    }
  } catch {
    // ignore
  }
  return out;
}

/**
 * Add CORS headers.
 */
export function addCors(headers, req) {
  const origin = req?.headers?.get?.("origin") || "*";
  headers.set("access-control-allow-origin", origin);
  headers.set("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  headers.set("access-control-allow-headers", "Content-Type, Authorization");
  headers.set("access-control-allow-credentials", "true");
  headers.set("vary", "Origin");
  return headers;
}

/**
 * Legacy rewrite table.
 * (We keep this, but ALSO do fallback tries in proxyFetch)
 */
export function rewriteLegacy(path) {
  if (path.startsWith("/api/")) return path;

  // legacy UI names
  if (path === "/vault/set-pin") return "/vault/set-pin";
  if (path === "/vault/use-pin") return "/vault/use-pin";

  return path;
}

/**
 * Build a list of upstream paths to try.
 * This solves “sometimes it’s /api/xxx, sometimes it’s /xxx” situations.
 */
function buildFallbackPaths(path) {
  const tries = [];

  // original
  tries.push(path);

  // if it starts with /api, try without /api
  if (path.startsWith("/api/")) {
    tries.push(path.replace(/^\/api/, ""));
  } else {
    // if it does NOT start with /api, try WITH /api
    tries.push("/api" + path);
  }

  // extra vault fallbacks for common shapes
  if (path.includes("/vault/status")) {
    tries.push("/vault/status");
    tries.push("/api/vault/status");
  }

  if (path.includes("/vault/set-pin")) {
    // common alternate implementations
    tries.push("/vault/set-pin");
    tries.push("/api/vault/set-pin");
    tries.push("/vault/pin");
    tries.push("/api/vault/pin");
    tries.push("/vault/pin/set");
    tries.push("/api/vault/pin/set");
  }

  if (path.includes("/vault/use-pin")) {
    tries.push("/vault/use-pin");
    tries.push("/api/vault/use-pin");
    tries.push("/vault/unlock");
    tries.push("/api/vault/unlock");
  }

  // Deduplicate while keeping order
  return [...new Set(tries)];
}

/**
 * Core proxy that returns a Response (used by [...path]/route.js and settings route).
 */
export async function proxyFetch(req, upstreamPath) {
  const API_BASE = getApiBase();
  const incoming = new URL(req.url);
  const search = incoming.search || "";

  // Copy request headers safely
  const inHeaders = safeCloneHeaders(req.headers);
  inHeaders.delete("host");
  inHeaders.delete("content-length");

  // Read request body once (safe for Vercel)
  let body;
  if (!["GET", "HEAD"].includes(req.method)) {
    const buf = await req.arrayBuffer().catch(() => null);
    if (buf && buf.byteLength) body = buf;
  }

  const candidates = buildFallbackPaths(rewriteLegacy(upstreamPath));

  let lastRes = null;

  for (const candidatePath of candidates) {
    const url = API_BASE + candidatePath + search;

    try {
      const res = await fetch(url, {
        method: req.method,
        headers: inHeaders,
        body,
        cache: "no-store",
        redirect: "manual",
      });

      lastRes = res;

      // If not 404, accept it immediately
      if (res.status !== 404) {
        const outHeaders = addCors(safeCloneHeaders(res.headers), req);
        outHeaders.set("cache-control", "no-store");
        outHeaders.set("x-proxy-upstream-path", candidatePath);
        return new Response(res.body, { status: res.status, headers: outHeaders });
      }
    } catch (e) {
      // If fetch fails, break and return 502
      const errHeaders = addCors(new Headers({ "content-type": "application/json" }), req);
      return new Response(
        JSON.stringify({ ok: false, error: "proxy_fetch_failed", detail: String(e) }),
        { status: 502, headers: errHeaders }
      );
    }
  }

  // All tries returned 404 (or lastRes exists). Return the last response with safe headers.
  if (lastRes) {
    const outHeaders = addCors(safeCloneHeaders(lastRes.headers), req);
    outHeaders.set("cache-control", "no-store");
    outHeaders.set("x-proxy-upstream-path", candidates[candidates.length - 1] || "");
    return new Response(lastRes.body, { status: lastRes.status, headers: outHeaders });
  }

  // Should never happen
  const errHeaders = addCors(new Headers({ "content-type": "application/json" }), req);
  return new Response(JSON.stringify({ ok: false, error: "no_upstream_response" }), {
    status: 502,
    headers: errHeaders,
  });
}

/**
 * ✅ These are REQUIRED because your files import them:
 * - data/route.js, logs/route.js, ohlc/route.js call proxyGet("/data")
 * - settings/route.js calls proxyGet(req, "/settings") and proxyPost(req, "/settings")
 */

// If called as proxyGet("/data") => returns parsed JSON
// If called as proxyGet(req, "/settings") => returns a Response (proxyFetch)
export async function proxyGet(a, b) {
  // (req, path) signature
  if (a && typeof a === "object" && typeof a.headers?.get === "function") {
    const req = a;
    const path = b;
    return proxyFetch(req, path);
  }

  // (path) signature
  const path = a;
  const url = getApiBase() + path;

  const res = await fetch(url, { cache: "no-store" });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();

  // normalize
  if (!res.ok) return { ok: false, status: res.status, data };
  return data;
}

// settings route needs proxyPost(req, "/settings") that returns a Response
export async function proxyPost(req, path) {
  if (!req || typeof req.headers?.get !== "function") {
    throw new Error("proxyPost must be called as proxyPost(req, path)");
  }
  return proxyFetch(req, path);
}

// app/api/proxy/_lib.js
//
// Proxy helpers for the Next.js dashboard.
// This version is aligned with the Node/Express backend on Render
// which serves routes at ROOT (no /api prefix).
//
// The dashboard calls /api/proxy/<path...> and we forward to API_URL.
//
// Required env on Vercel:
// - API_URL = https://crypto-ai-api-1-7cte.onrender.com   (your Render base URL)

const DEFAULT_TIMEOUT_MS = 15000;

function getApiBase() {
  const base =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "";

  if (!base) {
    throw new Error(
      "Missing API_URL (or NEXT_PUBLIC_API_URL). Set it to your Render base, e.g. https://crypto-ai-api-1-7cte.onrender.com"
    );
  }
  return base.replace(/\/+$/, "");
}

/**
 * Legacy rewrite:
 * Previously some backends served /data, /logs, /ohlc, /settings at ROOT and
 * other endpoints under /api. With the new Node/Express backend, everything is ROOT.
 *
 * So: do NOT add "/api" to anything.
 */
export function rewriteLegacy(path) {
  if (!path) return "/";
  // Ensure leading slash
  if (!path.startsWith("/")) path = "/" + path;

  // If caller already included /api, keep it as-is (harmless for compatibility)
  return path;
}

function mergeHeaders(reqHeaders, extra = {}) {
  const out = new Headers();

  // Copy incoming headers except the ones that should not be forwarded
  for (const [k, v] of reqHeaders.entries()) {
    const key = k.toLowerCase();
    if (
      key === "host" ||
      key === "connection" ||
      key === "content-length" ||
      key === "accept-encoding"
    ) {
      continue;
    }
    out.set(k, v);
  }

  // Add/override extras
  for (const [k, v] of Object.entries(extra)) {
    if (v === undefined || v === null) continue;
    out.set(k, String(v));
  }

  return out;
}

/**
 * Core proxy fetch.
 * @param {Request} req - Next.js route handler request
 * @param {string} upstreamPath - path to hit on API_URL
 */
export async function proxyFetch(req, upstreamPath) {
  const base = getApiBase();
  const path = rewriteLegacy(upstreamPath);
  const url = base + path;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const method = req.method || "GET";

    const headers = mergeHeaders(req.headers, {
      // Helpful for server logs/debugging:
      "x-forwarded-host": req.headers.get("host") || "",
    });

    // Only pass a body for methods that allow one
    const hasBody = !["GET", "HEAD"].includes(method.toUpperCase());

    const res = await fetch(url, {
      method,
      headers,
      body: hasBody ? req.body : undefined,
      redirect: "manual",
      signal: controller.signal,
      // Next.js edge/runtime safe:
      cache: "no-store",
    });

    // We return the raw response body + status + headers
    // but strip hop-by-hop headers.
    const outHeaders = new Headers(res.headers);
    outHeaders.delete("content-encoding");
    outHeaders.delete("transfer-encoding");
    outHeaders.delete("connection");

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: outHeaders,
    });
  } catch (err) {
    const msg =
      err?.name === "AbortError"
        ? `Upstream timeout after ${DEFAULT_TIMEOUT_MS}ms`
        : err?.message || String(err);

    return new Response(
      JSON.stringify({
        ok: false,
        error: "proxy_error",
        message: msg,
      }),
      {
        status: 502,
        headers: { "content-type": "application/json" },
      }
    );
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Convenience helper used by some route files:
 * - proxyGet("/settings") -> returns JSON
 * - proxyGet(req, "/settings") -> returns Response passthrough
 */
export async function proxyGet(arg1, arg2) {
  // Usage A: proxyGet("/logs") -> returns JSON
  if (typeof arg1 === "string") {
    const path = arg1;
    const fakeReq = new Request("http://local" + path, { method: "GET" });
    const res = await proxyFetch(fakeReq, path);
    return await res.json();
  }

  // Usage B: proxyGet(req, "/settings") -> returns Response
  const req = arg1;
  const path = arg2;
  return proxyFetch(req, path);
}

/**
 * Convenience helper used by some route files:
 * - proxyPost(req, "/bankroll")
 */
export async function proxyPost(req, path) {
  return proxyFetch(req, path);
}

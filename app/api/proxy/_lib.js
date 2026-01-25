// app/api/proxy/_lib.js
export const runtime = "nodejs";

// Prefer API_BASE, else UPSTREAM_API_URL, else NEXT_PUBLIC_API_URL, else fallback
export function getApiBase() {
  const base =
    process.env.API_BASE ||
    process.env.UPSTREAM_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://crypto-ai-api-1-7cte.onrender.com";

  return String(base).replace(/\/$/, "");
}

export function addCors(headers, origin = "*") {
  headers.set("access-control-allow-origin", origin);
  headers.set("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  headers.set("access-control-allow-headers", "Content-Type, Authorization, X-Vault-Token");
  headers.set("access-control-max-age", "86400");
  return headers;
}

// If older UI builds ever used "/api/..." paths, strip the "/api" prefix
// because the Render Node API serves routes at ROOT ("/status", "/settings", etc).
export function rewriteLegacy(path) {
  // Normalize
  if (!path) return "/";

  // Strip any accidental double slashes
  path = path.replace(/\/{2,}/g, "/");

  // Old builds sometimes requested "/api/<route>"
  // New Render Node API expects "/<route>"
  if (path.startsWith("/api/")) {
    path = path.slice(4); // remove "/api"
    if (!path.startsWith("/")) path = "/" + path;
  }

  // Keep your old vault pin aliases working
  if (path === "/vault/set-pin") return "/vault/pin/set";
  if (path === "/vault/use-pin") return "/vault/unlock";

  return path;
}

function safeCloneHeaders(h) {
  try {
    return new Headers(h);
  } catch {
    // fallback if something weird arrives
    const out = new Headers();
    try {
      for (const [k, v] of Object.entries(h || {})) out.set(k, String(v));
    } catch {}
    return out;
  }
}

export async function proxyFetch(req, upstreamPath) {
  const API_BASE = getApiBase();
  const url = API_BASE + upstreamPath;

  // Copy headers but remove ones that can break proxying
  const headers = safeCloneHeaders(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  // Ensure JSON content-type for non-GET if missing
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (!headers.get("content-type")) {
      headers.set("content-type", "application/json");
    }
  }

  // Read body safely (prevents stream/duplex issues on Vercel)
  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const buf = await req.arrayBuffer();
      if (buf && buf.byteLength > 0) body = buf;
    } catch {
      // ignore body read failure
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  let res;
  try {
    res = await fetch(url, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    const errHeaders = addCors(
      new Headers({ "content-type": "application/json" }),
      req.headers.get("origin") || "*"
    );
    return new Response(
      JSON.stringify({ ok: false, error: "proxy_fetch_failed", detail: String(e) }),
      { status: 502, headers: errHeaders }
    );
  } finally {
    clearTimeout(timeout);
  }

  const outHeaders = addCors(
    new Headers(res.headers),
    req.headers.get("origin") || "*"
  );
  return new Response(res.body, { status: res.status, headers: outHeaders });
}

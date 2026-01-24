
// app/api/proxy/_lib.js
export const runtime = "nodejs";

export function getApiBase() {
  const base =
    process.env.UPSTREAM_API_URL ||
    process.env.API_BASE ||
    process.env.API_URL ||
    "https://crypto-ai-api-1-7cte.onrender.com";

  const clean = String(base).replace(/\/$/, "");
  if (!/^https?:\/\//i.test(clean)) {
    throw new Error(`Invalid UPSTREAM_API_URL/API_BASE/API_URL: ${clean}`);
  }
  return clean;
}

function safeCloneHeaders(src) {
  const out = new Headers();
  try {
    // src can be a Headers object
    src?.forEach?.((value, key) => {
      try {
        out.set(key, value);
      } catch {
        // ignore invalid header values
      }
    });
  } catch {
    // ignore
  }
  return out;
}

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
 * Render routing:
 * - /data, /logs, /ohlc, /settings are ROOT routes on Render
 * - /status, /bankroll, /vault/* are under /api on Render
 * Also support legacy UI routes:
 * - /vault/set-pin -> /api/vault/pin
 * - /vault/use-pin -> /api/vault/unlock
 */
export function rewriteLegacy(path) {
  // already correct
  if (path.startsWith("/api/")) return path;

  // legacy UI routes (your UI is calling these)
  if (path === "/vault/set-pin") return "/api/vault/pin";
  if (path === "/vault/use-pin") return "/api/vault/unlock";

  // root routes on Render
  if (path === "/data" || path === "/logs" || path === "/ohlc" || path === "/settings") {
    return path;
  }

  // api routes on Render
  if (path === "/status" || path === "/bankroll" || path.startsWith("/vault/") || path === "/vault") {
    return "/api" + path;
  }

  // default passthrough
  return path;
}

export async function proxyFetch(req, upstreamPath) {
  const API_BASE = getApiBase();
  const incoming = new URL(req.url);
  const url = API_BASE + upstreamPath + incoming.search;

  const headers = safeCloneHeaders(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  let body;
  if (!["GET", "HEAD"].includes(req.method)) {
    const buf = await req.arrayBuffer().catch(() => null);
    if (buf && buf.byteLength) body = buf;
  }

  let res;
  try {
    res = await fetch(url, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });
  } catch (e) {
    const errHeaders = addCors(new Headers({ "content-type": "application/json" }), req);
    return new Response(JSON.stringify({ ok: false, error: "proxy_fetch_failed", detail: String(e) }), {
      status: 502,
      headers: errHeaders,
    });
  }

  // SAFE header copy (prevents "Headers constructor" crash)
  const outHeaders = addCors(safeCloneHeaders(res.headers), req);
  outHeaders.set("cache-control", "no-store");

  return new Response(res.body, { status: res.status, headers: outHeaders });
}

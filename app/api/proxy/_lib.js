// app/api/proxy/_lib.js
export const runtime = "nodejs";

/**
 * Returns the upstream base URL for your Render API.
 * NEVER use NEXT_PUBLIC_API_URL here (it's usually "/api/proxy" and causes loops).
 */
export function getApiBase() {
  const candidates = [
    process.env.UPSTREAM_API_URL,
    process.env.API_BASE,
    process.env.API_URL,
    // last resort fallback:
    "https://crypto-ai-api-1-7cte.onrender.com",
  ].filter(Boolean);

  const base = String(candidates[0] || "").trim().replace(/\/$/, "");

  // Must be absolute http(s)
  if (!/^https?:\/\//i.test(base)) {
    throw new Error(
      `Invalid upstream base URL. Set UPSTREAM_API_URL to a full https://... value. Got: ${base}`
    );
  }

  return base;
}

/**
 * CORS helper. In practice, if you call the proxy from the browser
 * (same-origin), CORS is rarely needed, but preflight can still happen.
 */
function corsOriginFromReq(req) {
  const origin = req?.headers?.get?.("origin");
  return origin || "*";
}

export function addCors(headers, req) {
  const origin = corsOriginFromReq(req);

  headers.set("access-control-allow-origin", origin);
  headers.set("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  headers.set("access-control-allow-headers", "Content-Type, Authorization");
  headers.set("access-control-allow-credentials", "true");
  headers.set("vary", "Origin");

  return headers;
}

/**
 * Rewrite paths from the Vercel proxy into the paths your Render API expects.
 *
 * What we learned from your logs:
 * - Vercel calls:   /vault/status
 * - Render expects: /api/vault/status
 *
 * Also:
 * - Render serves /data, /logs, /ohlc, /settings at ROOT (no /api prefix)
 */
export function rewriteLegacy(path) {
  // If already correct, keep it
  if (path.startsWith("/api/")) return path;

  // Legacy UI compatibility
  if (path === "/vault/set-pin") return "/api/vault/pin";
  if (path === "/vault/use-pin") return "/api/vault/unlock";

  // Modern vault endpoints are under /api on upstream
  if (path.startsWith("/vault/")) return "/api" + path;

  // Common API endpoints also under /api on upstream
  if (path === "/status") return "/api/status";
  if (path === "/bankroll") return "/api/bankroll";

  // Everything else stays root (data/logs/ohlc/settings/etc.)
  return path;
}

/**
 * Proxies the incoming request to the upstream Render API.
 * Preserves querystring, forwards headers + body safely for Vercel.
 */
export async function proxyFetch(req, upstreamPath) {
  const API_BASE = getApiBase();

  // Preserve querystring from original request
  const incomingUrl = new URL(req.url);
  const qs = incomingUrl.search ? incomingUrl.search : "";

  const url = API_BASE + upstreamPath + qs;

  // Copy headers but remove ones that can break proxying
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  // DO NOT force content-type; it can break form-data.
  // Keep whatever the client sent.

  // Read body safely (prevents stream/duplex issues on Vercel)
  let body;
  if (!["GET", "HEAD"].includes(req.method)) {
    const buf = await req.arrayBuffer().catch(() => null);
    if (buf && buf.byteLength > 0) body = buf;
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
    const errHeaders = addCors(new Headers({ "content-type": "application/json" }), req);
    return new Response(
      JSON.stringify({ ok: false, error: "proxy_fetch_failed", detail: String(e) }),
      { status: 502, headers: errHeaders }
    );
  } finally {
    clearTimeout(timeout);
  }

  // Relay upstream response (status + headers + body)
  const outHeaders = addCors(new Headers(res.headers), req);
  outHeaders.set("cache-control", "no-store");

  return new Response(res.body, { status: res.status, headers: outHeaders });
}

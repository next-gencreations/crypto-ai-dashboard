// app/api/proxy/_lib.js
export const runtime = "nodejs";

/**
 * Returns the upstream base URL for Render (or any upstream API).
 * IMPORTANT:
 * - NEVER use NEXT_PUBLIC_API_URL here, because it's often "/api/proxy" (a local path),
 *   which causes proxy loops / invalid URLs.
 */
export function getApiBase() {
  const candidates = [
    process.env.UPSTREAM_API_URL,
    process.env.API_BASE,
    process.env.API_URL,
    // last-resort hardcoded fallback (ok for emergency, but keep env set in production)
    "https://crypto-ai-api-1-7cte.onrender.com",
  ].filter(Boolean);

  const base = String(candidates[0] || "").trim().replace(/\/$/, "");

  // Must be absolute http(s)
  if (!/^https?:\/\//i.test(base)) {
    throw new Error(
      `Invalid upstream base URL. Set UPSTREAM_API_URL (recommended) to a full https://... value. Got: ${base}`
    );
  }

  return base;
}

function corsOriginFromReq(req) {
  // If you want strict origin, set CORS_ORIGIN on Vercel (optional)
  // otherwise reflect the request origin.
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

export function rewriteLegacy(path) {
  // Your UI calls /api/vault/... but the Render API uses /api/...
  // We'll also support old legacy paths.

  // Legacy support:
  if (path === "/vault/set-pin") return "/vault/pin";
  if (path === "/vault/use-pin") return "/vault/unlock";

  return path;
}

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

  // If upstream is JSON, keep content-type if present.
  // Don't force JSON if caller is sending form-data etc.
  // (forcing it causes 415/400 issues)
  // So: no "auto content-type" here.

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

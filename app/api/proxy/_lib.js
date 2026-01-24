// app/api/proxy/_lib.js
export const runtime = "nodejs";

/**
 * Pick the upstream Render base URL.
 * Set ONE of these in Vercel:
 *  - UPSTREAM_API_URL   (recommended)
 *  - API_BASE
 *  - API_URL
 *
 * Example:
 *  https://crypto-ai-api-1-7cte.onrender.com
 */
export function getApiBase() {
  const base =
    process.env.UPSTREAM_API_URL ||
    process.env.API_BASE ||
    process.env.API_URL ||
    "https://crypto-ai-api-1-7cte.onrender.com";

  const clean = String(base).replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(clean)) {
    throw new Error(`Invalid UPSTREAM_API_URL/API_BASE/API_URL: ${clean}`);
  }
  return clean;
}

function safeCloneHeaders(src) {
  const out = new Headers();
  try {
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
 * IMPORTANT FIX:
 * Your Render API is serving vault at ROOT:
 *   /vault/status
 *   /vault/set-pin
 *   /vault/use-pin
 *
 * So we must NOT rewrite /vault/* to /api/vault/*
 */
export function rewriteLegacy(path) {
  // already absolute
  if (!path.startsWith("/")) path = "/" + path;

  // keep these ROOT routes (Render)
  if (
    path === "/data" ||
    path === "/logs" ||
    path === "/ohlc" ||
    path === "/settings" ||
    path === "/health" ||
    path.startsWith("/vault/")
  ) {
    return path;
  }

  // if you ever have /api routes, keep them
  if (path.startsWith("/api/")) return path;

  // default passthrough
  return path;
}

function buildUpstreamUrl(req, upstreamPath) {
  const API_BASE = getApiBase();
  const incoming = new URL(req.url);

  const fixedPath = rewriteLegacy(upstreamPath);

  // If upstreamPath already has "?", keep its query.
  // Otherwise copy query from incoming request.
  const hasQuery = fixedPath.includes("?");
  const url = new URL(API_BASE + fixedPath);
  if (!hasQuery && incoming.search) url.search = incoming.search;

  return url.toString();
}

export async function proxyFetch(req, upstreamPath) {
  const url = buildUpstreamUrl(req, upstreamPath);

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
    return new Response(
      JSON.stringify({ ok: false, error: "proxy_fetch_failed", detail: String(e) }),
      { status: 502, headers: errHeaders }
    );
  }

  // SAFE header copy (prevents "Headers constructor" crash)
  const outHeaders = addCors(safeCloneHeaders(res.headers), req);
  outHeaders.set("cache-control", "no-store");

  return new Response(res.body, { status: res.status, headers: outHeaders });
}

/**
 * Convenience helpers
 */
export async function proxyGet(req, upstreamPath) {
  const r = new Request(req.url, { method: "GET", headers: req.headers });
  return proxyFetch(r, upstreamPath);
}

export async function proxyPost(req, upstreamPath) {
  const r = new Request(req.url, { method: "POST", headers: req.headers, body: req.body });
  return proxyFetch(r, upstreamPath);
}

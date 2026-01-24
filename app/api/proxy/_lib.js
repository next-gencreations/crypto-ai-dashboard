// app/api/proxy/_lib.js
export const runtime = "nodejs";

export function getApiBase() {
  const base =
    process.env.UPSTREAM_API_URL ||
    process.env.API_BASE ||
    process.env.API_URL ||
    "https://crypto-ai-api-1-7cte.onrender.com";

  return String(base).replace(/\/$/, "");
}

export function addCors(headers, req) {
  const origin = req?.headers?.get("origin") || "*";
  headers.set("access-control-allow-origin", origin);
  headers.set("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  headers.set("access-control-allow-headers", "Content-Type, Authorization");
  headers.set("access-control-allow-credentials", "true");
  headers.set("vary", "Origin");
  return headers;
}

/**
 * Render API routing rules:
 * - /data, /logs, /ohlc, /settings → ROOT
 * - /vault/*, /bankroll, /status → /api/*
 */
export function rewriteLegacy(path) {
  // Already correct
  if (path.startsWith("/api/")) return path;

  // ROOT endpoints (no /api prefix)
  if (
    path === "/data" ||
    path === "/logs" ||
    path === "/ohlc" ||
    path === "/settings"
  ) {
    return path;
  }

  // Vault + system endpoints MUST be under /api
  if (
    path.startsWith("/vault/") ||
    path === "/vault" ||
    path === "/status" ||
    path === "/bankroll"
  ) {
    return "/api" + path;
  }

  // Default: pass through
  return path;
}

export async function proxyFetch(req, upstreamPath) {
  const API_BASE = getApiBase();
  const incoming = new URL(req.url);
  const url = API_BASE + upstreamPath + incoming.search;

  const headers = new Headers(req.headers);
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
    });
  } catch (e) {
    const errHeaders = addCors(
      new Headers({ "content-type": "application/json" }),
      req
    );
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 502, headers: errHeaders }
    );
  }

  const outHeaders = addCors(new Headers(res.headers), req);
  outHeaders.set("cache-control", "no-store");

  return new Response(res.body, { status: res.status, headers: outHeaders });
}

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

export function addCors(headers) {
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  headers.set("access-control-allow-headers", "*");
  return headers;
}

export function rewriteLegacy(path) {
  // Support old/legacy vault routes that some UI builds used
  if (path === "/vault/set-pin") return "/vault/pin/set";
  if (path === "/vault/use-pin") return "/vault/unlock";
  return path;
}

export async function proxyFetch(req, upstreamPath) {
  const API_BASE = getApiBase();
  const url = API_BASE + upstreamPath;

  // Copy headers but remove ones that can break proxying
  const headers = new Headers(req.headers);
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
    const errHeaders = addCors(new Headers({ "content-type": "application/json" }));
    return new Response(
      JSON.stringify({ ok: false, error: "proxy_fetch_failed", detail: String(e) }),
      { status: 502, headers: errHeaders }
    );
  } finally {
    clearTimeout(timeout);
  }

  const outHeaders = addCors(new Headers(res.headers));
  return new Response(res.body, { status: res.status, headers: outHeaders });
}

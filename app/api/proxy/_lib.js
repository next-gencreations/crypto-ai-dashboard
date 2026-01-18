// app/api/proxy/_lib.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function upstreamBase() {
  const base =
    (process.env.UPSTREAM_API_URL ||
      process.env.RENDER_API_URL ||
      process.env.UPSTREAM_URL ||
      "")
      .trim()
      .replace(/\/+$/, "");
  return base;
}

function joinUrl(base, path) {
  const p = String(path || "").replace(/^\/+/, "");
  return `${base}/${p}`;
}

async function forward(req, ctx) {
  const base = upstreamBase();
  if (!base) {
    return new Response(
      JSON.stringify({ error: "Missing UPSTREAM_API_URL (or RENDER_API_URL) on Vercel." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      }
    );
  }

  // Support both catch-all routes and "path passed in ctx"
  const pathParts = ctx?.params?.path || [];
  const path = Array.isArray(pathParts) ? pathParts.join("/") : String(pathParts || "");
  const url = joinUrl(base, path);

  const headers = new Headers(req.headers);
  headers.delete("host");

  if (!headers.get("accept")) headers.set("accept", "application/json");

  const init = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const buf = await req.arrayBuffer();
    init.body = buf;
  }

  const upstreamRes = await fetch(url, init);

  const resHeaders = new Headers(upstreamRes.headers);
  resHeaders.set("Cache-Control", "no-store");

  const body = await upstreamRes.arrayBuffer();

  return new Response(body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

// helpers for single-path routes (like /api/proxy/settings -> /settings)
export async function proxyGet(req, upstreamPath) {
  return forward(req, { params: { path: [String(upstreamPath || "").replace(/^\/+/, "")] } });
}

export async function proxyPost(req, upstreamPath) {
  return forward(req, { params: { path: [String(upstreamPath || "").replace(/^\/+/, "")] } });
}

export async function proxyPut(req, upstreamPath) {
  return forward(req, { params: { path: [String(upstreamPath || "").replace(/^\/+/, "")] } });
}

export async function proxyDelete(req, upstreamPath) {
  return forward(req, { params: { path: [String(upstreamPath || "").replace(/^\/+/, "")] } });
}

export async function proxyAny(req, ctx) {
  return forward(req, ctx);
}

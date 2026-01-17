// app/api/proxy/[...path]/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function upstreamBase() {
  return (
    (process.env.UPSTREAM_API_URL ||
      process.env.RENDER_API_URL ||
      process.env.UPSTREAM_URL ||
      "")
      .trim()
      .replace(/\/+$/, "")
  );
}

function joinUrl(base, path) {
  const p = String(path || "").replace(/^\/+/, "");
  return `${base}/${p}`;
}

function withCors(res, req) {
  const origin = req.headers.get("origin") || "*";
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set(
    "Access-Control-Allow-Headers",
    req.headers.get("access-control-request-headers") ||
      "Content-Type, Authorization, X-Vault-Token"
  );
  headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  return new Response(res.body, { status: res.status, headers });
}

async function forward(req, ctx) {
  const base = upstreamBase();
  if (!base) {
    const res = new Response(
      JSON.stringify({ error: "Missing UPSTREAM_API_URL (or RENDER_API_URL) on Vercel." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      }
    );
    return withCors(res, req);
  }

  // Handle CORS preflight locally
  if (req.method === "OPTIONS") {
    const res = new Response(null, { status: 204 });
    return withCors(res, req);
  }

  const pathParts = ctx?.params?.path || [];
  const path = Array.isArray(pathParts) ? pathParts.join("/") : String(pathParts || "");

  // IMPORTANT: include query string
  const incomingUrl = new URL(req.url);
  const url = joinUrl(base, path) + (incomingUrl.search || "");

  // Copy headers (keep X-Vault-Token etc)
  const headers = new Headers(req.headers);
  headers.delete("host");

  // Don’t force accept to json if upstream needs other formats; but it's ok to default
  if (!headers.get("accept")) headers.set("accept", "application/json");

  const init = { method: req.method, headers, cache: "no-store" };

  // Body for non-GET/HEAD
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const upstreamRes = await fetch(url, init);

  const resHeaders = new Headers(upstreamRes.headers);
  resHeaders.set("Cache-Control", "no-store");

  const body = await upstreamRes.arrayBuffer();

  const res = new Response(body, { status: upstreamRes.status, headers: resHeaders });
  return withCors(res, req);
}

export async function GET(req, ctx) { return forward(req, ctx); }
export async function POST(req, ctx) { return forward(req, ctx); }
export async function PUT(req, ctx) { return forward(req, ctx); }
export async function PATCH(req, ctx) { return forward(req, ctx); }
export async function DELETE(req, ctx) { return forward(req, ctx); }
export async function OPTIONS(req, ctx) { return forward(req, ctx); }

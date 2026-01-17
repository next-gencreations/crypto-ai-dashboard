// app/api/proxy/[...path]/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function upstreamBase() {
  const base = (
    process.env.UPSTREAM_API_URL ||
    process.env.RENDER_API_URL ||
    process.env.UPSTREAM_URL ||
    ""
  )
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
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const pathParts = ctx?.params?.path || [];
  const path = Array.isArray(pathParts) ? pathParts.join("/") : String(pathParts || "");

  const url = joinUrl(base, path);

  // Copy headers (keep X-Vault-Token etc)
  const headers = new Headers(req.headers);
  headers.delete("host");

  // Always accept JSON (but don't break upstream if it returns html)
  if (!headers.get("accept")) headers.set("accept", "application/json");

  const init = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  // Body for non-GET/HEAD
  if (req.method !== "GET" && req.method !== "HEAD") {
    const buf = await req.arrayBuffer();
    init.body = buf;
  }

  const upstreamRes = await fetch(url, init);

  // Pass through upstream response
  const resHeaders = new Headers(upstreamRes.headers);
  resHeaders.set("Cache-Control", "no-store");

  const body = await upstreamRes.arrayBuffer();

  return new Response(body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

export async function GET(req, ctx) {
  return forward(req, ctx);
}
export async function POST(req, ctx) {
  return forward(req, ctx);
}
export async function PUT(req, ctx) {
  return forward(req, ctx);
}
export async function PATCH(req, ctx) {
  return forward(req, ctx);
}
export async function DELETE(req, ctx) {
  return forward(req, ctx);
}
export async function OPTIONS(req, ctx) {
  return forward(req, ctx);
}

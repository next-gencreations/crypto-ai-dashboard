// app/api/proxy/[...path]/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function upstreamBase() {
  return (process.env.UPSTREAM_API_URL || process.env.RENDER_API_URL || "")
    .trim()
    .replace(/\/+$/, "");
}

async function handler(req, { params }) {
  const base = upstreamBase();
  if (!base) {
    return new Response(JSON.stringify({ ok: false, error: "missing_upstream_base" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const parts = (params?.path || []).map((p) => String(p || "").replace(/^\/+|\/+$/g, ""));
  const path = parts.join("/");
  const url = `${base}/${path}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", "application/json");

  // forward optional vault token header (if you ever use it)
  const vaultToken = req.headers.get("x-vault-token");
  if (vaultToken) headers.set("x-vault-token", vaultToken);

  const method = req.method.toUpperCase();
  const init = { method, headers, cache: "no-store" };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const r = await fetch(url, init);
  const outHeaders = new Headers(r.headers);
  outHeaders.set("Cache-Control", "no-store");

  return new Response(await r.arrayBuffer(), {
    status: r.status,
    headers: outHeaders,
  });
}

export async function GET(req, ctx) { return handler(req, ctx); }
export async function POST(req, ctx) { return handler(req, ctx); }
export async function DELETE(req, ctx) { return handler(req, ctx); }
export async function PUT(req, ctx) { return handler(req, ctx); }
export async function PATCH(req, ctx) { return handler(req, ctx); }

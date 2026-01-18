// app/api/proxy/[...path]/route.js
// Generic proxy -> forwards /api/proxy/<path> to your Render API base URL.
// Keeps headers and forwards body for non-GET.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function upstreamBase() {
  const base = (
    // keep compatibility with existing routes in this repo
    process.env.API_URL ||
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
      JSON.stringify({
        ok: false,
        error: "missing_upstream_env",
        hint: "Set API_URL (recommended) or UPSTREAM_API_URL on Vercel to your Render base, e.g. https://xxxx.onrender.com",
      }),
      { status: 500, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  }

  const pathParts = ctx?.params?.path || [];
  const path = Array.isArray(pathParts) ? pathParts.join("/") : String(pathParts || "");
  const url = joinUrl(base, path);

  const headers = new Headers(req.headers);
  headers.delete("host");
  if (!headers.get("accept")) headers.set("accept", "application/json");

  const init = { method: req.method, headers, cache: "no-store" };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const upstreamRes = await fetch(url, init);

  const resHeaders = new Headers(upstreamRes.headers);
  resHeaders.set("Cache-Control", "no-store");

  const body = await upstreamRes.arrayBuffer();

  return new Response(body, { status: upstreamRes.status, headers: resHeaders });
}

export async function GET(req, ctx) { return forward(req, ctx); }
export async function POST(req, ctx) { return forward(req, ctx); }
export async function PUT(req, ctx) { return forward(req, ctx); }
export async function PATCH(req, ctx) { return forward(req, ctx); }
export async function DELETE(req, ctx) { return forward(req, ctx); }
export async function OPTIONS(req, ctx) { return forward(req, ctx); }

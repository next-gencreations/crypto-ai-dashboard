export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBase() {
  return (process.env.UPSTREAM_API_URL || process.env.RENDER_API_URL || "")
    .trim()
    .replace(/\/+$/, "");
}

async function handler(req, { params }) {
  const base = getBase();
  if (!base) {
    return new Response(JSON.stringify({ ok: false, error: "missing_upstream_env" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const path = (params?.path || []).join("/");
  const url = `${base}/${path}`;

  // clone headers (but drop host)
  const headers = new Headers(req.headers);
  headers.delete("host");

  const init = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  // only attach body for non-GET/HEAD
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const upstreamRes = await fetch(url, init);

  // pass through content-type etc
  const outHeaders = new Headers(upstreamRes.headers);
  outHeaders.set("Cache-Control", "no-store");

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: outHeaders,
  });
}

export async function GET(req, ctx) { return handler(req, ctx); }
export async function POST(req, ctx) { return handler(req, ctx); }
export async function PUT(req, ctx) { return handler(req, ctx); }
export async function PATCH(req, ctx) { return handler(req, ctx); }
export async function DELETE(req, ctx) { return handler(req, ctx); }

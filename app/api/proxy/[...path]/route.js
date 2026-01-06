// app/api/proxy/[...path]/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function buildUpstreamUrl(req, params) {
  const base = (process.env.RENDER_API_URL || "").replace(/\/+$/, "");
  if (!base) return null;

  const path = Array.isArray(params?.path) ? params.path.join("/") : "";
  const reqUrl = new URL(req.url);

  // forward query string too
  const upstream = new URL(`${base}/${path}`);
  upstream.search = reqUrl.search;

  return upstream.toString();
}

async function proxy(req, params) {
  const upstreamUrl = buildUpstreamUrl(req, params);
  if (!upstreamUrl) {
    return jsonResponse({ error: "Missing RENDER_API_URL on Vercel" }, 500);
  }

  // Forward headers (but don’t forward host)
  const headers = new Headers(req.headers);
  headers.delete("host");

  const method = req.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);

  let body = undefined;
  if (hasBody) {
    // pass through raw body
    body = await req.arrayBuffer();
  }

  const res = await fetch(upstreamUrl, {
    method,
    headers,
    body,
    cache: "no-store",
    redirect: "follow",
  });

  const resHeaders = new Headers(res.headers);
  resHeaders.set("Cache-Control", "no-store");

  return new Response(await res.arrayBuffer(), {
    status: res.status,
    headers: resHeaders,
  });
}

export async function GET(req, ctx) {
  return proxy(req, ctx.params);
}
export async function POST(req, ctx) {
  return proxy(req, ctx.params);
}
export async function PUT(req, ctx) {
  return proxy(req, ctx.params);
}
export async function PATCH(req, ctx) {
  return proxy(req, ctx.params);
}
export async function DELETE(req, ctx) {
  return proxy(req, ctx.params);
}

// If you ever hit preflight in the future:
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

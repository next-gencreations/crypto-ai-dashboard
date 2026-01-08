export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel -> Render proxy
 * Usage:
 *   /api/proxy/data        -> {Render}/data
 *   /api/proxy/pet         -> {Render}/pet
 *   /api/proxy/ohlc?market=BTCUSDT&interval=60
 *
 * Set in Vercel Env:
 *   UPSTREAM_API_URL = https://crypto-ai-api-1-7cte.onrender.com
 * (or your actual Render API base)
 */

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function buildUpstreamUrl(req, params) {
  const base = (process.env.UPSTREAM_API_URL || process.env.RENDER_API_URL || "")
    .trim()
    .replace(/\/+$/, "");

  if (!base) return null;

  const reqUrl = new URL(req.url);
  const path = Array.isArray(params?.path) ? params.path.join("/") : "";
  const upstream = new URL(`${base}/${path}`);

  // carry querystring across
  upstream.search = reqUrl.search;

  return upstream.toString();
}

async function proxy(req, params) {
  const upstreamUrl = buildUpstreamUrl(req, params);
  if (!upstreamUrl) {
    return jsonResponse(
      { ok: false, error: "Missing UPSTREAM_API_URL (or RENDER_API_URL) in Vercel environment variables." },
      500
    );
  }

  // Copy request headers but remove host-related ones
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const method = req.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);

  let body;
  if (hasBody) body = await req.arrayBuffer();

  let res;
  try {
    res = await fetch(upstreamUrl, {
      method,
      headers,
      body,
      redirect: "follow",
      cache: "no-store",
    });
  } catch (e) {
    return jsonResponse(
      { ok: false, error: "Upstream fetch failed", upstreamUrl, detail: String(e?.message || e) },
      502
    );
  }

  // Return upstream response as-is
  const resHeaders = new Headers(res.headers);
  resHeaders.set("Cache-Control", "no-store");
  resHeaders.set("Access-Control-Allow-Origin", "*");

  return new Response(await res.arrayBuffer(), {
    status: res.status,
    headers: resHeaders,
  });
}

// Methods
export async function GET(req, ctx) { return proxy(req, ctx.params); }
export async function POST(req, ctx) { return proxy(req, ctx.params); }
export async function PUT(req, ctx) { return proxy(req, ctx.params); }
export async function PATCH(req, ctx) { return proxy(req, ctx.params); }
export async function DELETE(req, ctx) { return proxy(req, ctx.params); }

// Preflight
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

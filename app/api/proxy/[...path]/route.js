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
    return new Response(
      JSON.stringify({ ok: false, error: "Missing UPSTREAM_API_URL/RENDER_API_URL on Vercel" }),
      { status: 500, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  }

  const pathParts = (params?.path || []).map(String);
  const upstreamUrl = `${base}/${pathParts.join("/")}`;

  // forward querystring too
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  const finalUrl = qs ? `${upstreamUrl}?${qs}` : upstreamUrl;

  // copy headers (but strip host and content-length)
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  // If browser sends OPTIONS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Vault-Token, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Only attach a body for methods that can have one
  const method = req.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);

  let body = undefined;
  if (hasBody) {
    // stream body through (works for json too)
    body = req.body;
  }

  let upstreamRes;
  try {
    upstreamRes = await fetch(finalUrl, {
      method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: `Proxy fetch failed: ${String(e?.message || e)}`, finalUrl }),
      { status: 502, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  }

  // return upstream response (keep content-type)
  const outHeaders = new Headers(upstreamRes.headers);
  outHeaders.set("Cache-Control", "no-store");

  // Optional: allow browser access (safe for your setup)
  outHeaders.set("Access-Control-Allow-Origin", "*");
  outHeaders.set("Access-Control-Allow-Headers", "Content-Type, X-Vault-Token, Authorization");
  outHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: outHeaders,
  });
}

export async function GET(req, ctx) {
  return handler(req, ctx);
}
export async function POST(req, ctx) {
  return handler(req, ctx);
}
export async function PUT(req, ctx) {
  return handler(req, ctx);
}
export async function PATCH(req, ctx) {
  return handler(req, ctx);
}
export async function DELETE(req, ctx) {
  return handler(req, ctx);
}
export async function OPTIONS(req, ctx) {
  return handler(req, ctx);
}

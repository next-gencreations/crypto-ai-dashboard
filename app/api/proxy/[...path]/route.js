// app/api/proxy/[...path]/route.js
import { proxyFetch, rewriteLegacy } from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // IMPORTANT: no caching for proxy routes

function buildUpstreamPath(ctx) {
  const raw = "/" + ((ctx?.params?.path || []).join("/"));
  return rewriteLegacy(raw);
}

async function forward(req, ctx) {
  const upstreamPath = buildUpstreamPath(ctx);

  // Ensure no caching between Vercel/Next layers
  const headers = new Headers(req.headers);
  headers.set("cache-control", "no-store");

  // Recreate the Request so we can ensure headers are applied
  const req2 = new Request(req.url, {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer(),
    redirect: "manual",
  });

  return proxyFetch(req2, upstreamPath);
}

export async function GET(req, ctx) { return forward(req, ctx); }
export async function POST(req, ctx) { return forward(req, ctx); }
export async function PUT(req, ctx) { return forward(req, ctx); }
export async function PATCH(req, ctx) { return forward(req, ctx); }
export async function DELETE(req, ctx) { return forward(req, ctx); }

// Better OPTIONS for browser preflight
export async function OPTIONS(req) {
  const origin = req.headers.get("origin") || "*";
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization",
      "access-control-allow-credentials": "true",
      "vary": "Origin",
    },
  });
}

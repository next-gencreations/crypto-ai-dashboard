// app/api/proxy/[...path]/route.js
export const runtime = "nodejs";

import { proxyFetch, rewriteLegacy } from "../_lib";

function buildUpstreamPath(ctx) {
  const raw = "/" + ((ctx?.params?.path || []).join("/"));
  return rewriteLegacy(raw);
}

async function forward(req, ctx) {
  const upstreamPath = buildUpstreamPath(ctx);
  return proxyFetch(req, upstreamPath);
}

export async function GET(req, ctx) { return forward(req, ctx); }
export async function POST(req, ctx) { return forward(req, ctx); }
export async function PUT(req, ctx) { return forward(req, ctx); }
export async function PATCH(req, ctx) { return forward(req, ctx); }
export async function DELETE(req, ctx) { return forward(req, ctx); }

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "*",
    },
  });
}

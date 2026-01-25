export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { proxyFetch } from "../_lib";

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "*",
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req, { params }) {
  const upstreamPath = "/" + (params?.path || []).join("/");
  return proxyFetch(req, upstreamPath, "GET");
}

export async function POST(req, { params }) {
  const upstreamPath = "/" + (params?.path || []).join("/");
  return proxyFetch(req, upstreamPath, "POST");
}

export async function PUT(req, { params }) {
  const upstreamPath = "/" + (params?.path || []).join("/");
  return proxyFetch(req, upstreamPath, "PUT");
}

export async function PATCH(req, { params }) {
  const upstreamPath = "/" + (params?.path || []).join("/");
  return proxyFetch(req, upstreamPath, "PATCH");
}

export async function DELETE(req, { params }) {
  const upstreamPath = "/" + (params?.path || []).join("/");
  return proxyFetch(req, upstreamPath, "DELETE");
}

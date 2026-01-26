// app/api/proxy/[...path]/route.js
export const runtime = "nodejs";

import { proxyFetch } from "../_lib";

// GET /api/proxy/<anything>
export async function GET(req, { params }) {
  const path = "/" + (params?.path || []).join("/");
  return proxyFetch(req, path);
}

// POST /api/proxy/<anything>
export async function POST(req, { params }) {
  const path = "/" + (params?.path || []).join("/");
  return proxyFetch(req, path);
}

export async function PUT(req, { params }) {
  const path = "/" + (params?.path || []).join("/");
  return proxyFetch(req, path);
}

export async function PATCH(req, { params }) {
  const path = "/" + (params?.path || []).join("/");
  return proxyFetch(req, path);
}

export async function DELETE(req, { params }) {
  const path = "/" + (params?.path || []).join("/");
  return proxyFetch(req, path);
}

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

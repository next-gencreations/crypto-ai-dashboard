// app/api/proxy/[...path]/route.js
import { proxyUpstream } from "../_lib";

export const runtime = "nodejs";

function joinPath(params) {
  const parts = params?.path || [];
  const p = "/" + parts.join("/");
  return p;
}

function withCors(res) {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Vault-Token");
  headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  return new Response(res.body, { status: res.status, headers });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Vault-Token",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    },
  });
}

export async function GET(req, { params }) {
  const path = joinPath(params);
  const res = await proxyUpstream(req, path, "GET");
  return withCors(res);
}

export async function POST(req, { params }) {
  const path = joinPath(params);
  const res = await proxyUpstream(req, path, "POST");
  return withCors(res);
}

export async function PUT(req, { params }) {
  const path = joinPath(params);
  const res = await proxyUpstream(req, path, "PUT");
  return withCors(res);
}

export async function PATCH(req, { params }) {
  const path = joinPath(params);
  const res = await proxyUpstream(req, path, "PATCH");
  return withCors(res);
}

export async function DELETE(req, { params }) {
  const path = joinPath(params);
  const res = await proxyUpstream(req, path, "DELETE");
  return withCors(res);
}

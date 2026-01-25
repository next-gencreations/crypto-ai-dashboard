import { proxyUpstream } from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req, { params }) {
  const path = "/" + (params?.path || []).join("/");
  return proxyUpstream(req, path, "GET");
}

export async function POST(req, { params }) {
  const path = "/" + (params?.path || []).join("/");
  return proxyUpstream(req, path, "POST");
}

export async function PUT(req, { params }) {
  const path = "/" + (params?.path || []).join("/");
  return proxyUpstream(req, path, "PUT");
}

export async function PATCH(req, { params }) {
  const path = "/" + (params?.path || []).join("/");
  return proxyUpstream(req, path, "PATCH");
}

export async function DELETE(req, { params }) {
  const path = "/" + (params?.path || []).join("/");
  return proxyUpstream(req, path, "DELETE");
}

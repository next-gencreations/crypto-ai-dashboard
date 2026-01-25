import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE =
  process.env.CRYPTO_AI_API_URL ||
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://crypto-ai-api-1-7cte.onrender.com";

function pickHeaders(req) {
  const out = {};

  // forward vault token
  const vaultToken = req.headers.get("x-vault-token");
  if (vaultToken) out["x-vault-token"] = vaultToken;

  // forward auth if you ever use it
  const auth = req.headers.get("authorization");
  if (auth) out["authorization"] = auth;

  // forward content-type for POST/PUT/PATCH bodies
  const ct = req.headers.get("content-type");
  if (ct) out["content-type"] = ct;

  return out;
}

function withCors(res, contentType = "application/json") {
  res.headers.set("Content-Type", contentType);
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Vault-Token"
  );
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  return res;
}

async function proxy(req, params, methodOverride) {
  const pathParts = (params?.path || []).map(String);
  const upstreamPath = "/" + pathParts.join("/");

  // keep query string
  const url = new URL(req.url);
  const upstreamUrl = API_BASE + upstreamPath + (url.search || "");

  const method = (methodOverride || req.method || "GET").toUpperCase();

  const init = {
    method,
    headers: pickHeaders(req),
    cache: "no-store",
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const upstreamRes = await fetch(upstreamUrl, init);
    const text = await upstreamRes.text();
    const contentType =
      upstreamRes.headers.get("content-type") || "application/json";

    const res = new NextResponse(text, { status: upstreamRes.status });
    return withCors(res, contentType);
  } catch (err) {
    console.error("proxy error:", err);
    const res = NextResponse.json(
      { ok: false, error: "Proxy failed", detail: String(err) },
      { status: 500 }
    );
    return withCors(res, "application/json");
  }
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(req, { params }) {
  return proxy(req, params, "GET");
}
export async function POST(req, { params }) {
  return proxy(req, params, "POST");
}
export async function PUT(req, { params }) {
  return proxy(req, params, "PUT");
}
export async function PATCH(req, { params }) {
  return proxy(req, params, "PATCH");
}
export async function DELETE(req, { params }) {
  return proxy(req, params, "DELETE");
}

import { NextResponse } from "next/server";

const API_BASE = (process.env.API_URL || "https://crypto-ai-api-1-7cte.onrender.com").replace(/\/$/, "");

function buildTargetUrl(req, pathParts) {
  const url = new URL(req.url);
  const qs = url.search ? url.search : "";
  const path = (pathParts || []).join("/");
  return `${API_BASE}/${path}${qs}`;
}

async function proxy(req, ctx) {
  const pathParts = ctx?.params?.path || [];
  const target = buildTargetUrl(req, pathParts);

  // Forward token if present
  const token = req.headers.get("x-vault-token") || req.headers.get("X-Vault-Token") || "";

  const headers = new Headers();
  headers.set("Accept", "application/json");
  if (token) headers.set("X-Vault-Token", token);

  // Forward content-type only when body exists
  const method = req.method.toUpperCase();
  let body = undefined;

  if (method !== "GET" && method !== "HEAD") {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const json = await req.json().catch(() => ({}));
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(json || {});
    } else {
      // fallback: forward raw body
      body = await req.text().catch(() => "");
    }
  }

  const upstream = await fetch(target, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const text = await upstream.text();

  // CORS + passthrough
  const resp = new NextResponse(text, { status: upstream.status });
  resp.headers.set("Content-Type", upstream.headers.get("content-type") || "application/json");
  resp.headers.set("Access-Control-Allow-Origin", "*");
  resp.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  resp.headers.set("Access-Control-Allow-Headers", "Content-Type, X-Vault-Token");

  return resp;
}

export async function GET(req, ctx) {
  return proxy(req, ctx);
}
export async function POST(req, ctx) {
  return proxy(req, ctx);
}
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Vault-Token",
    },
  });
}

// app/api/proxy/[...path]/route.js
import { NextResponse } from "next/server";
import { upstreamBase, joinUrl } from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function forward(req, params) {
  const base = upstreamBase();

  if (!base) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_upstream_env",
        hint:
          "Set API_URL (recommended) or UPSTREAM_API_URL on Vercel to your Render base, e.g. https://xxxx.onrender.com",
      },
      { status: 500 }
    );
  }

  const { path = [] } = params || {};
  const url = new URL(req.url);

  // Build upstream path + querystring
  const upstreamPath = `/${path.join("/")}${url.search || ""}`;
  const upstreamUrl = joinUrl(base, upstreamPath);

  const method = req.method.toUpperCase();

  // Copy headers but drop host-related ones
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.set("accept", "application/json");

  // Read body only when needed
  let body;
  if (method !== "GET" && method !== "HEAD") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = JSON.stringify(await req.json().catch(() => ({})));
      headers.set("content-type", "application/json");
    } else {
      body = await req.text().catch(() => "");
    }
  }

  const res = await fetch(upstreamUrl, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const ct = res.headers.get("content-type") || "";
  const payload = ct.includes("application/json")
    ? await res.json().catch(() => ({}))
    : await res.text().catch(() => "");

  // Always respond JSON to the frontend
  if (typeof payload === "string") {
    return NextResponse.json(
      { ok: res.ok, status: res.status, text: payload },
      { status: res.ok ? 200 : res.status }
    );
  }

  return NextResponse.json(
    { ok: res.ok, status: res.status, ...payload },
    { status: res.ok ? 200 : res.status }
  );
}

export async function GET(req, { params }) {
  return forward(req, params);
}
export async function POST(req, { params }) {
  return forward(req, params);
}
export async function PUT(req, { params }) {
  return forward(req, params);
}
export async function DELETE(req, { params }) {
  return forward(req, params);
}

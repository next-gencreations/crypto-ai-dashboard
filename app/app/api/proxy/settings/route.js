// app/api/proxy/settings/route.js
import { NextResponse } from "next/server";
import { proxyGet, proxyPost } from "../_lib";

export async function GET() {
  const out = await proxyGet("/settings");
  return NextResponse.json(out);
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const out = await proxyPost("/settings", body);
  return NextResponse.json(out);
}

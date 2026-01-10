// app/api/proxy/logs/route.js
import { NextResponse } from "next/server";
import { proxyGet } from "../_lib";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") || "120";

  const out = await proxyGet(`/logs?limit=${encodeURIComponent(limit)}`);
  return NextResponse.json(out);
}

// app/api/proxy/ohlc/route.js
import { NextResponse } from "next/server";
import { proxyGet } from "../_lib";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const market = searchParams.get("market") || "BTCUSDT";
  const interval = searchParams.get("interval") || "60";
  const limit = searchParams.get("limit") || "600";

  // backend route confirmed from your screenshot: /ohlc
  const upstreamPath =
    `/ohlc?market=${encodeURIComponent(market)}` +
    `&interval=${encodeURIComponent(interval)}` +
    `&limit=${encodeURIComponent(limit)}`;

  const out = await proxyGet(upstreamPath);
  return NextResponse.json(out);
}

// app/api/proxy/ohlc/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { proxyGet } from "../_lib";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const market = searchParams.get("market") || "BTCUSDT";
  const interval = searchParams.get("interval") || "60";
  const limit = searchParams.get("limit") || "600";

  const upstreamPath =
    `/ohlc?market=${encodeURIComponent(market)}` +
    `&interval=${encodeURIComponent(interval)}` +
    `&limit=${encodeURIComponent(limit)}`;

  return proxyGet(req, upstreamPath);
}

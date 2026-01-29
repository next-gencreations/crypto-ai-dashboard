// app/api/proxy/ohlc/route.js
import { NextResponse } from "next/server";

const COINBASE = "https://api.exchange.coinbase.com";

function mapTfToGranularity(tf) {
  const s = String(tf || "").trim().toLowerCase();

  // allow numeric seconds too
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if ([60, 300, 900, 3600, 21600, 86400].includes(n)) return n;
  }

  // accept "1m/5m/15m/1h/6h/1d"
  const map = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1h": 3600,
    "6h": 21600,
    "1d": 86400,
  };

  return map[s] || 300;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const market = (searchParams.get("market") || "BTC-USD").toUpperCase();
  const tf = searchParams.get("tf") || "5m";
  const granularity = mapTfToGranularity(tf);

  const url = new URL(`${COINBASE}/products/${market}/candles`);
  url.searchParams.set("granularity", String(granularity));

  try {
    const r = await fetch(url.toString(), {
      headers: {
        "User-Agent": "crypto-ai-dashboard",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json({
        ok: false,
        source: "coinbase",
        market,
        tf,
        granularity,
        error: `Coinbase returned ${r.status}`,
        details: text?.slice(0, 500),
      });
    }

    const raw = await r.json();
    // Coinbase candles: [ time, low, high, open, close, volume ]
    const candles = (raw || [])
      .map((c) => ({
        t: c[0],
        o: c[3],
        h: c[2],
        l: c[1],
        c: c[4],
        v: c[5],
      }))
      .sort((a, b) => a.t - b.t);

    return NextResponse.json({
      ok: true,
      source: "coinbase",
      market,
      tf,
      granularity,
      time_utc: new Date().toISOString(),
      candles,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      source: "coinbase",
      market,
      tf,
      granularity,
      error: String(e?.message || e),
    });
  }
}

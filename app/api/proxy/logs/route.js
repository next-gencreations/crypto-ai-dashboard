// app/api/proxy/logs/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { proxyFetch } from "../_lib";

function toLine(e) {
  const t = e.time_utc || e.time || "";
  const type = e.type || "event";
  const msg = e.message || e.reason || "";
  return `${t} | ${type} | ${msg}`;
}

export async function GET(req) {
  // Fetch /data properly (status preserved)
  const res = await proxyFetch(req, "/data");

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, lines: [], error: `data_failed_${res.status}` },
      { status: 200 }
    );
  }

  const d = await res.json().catch(() => null);
  if (!d) {
    return NextResponse.json({ ok: false, lines: [], error: "data_non_json" }, { status: 200 });
  }

  const events = Array.isArray(d.events) ? d.events : [];
  const trades = Array.isArray(d.trades) ? d.trades : [];

  const tradeLines = trades.slice(-50).map((t) => {
    const time = t.time_utc || "";
    const m = t.market || "";
    const side = (t.side || "").toUpperCase();
    const pnl = Number(t.pnl_usd || 0).toFixed(2);
    const conf = t.confidence != null ? Number(t.confidence).toFixed(2) : "";
    const reason = t.reason || "";
    return `${time} | TRADE | ${m} ${side} pnl=${pnl} conf=${conf} ${reason}`;
  });

  const eventLines = events.slice(-80).map(toLine);
  const lines = [...eventLines, ...tradeLines].slice(-120);

  return NextResponse.json({ ok: true, lines }, { status: 200 });
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TradesPage() {
  const [data, setData] = useState(null);

  async function loadTrades() {
    try {
      const res = await fetch("/api/proxy/data?ts=" + Date.now());
      const json = await res.json();
      setData(json);
    } catch {
      setData({});
    }
  }

  useEffect(() => {
    loadTrades();
    const t = setInterval(loadTrades, 5000);
    return () => clearInterval(t);
  }, []);

  const trades =
    data?.trades ||
    data?.memory?.trades ||
    data?.stats?.trades ||
    [];

  return (
    <div className="pip-crt">
      <div className="pip-shell">
        <div className="pip-title">TRADE LOG</div>

        <div className="pip-panel">
          <Link className="pip-button" href="/">← BACK TO DASHBOARD</Link>
        </div>

        <div className="pip-panel">
          <div className="pip-heading">ALL TRADES</div>

          {trades.length === 0 ? (
            <div>No trades recorded yet. Let the bot run and build memory.</div>
          ) : (
            trades.map((t, i) => (
              <div key={i} className="trade-card">
                <div>PAIR: {t.pair || t.symbol || "—"}</div>
                <div>SIDE: {t.side || "—"}</div>
                <div>ENTRY: {t.entry || t.entry_price || "—"}</div>
                <div>EXIT: {t.exit || t.exit_price || "—"}</div>
                <div>PNL: {t.pnl ?? "—"}</div>
                <div>STATUS: {t.status || "—"}</div>
                <div>REASON: {t.reason || t.signal || "—"}</div>
              </div>
            ))
          )}
        </div>

        <style>{`
          .pip-button {
            color: #67ff9a;
            text-decoration: none;
            border: 1px solid rgba(0,255,136,0.55);
            padding: 12px;
            border-radius: 10px;
            display: inline-block;
          }

          .trade-card {
            border: 1px solid rgba(0,255,136,0.35);
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 12px;
            background: rgba(0,0,0,0.45);
          }
        `}</style>
      </div>
    </div>
  );
}

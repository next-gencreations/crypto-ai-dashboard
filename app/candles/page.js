"use client";

import React, { useEffect, useState } from "react";

function fmt(n) {
  if (n === null || n === undefined) return "-";
  const x = Number(n);
  if (Number.isNaN(x)) return String(n);
  return x.toFixed(2);
}

export default function CandlesPage() {
  const MARKETS = ["BTC-USD", "ETH-USD", "SOL-USD"];
  const TFS = ["1m", "5m", "15m", "1h", "6h", "1d"];

  const [market, setMarket] = useState("BTC-USD");
  const [tf, setTf] = useState("5m");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const r = await fetch(`/api/proxy/ohlc?market=${encodeURIComponent(market)}&tf=${encodeURIComponent(tf)}`, {
        cache: "no-store",
      });
      const j = await r.json();
      setData(j);
      if (!j.ok) setErr(j.error || "Failed to load candles");
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, tf]);

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>Candles (Coinbase)</h1>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {MARKETS.map((m) => (
          <button
            key={m}
            onClick={() => setMarket(m)}
            style={{
              padding: "8px 12px",
              borderRadius: 12,
              border: "1px solid #374151",
              background: market === m ? "#111827" : "#0b1220",
              color: "white",
              cursor: "pointer",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {TFS.map((t) => (
          <button
            key={t}
            onClick={() => setTf(t)}
            style={{
              padding: "6px 10px",
              borderRadius: 12,
              border: "1px solid #374151",
              background: tf === t ? "#111827" : "#0b1220",
              color: "white",
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}

        <button
          onClick={load}
          style={{
            padding: "6px 10px",
            borderRadius: 12,
            border: "1px solid #374151",
            background: "#0b1220",
            color: "white",
            cursor: "pointer",
            marginLeft: 8,
          }}
        >
          Refresh
        </button>
      </div>

      {err ? (
        <div style={{ padding: 12, border: "1px solid #7f1d1d", borderRadius: 12, background: "#1f0b0b", color: "#fecaca" }}>
          {err}
        </div>
      ) : null}

      <div style={{ marginTop: 12, padding: 12, borderRadius: 16, border: "1px solid #1f2937", background: "#0b1220", color: "white" }}>
        <div style={{ opacity: 0.8, marginBottom: 8 }}>
          Source: {data?.source || "-"} | Market: {market} | TF: {tf}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #1f2937" }}>
                <th style={{ padding: 8 }}>Time (UTC)</th>
                <th style={{ padding: 8 }}>Open</th>
                <th style={{ padding: 8 }}>High</th>
                <th style={{ padding: 8 }}>Low</th>
                <th style={{ padding: 8 }}>Close</th>
                <th style={{ padding: 8 }}>Vol</th>
              </tr>
            </thead>
            <tbody>
              {(data?.candles || []).slice(-60).reverse().map((c) => (
                <tr key={c.t} style={{ borderBottom: "1px solid #111827" }}>
                  <td style={{ padding: 8 }}>{new Date(c.t * 1000).toISOString()}</td>
                  <td style={{ padding: 8 }}>{fmt(c.o)}</td>
                  <td style={{ padding: 8 }}>{fmt(c.h)}</td>
                  <td style={{ padding: 8 }}>{fmt(c.l)}</td>
                  <td style={{ padding: 8 }}>{fmt(c.c)}</td>
                  <td style={{ padding: 8 }}>{fmt(c.v)}</td>
                </tr>
              ))}
              {!data?.candles?.length ? (
                <tr>
                  <td style={{ padding: 10, opacity: 0.7 }} colSpan={6}>
                    No candles loaded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useMemo, useState } from "react";

function tvInterval(tf) {
  const map = { "1m": "1", "5m": "5", "15m": "15", "1h": "60", "4h": "240", "1d": "D" };
  return map[tf] || "5";
}

function TradingViewEmbed({ symbol, tf }) {
  const interval = tvInterval(tf);

  const src = useMemo(() => {
    const params = new URLSearchParams({
      symbol,
      interval,
      theme: "dark",
      style: "1",
      locale: "en",
      toolbarbg: "#1f2937",
      enable_publishing: "false",
      hide_top_toolbar: "false",
      hide_legend: "false",
      saveimage: "false",
      container_id: "tv_chart",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [symbol, interval]);

  return (
    <div style={{ width: "100%", height: "560px", borderRadius: 16, overflow: "hidden" }}>
      <iframe
        title="TradingView"
        src={src}
        style={{ width: "100%", height: "100%", border: "0" }}
        allowFullScreen
      />
    </div>
  );
}

export default function CryptoPage() {
  const SYMBOLS = [
    { label: "BTC", symbol: "COINBASE:BTCUSD" },
    { label: "ETH", symbol: "COINBASE:ETHUSD" },
    { label: "SOL", symbol: "COINBASE:SOLUSD" },
  ];

  const TFS = ["1m", "5m", "15m", "1h", "4h", "1d"];

  const [sym, setSym] = useState(SYMBOLS[0].symbol);
  const [tf, setTf] = useState("5m");

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>Crypto</h1>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {SYMBOLS.map((s) => (
          <button
            key={s.symbol}
            onClick={() => setSym(s.symbol)}
            style={{
              padding: "8px 12px",
              borderRadius: 12,
              border: "1px solid #374151",
              background: sym === s.symbol ? "#111827" : "#0b1220",
              color: "white",
              cursor: "pointer",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
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
      </div>

      <TradingViewEmbed symbol={sym} tf={tf} />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

function TradingViewEmbed({ symbol = "BINANCE:BTCUSDT", interval = "5" }) {
  const src =
    "https://s.tradingview.com/widgetembed/?" +
    new URLSearchParams({
      symbol,
      interval,
      theme: "dark",
      style: "1",
      locale: "en",
      toolbarbg: "#06110a",
      enable_publishing: "false",
      hide_side_toolbar: "false",
      allow_symbol_change: "true",
      save_image: "false",
      studies: "",
    }).toString();

  return (
    <div className="pip-chartwrap" style={{ padding: 0, overflow: "hidden" }}>
      <iframe
        title="TradingView"
        src={src}
        style={{ width: "100%", height: 520, border: 0, display: "block" }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export default function CryptoPage() {
  const [tvSymbol, setTvSymbol] = useState("BINANCE:BTCUSDT");
  const [tvInterval, setTvInterval] = useState("5");

  return (
    <>
      <div className="pip-topbar">
        <div className="pip-title">PIP-TRADE 3000</div>
        <div className="pip-sub wrap">CRYPTO · TradingView</div>
      </div>

      <div className="pip-links">
        <Link className="pip-link" href="/">HOME</Link>
        <Link className="pip-link" href="/candles">CANDLES</Link>
        <Link className="pip-link active" href="/crypto">CRYPTO</Link>
      </div>

      <div className="pip-content">
        <div className="pip-panel">
          <div className="pip-heading">
            CRYPTO CHART · {tvSymbol} · {tvInterval}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
            <span className="pip-muted">Symbol:</span>
            <button className={`pip-tab ${tvSymbol === "BINANCE:BTCUSDT" ? "active" : ""}`} onClick={() => setTvSymbol("BINANCE:BTCUSDT")}>
              BTC
            </button>
            <button className={`pip-tab ${tvSymbol === "BINANCE:ETHUSDT" ? "active" : ""}`} onClick={() => setTvSymbol("BINANCE:ETHUSDT")}>
              ETH
            </button>
            <button className={`pip-tab ${tvSymbol === "BINANCE:SOLUSDT" ? "active" : ""}`} onClick={() => setTvSymbol("BINANCE:SOLUSDT")}>
              SOL
            </button>

            <span className="pip-muted" style={{ marginLeft: 10 }}>TF:</span>
            <button className={`pip-tab ${tvInterval === "1" ? "active" : ""}`} onClick={() => setTvInterval("1")}>
              1M
            </button>
            <button className={`pip-tab ${tvInterval === "5" ? "active" : ""}`} onClick={() => setTvInterval("5")}>
              5M
            </button>
            <button className={`pip-tab ${tvInterval === "15" ? "active" : ""}`} onClick={() => setTvInterval("15")}>
              15M
            </button>
            <button className={`pip-tab ${tvInterval === "60" ? "active" : ""}`} onClick={() => setTvInterval("60")}>
              1H
            </button>
          </div>

          <TradingViewEmbed symbol={tvSymbol} interval={tvInterval} />

          <div className="pip-muted" style={{ marginTop: 10 }}>
            External chart is TradingView iframe. Your bot candles are on the CANDLES page.
          </div>
        </div>
      </div>
    </>
  );
}

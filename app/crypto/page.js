"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
        style={{ width: "100%", height: 560, border: 0, display: "block" }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export default function CryptoPage() {
  const [symbol, setSymbol] = useState("BINANCE:BTCUSDT");
  const [tf, setTf] = useState("5");

  const title = useMemo(() => `CRYPTO CHART · ${symbol} · ${tf}`, [symbol, tf]);

  return (
    <div className="pip-crt">
      <div className="pip-shell">
        <div className="pip-topbar">
          <div>
            <div className="pip-title">PIP-TRADE 3000</div>
            <div className="pip-sub wrap">{title}</div>
          </div>
        </div>

        <div className="pip-links">
          <Link className="pip-link" href="/">HOME</Link>
          <Link className="pip-link" href="/candles">CANDLES</Link>
          <Link className="pip-link active" href="/crypto">CRYPTO</Link>
        </div>

        <div className="pip-content">
          <div className="pip-panel">
            <div className="pip-heading">TRADINGVIEW</div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
              <span className="pip-muted">Symbol:</span>
              <button className={`pip-tab ${symbol === "BINANCE:BTCUSDT" ? "active" : ""}`} onClick={() => setSymbol("BINANCE:BTCUSDT")}>BTC</button>
              <button className={`pip-tab ${symbol === "BINANCE:ETHUSDT" ? "active" : ""}`} onClick={() => setSymbol("BINANCE:ETHUSDT")}>ETH</button>
              <button className={`pip-tab ${symbol === "BINANCE:SOLUSDT" ? "active" : ""}`} onClick={() => setSymbol("BINANCE:SOLUSDT")}>SOL</button>

              <span className="pip-muted" style={{ marginLeft: 10 }}>TF:</span>
              <button className={`pip-tab ${tf === "1" ? "active" : ""}`} onClick={() => setTf("1")}>1M</button>
              <button className={`pip-tab ${tf === "5" ? "active" : ""}`} onClick={() => setTf("5")}>5M</button>
              <button className={`pip-tab ${tf === "15" ? "active" : ""}`} onClick={() => setTf("15")}>15M</button>
              <button className={`pip-tab ${tf === "60" ? "active" : ""}`} onClick={() => setTf("60")}>1H</button>
            </div>

            <TradingViewEmbed symbol={symbol} interval={tf} />

            <div className="pip-muted" style={{ marginTop: 10 }}>
              External chart is TradingView iframe. Your bot candles are on the Candles page.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

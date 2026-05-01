"use client";

import Link from "next/link";

export default function ChartPage() {
  return (
    <div className="pip-crt">
      <div className="pip-shell">
        <div className="pip-title">COINBASE CHART</div>

        <div className="pip-panel">
          <Link className="pip-button" href="/">← BACK TO DASHBOARD</Link>
        </div>

        <div className="pip-panel">
          <div className="pip-heading">BTC / USD LIVE CHART</div>

          <iframe
            src="https://www.tradingview.com/widgetembed/?symbol=COINBASE%3ABTCUSD&interval=15&theme=dark&style=1"
            style={{
              width: "100%",
              height: "620px",
              border: "1px solid #00ff88",
              borderRadius: "12px",
              background: "#000",
            }}
          />
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
        `}</style>
      </div>
    </div>
  );
}

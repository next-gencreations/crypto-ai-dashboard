"use client";

import { useEffect, useState } from "react";
import VaultCompanion from "./components/VaultCompanion";

const REFRESH_MS = 4000;

function pickLatestEquityUSD(data) {
  const direct = Number(data?.equity);
  if (Number.isFinite(direct)) return direct;

  const hb = Number(data?.heartbeat?.equity_usd);
  if (Number.isFinite(hb)) return hb;

  return 0;
}

function pickPnlToday(data) {
  return Number(data?.pnl_today || 0);
}

function pickOpenPositions(data) {
  return Number(data?.open_positions_count || 0);
}

export default function HomePage() {
  const [data, setData] = useState(null);
  const [lastGood, setLastGood] = useState(null);
  const [err, setErr] = useState("");
  const [lastUpdate, setLastUpdate] = useState(0);

  async function fetchData() {
    try {
      const res = await fetch("/api/proxy/data?ts=" + Date.now());

      if (!res.ok) throw new Error("API error");

      const json = await res.json();

      setData(json);
      setLastGood(json);
      setLastUpdate(Date.now());
      setErr("");

    } catch (e) {
      setErr("SIGNAL LOST");

      // 🧠 keep last working data so UI doesn't reset
      if (lastGood) setData(lastGood);
    }
  }

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  const equity = pickLatestEquityUSD(data || {});
  const pnl = pickPnlToday(data || {});
  const positions = pickOpenPositions(data || {});

  const secondsAgo = Math.floor((Date.now() - lastUpdate) / 1000);

  let status = "OFFLINE";
  if (secondsAgo < 10) status = "ACTIVE";
  else if (secondsAgo < 30) status = "WEAK SIGNAL";

  return (
    <div className="pip-crt">
      <div className="pip-shell">

        <div className="pip-title">PIP-TRADE 3000</div>

        {/* 🟢 STATUS LINE (very Fallout style) */}
        <div style={{ marginBottom: 10 }}>
          STATUS: {status} • {secondsAgo}s ago
        </div>

        {err && (
          <div className="pip-panel">
            ⚠️ {err}
          </div>
        )}

        <div className="pip-panel">
          <div className="pip-heading">SYSTEM STATUS</div>

          <div>EQUITY: ${equity.toFixed(2)}</div>

          <div style={{ color: pnl >= 0 ? "#00ff88" : "#ff5555" }}>
            TODAY: {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
          </div>

          <div>POSITIONS: {positions}</div>
        </div>

        <div className="pip-panel">
          <div className="pip-heading">VAULT COMPANION</div>

          <VaultCompanion
            pnlToday={pnl}
            equity={equity}
            openPositions={positions}
          />
        </div>

      </div>
    </div>
  );
}

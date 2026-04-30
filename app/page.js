"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultCompanion from "./components/VaultCompanion";

const REFRESH_MS = 5000;

function pickLatestEquityUSD(data) {
  // ✅ YOUR RENDER BOT FORMAT
  const direct = Number(data?.equity);
  if (Number.isFinite(direct)) return direct;

  // fallback (old system)
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
  const [err, setErr] = useState("");

  async function fetchData() {
    try {
      const res = await fetch("/api/proxy/data?ts=" + Date.now());
      const json = await res.json();
      setData(json);
      setErr("");
    } catch (e) {
      setErr("API error");
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

  return (
    <div className="pip-crt">
      <div className="pip-shell">

        <div className="pip-title">PIP-TRADE 3000</div>

        {err && <div className="pip-panel">ERROR: {err}</div>}

        <div className="pip-panel">
          <div className="pip-heading">SYSTEM STATUS</div>

          <div>EQUITY: ${equity.toFixed(2)}</div>
          <div>TODAY: {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}</div>
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

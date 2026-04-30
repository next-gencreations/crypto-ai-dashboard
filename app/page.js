"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

function pickLossStreak(data) {
  return Number(data?.brain?.loss_streak || 0);
}

function pickMode(data) {
  return String(data?.mode || data?.status || "UNKNOWN").toUpperCase();
}

export default function HomePage() {
  const [data, setData] = useState(null);
  const [lastGood, setLastGood] = useState(null);
  const [err, setErr] = useState("");
  const [lastUpdate, setLastUpdate] = useState(0);
  const [booting, setBooting] = useState(true);

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
      if (lastGood) setData(lastGood);
    }
  }

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const bootTimer = setTimeout(() => setBooting(false), 3200);
    return () => clearTimeout(bootTimer);
  }, []);

  const safe = data || lastGood || {};

  const equity = pickLatestEquityUSD(safe);
  const pnl = pickPnlToday(safe);
  const positions = pickOpenPositions(safe);
  const lossStreak = pickLossStreak(safe);
  const mode = pickMode(safe);

  const secondsAgo = lastUpdate
    ? Math.floor((Date.now() - lastUpdate) / 1000)
    : 999;

  let status = "OFFLINE";
  if (secondsAgo < 10) status = "ACTIVE";
  else if (secondsAgo < 30) status = "WEAK SIGNAL";

  if (booting) {
    return (
      <div className="boot-screen">
        <style>{`
          .boot-screen {
            min-height: 100vh;
            background:
              radial-gradient(circle at center, rgba(0,255,136,0.18), transparent 35%),
              linear-gradient(180deg, #001a0b 0%, #000 70%);
            color: #67ff9a;
            font-family: "Courier New", monospace;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }

          .vault-door {
            width: 280px;
            height: 280px;
            border: 8px solid #67ff9a;
            border-radius: 50%;
            box-shadow:
              0 0 30px rgba(0,255,136,0.55),
              inset 0 0 35px rgba(0,255,136,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: doorOpen 3.2s ease forwards;
            position: relative;
          }

          .vault-door::before {
            content: "";
            width: 110px;
            height: 110px;
            border: 6px solid #67ff9a;
            border-radius: 50%;
            box-shadow: inset 0 0 20px rgba(0,255,136,0.4);
          }

          .boot-text {
            position: absolute;
            bottom: 12%;
            text-align: center;
            letter-spacing: 3px;
            animation: flicker 0.2s infinite alternate;
          }

          @keyframes doorOpen {
            0% { transform: scale(1) rotate(0deg); opacity: 1; }
            55% { transform: scale(1.05) rotate(180deg); opacity: 1; }
            100% { transform: scale(4) rotate(360deg); opacity: 0; }
          }

          @keyframes flicker {
            from { opacity: 0.65; }
            to { opacity: 1; }
          }
        `}</style>

        <div className="vault-door"></div>

        <div className="boot-text">
          NUCLEAR VAULT OPENING<br />
          PIP-TRADE 3000 BOOT SEQUENCE
        </div>
      </div>
    );
  }

  return (
    <div className="pip-crt">
      <div className="pip-shell">
        <div className="pip-title">PIP-TRADE 3000</div>

        <div style={{ marginBottom: 14 }}>
          STATUS: {status} • MODE: {mode} • HEARTBEAT:{" "}
          {secondsAgo >= 999 ? "—" : `${secondsAgo}s ago`}
        </div>

        <div className="pip-panel">
          <div className="pip-heading">COMMAND DECK</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <Link className="pip-button" href="/">
              DASHBOARD
            </Link>
            <Link className="pip-button" href="/chart">
              COINBASE CHART
            </Link>
            <Link className="pip-button" href="/trades">
              TRADE LOG
            </Link>
            <Link className="pip-button" href="/vault">
              KEY VAULT
            </Link>
          </div>
        </div>

        {err && <div className="pip-panel">⚠️ {err}</div>}

        <div className="pip-panel">
          <div className="pip-heading">SYSTEM STATUS</div>

          <div>EQUITY: ${equity.toFixed(2)}</div>

          <div style={{ color: pnl >= 0 ? "#00ff88" : "#ff5555" }}>
            TODAY: {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
          </div>

          <div>POSITIONS: {positions}</div>
          <div>LOSS STREAK: {lossStreak}</div>
        </div>

        <div className="pip-panel">
          <div className="pip-heading">VAULT COMPANION</div>

          <VaultCompanion
            pnlToday={pnl}
            equity={equity}
            openPositions={positions}
            lossStreak={lossStreak}
            secondsAgo={secondsAgo}
            memory={safe?.memory || {}}
            stats={safe?.stats || {}}
            brain={safe?.brain || {}}
          />
        </div>

        <style>{`
          .pip-button {
            border: 1px solid rgba(0,255,136,0.55);
            color: #67ff9a;
            background: #001c0b;
            text-decoration: none;
            padding: 12px;
            border-radius: 10px;
            text-align: center;
            font-weight: 900;
            letter-spacing: 1px;
            box-shadow: inset 0 0 12px rgba(0,255,136,0.08);
          }

          .pip-button:active {
            transform: scale(0.98);
          }
        `}</style>
      </div>
    </div>
  );
}

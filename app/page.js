"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import VaultCompanion from "./components/VaultCompanion";

const REFRESH_MS = 4000;
const INTRO_URL =
  "https://wofr85ahprzdmtaz.public.blob.vercel-storage.com/vault-intro.mp4";

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

function pickMarkets(data) {
  const runtime = data?.runtime_universe;
  if (Array.isArray(runtime) && runtime.length) return runtime;

  const universe = data?.universe;
  if (Array.isArray(universe) && universe.length) return universe;

  return ["BTC-USD"];
}

function pickVaultState({ status, pnl, positions, lossStreak, secondsAgo }) {
  if (status === "OFFLINE") {
    return {
      state: "SIGNAL LOST",
      line: "RECONNECTING TO RENDER CORE",
      mood: "offline",
    };
  }

  if (lossStreak >= 5) {
    return {
      state: "CRYO SLEEP",
      line: "LOSS STREAK PROTECTION ACTIVE",
      mood: "cryo",
    };
  }

  if (lossStreak >= 3) {
    return {
      state: "CRYO WARNING",
      line: "DEFENSIVE MODE ARMED",
      mood: "warning",
    };
  }

  if (positions > 0) {
    return {
      state: "ENGAGED",
      line: "LIVE POSITION UNDER WATCH",
      mood: pnl >= 0 ? "focused" : "pressure",
    };
  }

  if (pnl > 0.05) {
    return {
      state: "ENERGISED",
      line: "PROFIT MEMORY FEEDING CORE",
      mood: "happy",
    };
  }

  if (pnl < -0.05) {
    return {
      state: "UNDER PRESSURE",
      line: "SMALL DAMAGE DETECTED",
      mood: "weak",
    };
  }

  if (secondsAgo < 30) {
    return {
      state: "HUNTER MODE",
      line: "SCANNING FOR CLEAN ENTRY",
      mood: "hunter",
    };
  }

  return {
    state: "PATIENT",
    line: "WAITING FOR MARKET EDGE",
    mood: "idle",
  };
}

export default function HomePage() {
  const [booting, setBooting] = useState(true);
  const [data, setData] = useState(null);
  const [lastGood, setLastGood] = useState(null);
  const [err, setErr] = useState("");
  const [lastUpdate, setLastUpdate] = useState(0);

  async function fetchData() {
    try {
      const res = await fetch("/api/proxy/data?ts=" + Date.now(), {
        cache: "no-store",
      });

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
    const t = setTimeout(() => setBooting(false), 10000);
    return () => clearTimeout(t);
  }, []);

  const safe = data || lastGood || {};

  const equity = pickLatestEquityUSD(safe);
  const pnl = pickPnlToday(safe);
  const positions = pickOpenPositions(safe);
  const lossStreak = pickLossStreak(safe);
  const mode = pickMode(safe);
  const markets = pickMarkets(safe);

  const secondsAgo = lastUpdate
    ? Math.floor((Date.now() - lastUpdate) / 1000)
    : 999;

  let status = "OFFLINE";
  if (secondsAgo < 10) status = "ACTIVE";
  else if (secondsAgo < 30) status = "WEAK SIGNAL";

  const vault = pickVaultState({
    status,
    pnl,
    positions,
    lossStreak,
    secondsAgo,
  });

  if (booting) {
    return (
      <div className="introWrap">
        <video
          className="introVideo"
          src={INTRO_URL}
          autoPlay
          muted
          playsInline
          onEnded={() => setBooting(false)}
        />

        <button className="skipBtn" onClick={() => setBooting(false)}>
          SKIP
        </button>

        <style>{`
          .introWrap {
            position: fixed;
            inset: 0;
            background: black;
            z-index: 9999;
            overflow: hidden;
          }

          .introVideo {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .skipBtn {
            position: fixed;
            right: 16px;
            bottom: 16px;
            background: rgba(0,0,0,0.65);
            color: #67ff9a;
            border: 1px solid #67ff9a;
            border-radius: 10px;
            padding: 10px 14px;
            font-family: "Courier New", monospace;
            z-index: 10000;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="pip-crt">
      <div className="pip-shell">
        <div className="pip-title">PIP-TRADE 3000</div>

        <div className="pip-subline">
          STATUS: {status} • MODE: {mode} • HEARTBEAT:{" "}
          {secondsAgo >= 999 ? "—" : `${secondsAgo}s ago`}
        </div>

        <div className="pip-panel hunter-panel">
          <div className="pip-heading">HUNTER MODE</div>
          <div>STATE: {vault.state}</div>
          <div>{vault.line}</div>
          <div>WATCHLIST: {markets.join(", ")}</div>
        </div>

        <div className="pip-panel">
          <div className="pip-heading">COMMAND DECK</div>

          <div className="command-grid">
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

        {err && <div className="pip-panel warning">⚠️ {err}</div>}

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
            vaultState={vault.state}
            vaultMood={vault.mood}
            vaultLine={vault.line}
          />
        </div>

        <style>{`
          .pip-subline {
            margin-bottom: 14px;
            opacity: 0.95;
          }

          .hunter-panel {
            border-color: rgba(0,255,136,0.9);
            box-shadow:
              0 0 16px rgba(0,255,136,0.16),
              inset 0 0 20px rgba(0,255,136,0.08);
          }

          .command-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

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

          .warning {
            color: #ffdd55;
          }
        `}</style>
      </div>
    </div>
  );
}

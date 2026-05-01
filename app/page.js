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
    const bootTimer = setTimeout(() => setBooting(false), 4300);

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
      <div className="vault-boot">
        <style>{`
          .vault-boot {
            position: fixed;
            inset: 0;
            background:
              radial-gradient(circle at center, rgba(0,255,136,0.08), transparent 42%),
              linear-gradient(180deg, #1f1a12 0%, #050505 58%, #000 100%);
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: "Courier New", monospace;
            color: #67ff9a;
          }

          .film-frame {
            position: absolute;
            inset: 16px;
            border: 8px solid rgba(0,0,0,0.85);
            border-radius: 18px;
            box-shadow:
              inset 0 0 35px rgba(0,0,0,0.9),
              0 0 40px rgba(0,0,0,0.9);
            pointer-events: none;
            z-index: 20;
          }

          .vault-scene {
            width: 100%;
            height: 100%;
            position: relative;
            background:
              linear-gradient(90deg, rgba(0,0,0,0.65), transparent 18%, transparent 82%, rgba(0,0,0,0.65)),
              radial-gradient(circle at 50% 48%, rgba(0,255,136,0.09), transparent 44%),
              linear-gradient(180deg, #b59a68 0%, #7b6642 42%, #2f2a20 100%);
            overflow: hidden;
          }

          .sky-haze {
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at 18% 18%, rgba(255,245,190,0.45), transparent 28%),
              linear-gradient(180deg, rgba(255,225,150,0.18), transparent 45%);
            opacity: 0.55;
          }

          .ground {
            position: absolute;
            left: -10%;
            right: -10%;
            bottom: -8%;
            height: 34%;
            background:
              radial-gradient(circle at 30% 20%, rgba(20,15,8,0.45), transparent 12%),
              radial-gradient(circle at 72% 42%, rgba(20,15,8,0.35), transparent 10%),
              linear-gradient(180deg, #89734a 0%, #4a3c26 100%);
            transform: skewY(-2deg);
          }

          .ruins-left {
            position: absolute;
            left: 7%;
            top: 14%;
            width: 12%;
            height: 34%;
            background:
              linear-gradient(90deg, rgba(55,45,32,0.9), rgba(90,74,52,0.68));
            clip-path: polygon(0 18%, 18% 0, 45% 16%, 60% 4%, 100% 24%, 100% 100%, 0 100%);
            opacity: 0.42;
          }

          .ruins-right {
            position: absolute;
            right: 7%;
            top: 23%;
            width: 14%;
            height: 24%;
            background: rgba(50,42,30,0.45);
            clip-path: polygon(0 30%, 20% 10%, 40% 22%, 58% 0, 100% 18%, 100% 100%, 0 100%);
          }

          .bunker {
            position: absolute;
            left: 50%;
            top: 51%;
            width: min(78vw, 760px);
            height: min(42vw, 390px);
            transform: translate(-50%, -50%);
            background:
              linear-gradient(90deg, #6d6045 0%, #a08d63 20%, #756747 42%, #342e26 100%);
            clip-path: polygon(0 18%, 28% 5%, 100% 0, 100% 100%, 0 100%);
            box-shadow:
              0 26px 45px rgba(0,0,0,0.55),
              inset 0 0 40px rgba(0,0,0,0.42);
            border: 3px solid rgba(0,0,0,0.35);
          }

          .bunker-ribs {
            position: absolute;
            left: 0;
            top: 0;
            width: 43%;
            height: 100%;
            display: flex;
            gap: 3.4%;
            padding-left: 3%;
            box-sizing: border-box;
            transform: skewX(-8deg);
          }

          .rib {
            width: 8%;
            height: 100%;
            background:
              linear-gradient(90deg, rgba(255,235,170,0.35), rgba(50,38,25,0.55));
            box-shadow: 6px 0 10px rgba(0,0,0,0.28);
          }

          .door-bay {
            position: absolute;
            right: 7%;
            top: 17%;
            width: 45%;
            height: 70%;
            border-radius: 42% / 24%;
            background:
              radial-gradient(circle at center, rgba(0,0,0,0.65), rgba(0,0,0,0.96) 66%),
              #111;
            border: 8px solid #2d2a24;
            box-shadow:
              inset 0 0 38px rgba(0,0,0,0.95),
              0 0 10px rgba(255,190,40,0.22);
            overflow: hidden;
          }

          .warning-ring {
            position: absolute;
            inset: 8px;
            border-radius: 42% / 24%;
            border: 5px solid rgba(255,178,34,0.45);
            box-shadow: inset 0 0 18px rgba(255,178,34,0.12);
          }

          .vault-glow {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at center, rgba(0,255,136,0.85), rgba(0,50,20,0.45) 34%, rgba(0,0,0,0.96) 65%);
            opacity: 0;
            animation: glowIn 4.2s ease forwards;
          }

          .vault-door {
            position: absolute;
            left: 50%;
            top: 50%;
            width: 58%;
            height: 82%;
            transform: translate(-50%, -50%);
            border-radius: 45% / 26%;
            background:
              radial-gradient(circle at center, #2e2d29 0%, #161616 58%, #080808 100%);
            border: 5px solid #30302a;
            box-shadow:
              inset 0 0 25px rgba(0,0,0,0.9),
              0 0 18px rgba(0,0,0,0.7);
            animation: doorSlide 4.2s cubic-bezier(.55,.02,.24,1) forwards;
            transform-origin: left center;
            z-index: 4;
          }

          .vault-door::before {
            content: "";
            position: absolute;
            inset: 18%;
            border-radius: 50%;
            border: 5px solid rgba(85,82,70,0.9);
            box-shadow: inset 0 0 18px rgba(0,0,0,0.8);
          }

          .vault-door::after {
            content: "4";
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255,180,35,0.78);
            font-size: clamp(36px, 7vw, 82px);
            font-weight: 900;
            text-shadow: 0 0 12px rgba(0,0,0,0.9);
          }

          .steps {
            position: absolute;
            right: 19%;
            top: 84%;
            width: 20%;
            height: 18%;
            background:
              repeating-linear-gradient(
                180deg,
                rgba(45,37,28,0.95) 0px,
                rgba(45,37,28,0.95) 8px,
                rgba(12,10,8,0.95) 9px,
                rgba(12,10,8,0.95) 15px
              );
            transform: perspective(120px) rotateX(42deg);
            opacity: 0.9;
          }

          .boot-copy {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 7%;
            text-align: center;
            color: #67ff9a;
            font-size: clamp(13px, 3vw, 22px);
            letter-spacing: 4px;
            text-shadow: 0 0 10px rgba(0,255,136,0.7);
            animation: flicker 0.18s infinite alternate;
            z-index: 30;
          }

          .scanlines {
            position: absolute;
            inset: 0;
            background:
              repeating-linear-gradient(
                180deg,
                rgba(255,255,255,0.035) 0px,
                rgba(255,255,255,0.035) 1px,
                transparent 2px,
                transparent 5px
              );
            mix-blend-mode: overlay;
            pointer-events: none;
            z-index: 25;
          }

          .dust {
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at 24% 76%, rgba(255,230,170,0.18), transparent 12%),
              radial-gradient(circle at 54% 72%, rgba(255,230,170,0.12), transparent 14%),
              radial-gradient(circle at 71% 64%, rgba(255,230,170,0.15), transparent 10%);
            filter: blur(8px);
            opacity: 0.65;
            animation: dustMove 4.2s ease forwards;
            z-index: 18;
          }

          @keyframes doorSlide {
            0% {
              transform: translate(-50%, -50%) scale(1) rotate(0deg);
              opacity: 1;
            }
            35% {
              transform: translate(-50%, -50%) scale(0.98) rotate(-2deg);
              opacity: 1;
            }
            100% {
              transform: translate(95%, -50%) scale(0.92) rotate(-7deg);
              opacity: 0.2;
            }
          }

          @keyframes glowIn {
            0% { opacity: 0; }
            45% { opacity: 0.12; }
            100% { opacity: 1; }
          }

          @keyframes flicker {
            from { opacity: 0.72; }
            to { opacity: 1; }
          }

          @keyframes dustMove {
            0% { transform: translateX(-12px); opacity: 0.25; }
            100% { transform: translateX(22px); opacity: 0.75; }
          }

          @media (max-width: 720px) {
            .film-frame {
              inset: 8px;
              border-width: 5px;
            }

            .bunker {
              width: 92vw;
              height: 52vw;
              top: 48%;
            }

            .door-bay {
              right: 5%;
              width: 48%;
            }

            .boot-copy {
              bottom: 9%;
            }
          }
        `}</style>

        <div className="vault-scene">
          <div className="sky-haze" />
          <div className="ruins-left" />
          <div className="ruins-right" />
          <div className="ground" />

          <div className="bunker">
            <div className="bunker-ribs">
              <div className="rib" />
              <div className="rib" />
              <div className="rib" />
              <div className="rib" />
              <div className="rib" />
              <div className="rib" />
              <div className="rib" />
            </div>

            <div className="door-bay">
              <div className="vault-glow" />
              <div className="warning-ring" />
              <div className="vault-door" />
            </div>

            <div className="steps" />
          </div>

          <div className="dust" />
          <div className="scanlines" />
          <div className="film-frame" />

          <div className="boot-copy">
            NUCLEAR BUNKER VAULT OPENING
            <br />
            PIP-TRADE 3000 ACCESS GRANTED
          </div>
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

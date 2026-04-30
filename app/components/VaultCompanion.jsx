"use client";

import { useEffect, useState } from "react";

function getMood({ pnl, positions, lossStreak, secondsAgo, memory }) {
  if (secondsAgo > 30) return "cryo";
  if (lossStreak >= 5) return "zombie";
  if (pnl < -15) return "zombie";
  if (pnl < -5 || lossStreak >= 3) return "sick";
  if (pnl < 0) return "weak";
  if (positions > 0) return "thriving";
  if (pnl > 10) return "happy";
  if (pnl > 0) return "idle";

  if (memory?.total > 0 && memory?.win_rate >= 0.55) return "happy";

  return "idle";
}

export default function VaultCompanion({
  pnlToday = 0,
  equity = 0,
  openPositions = 0,
  lossStreak = 0,
  secondsAgo = 0,
  memory = {},
  stats = {},
  brain = {},
}) {
  const [displayMood, setDisplayMood] = useState("idle");

  const mood = getMood({
    pnl: pnlToday,
    positions: openPositions,
    lossStreak,
    secondsAgo,
    memory,
  });

  useEffect(() => {
    const t = setTimeout(() => setDisplayMood(mood), 300);
    return () => clearTimeout(t);
  }, [mood]);

  const img = `/companion/vaultgirl/vaultgirl_${displayMood}.png`;

  const heartbeat =
    secondsAgo < 10 ? "STRONG" : secondsAgo < 30 ? "WEAK" : "LOST";

  const statusText =
    heartbeat === "LOST"
      ? "COMMS LOST · CRYO STANDBY"
      : displayMood === "zombie"
      ? "CRITICAL · PROTECT THE VAULT"
      : displayMood === "sick"
      ? "UNSTABLE · LOSS CONTROL"
      : displayMood === "weak"
      ? "UNDER PRESSURE"
      : displayMood === "thriving"
      ? "TRADE ACTIVE · FOCUSED"
      : displayMood === "happy"
      ? "PROFIT FLOW · VAULT STABLE"
      : "WAITING FOR CLEAN SIGNAL";

  return (
    <div
      style={{
        border: "2px solid #00ff88",
        padding: 12,
        textAlign: "center",
        background: "#000",
        color: "#00ff88",
      }}
    >
      <h3>VAULT GIRL · RENDER MEMORY CORE</h3>

      <img
        src={img}
        alt={displayMood}
        style={{
          width: 220,
          maxWidth: "80%",
          opacity: heartbeat === "LOST" ? 0.35 : 1,
          transition: "all 0.5s ease",
        }}
        onError={(e) => {
          e.currentTarget.src = "/companion/vaultgirl/vaultgirl_idle.png";
        }}
      />

      <div style={{ marginTop: 10 }}>
        <div>STATE: {displayMood.toUpperCase()}</div>
        <div>{statusText}</div>
        <div>HEARTBEAT: {heartbeat}</div>
        <div>EQUITY: ${Number(equity).toFixed(2)}</div>

        <div style={{ color: pnlToday >= 0 ? "#00ff88" : "#ff5555" }}>
          TODAY: {pnlToday >= 0 ? "+" : ""}${Number(pnlToday).toFixed(2)}
        </div>

        <div>TRADES ACTIVE: {openPositions}</div>
        <div>LOSS STREAK: {lossStreak}</div>
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px dashed rgba(0,255,136,0.35)",
          fontSize: 13,
          textAlign: "left",
        }}
      >
        <div>MEMORY TRADES: {memory?.total ?? stats?.total ?? 0}</div>
        <div>WINS: {memory?.wins ?? stats?.wins ?? 0}</div>
        <div>LOSSES: {memory?.losses ?? stats?.losses ?? 0}</div>
        <div>
          WIN RATE: {(((memory?.win_rate ?? stats?.win_rate ?? 0) * 100)).toFixed(1)}%
        </div>
        <div>AVG PNL: ${Number(memory?.avg_pnl ?? 0).toFixed(2)}</div>
        <div>BRAIN MODE: {brain?.mode || "—"}</div>
        <div>AVOID MODE: {brain?.avoid_active ? "YES" : "NO"}</div>
      </div>
    </div>
  );
}

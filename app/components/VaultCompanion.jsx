"use client";

import { useEffect, useState } from "react";

function getMood({ pnl, positions, lossStreak, secondsAgo }) {
  // 📴 DEAD CONNECTION
  if (secondsAgo > 30) return "offline";

  // 🚨 CRITICAL LOSS
  if (pnl < -15) return "cryo";

  // ⚠️ LOSING
  if (pnl < -5) return "sick";

  // 😟 SMALL LOSS
  if (pnl < 0) return "worried";

  // 🔥 ACTIVE TRADE
  if (positions > 0) return "active";

  // 😄 GOOD PROFIT
  if (pnl > 10) return "happy";

  if (pnl > 0) return "calm";

  return "idle";
}

export default function VaultCompanion({
  pnlToday = 0,
  equity = 0,
  openPositions = 0,
  lossStreak = 0,
  secondsAgo = 0
}) {
  const [displayMood, setDisplayMood] = useState("idle");

  const mood = getMood({
    pnl: pnlToday,
    positions: openPositions,
    lossStreak,
    secondsAgo
  });

  // 🧠 smooth transitions (feels alive)
  useEffect(() => {
    const t = setTimeout(() => {
      setDisplayMood(mood);
    }, 300);

    return () => clearTimeout(t);
  }, [mood]);

  const img = `/companion/vaultgirl/vaultgirl_${displayMood}.png`;

  const opacity = displayMood === "offline" ? 0.3 : 1;

  return (
    <div style={{
      border: "2px solid #00ff88",
      padding: 12,
      textAlign: "center",
      background: "#000",
      color: "#00ff88"
    }}>
      <h3>VAULT GIRL</h3>

      <img
        src={img}
        style={{
          width: 200,
          opacity,
          transition: "all 0.5s ease"
        }}
        onError={(e) => {
          e.target.src = "/companion/vaultgirl/vaultgirl_idle.png";
        }}
      />

      <div style={{ marginTop: 10 }}>

        <div>STATE: {displayMood.toUpperCase()}</div>

        <div>
          HEARTBEAT: {secondsAgo < 10
            ? "STRONG"
            : secondsAgo < 30
            ? "WEAK"
            : "LOST"}
        </div>

        <div>EQUITY: ${equity.toFixed(2)}</div>

        <div style={{ color: pnlToday >= 0 ? "#00ff88" : "#ff5555" }}>
          PnL: {pnlToday >= 0 ? "+" : ""}${pnlToday.toFixed(2)}
        </div>

        <div>TRADES ACTIVE: {openPositions}</div>

        <div>LOSS STREAK: {lossStreak}</div>

      </div>
    </div>
  );
}

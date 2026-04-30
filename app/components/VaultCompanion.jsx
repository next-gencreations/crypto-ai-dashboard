"use client";

import { useEffect, useState } from "react";

export default function VaultCompanion() {
  const [state, setState] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/proxy/data?ts=" + Date.now());
        const data = await res.json();

        setState(data);
        setLastUpdate(Date.now());
      } catch (err) {
        console.error("Companion fetch error", err);
      }
    };

    fetchData();

    // ⚡ Faster refresh (1 second)
    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!state) {
    return <div style={{ color: "#0f0" }}>BOOTING COMPANION...</div>;
  }

  // 🔥 BOT DATA
  const pnl = state.pnl_today || 0;
  const lossStreak = state?.brain?.loss_streak || 0;
  const openPositions = state.open_positions_count || 0;
  const drawdown = state.drawdown_from_high_pct || 0;
  const mode = state.mode || "UNKNOWN";

  // 🎭 MOOD ENGINE (IMPROVED)
  let mood = "idle";
  let statusText = "STANDBY";

  if (mode !== "LIVE") {
    mood = "cryo";
    statusText = "CRYO SLEEP";
  } else if (openPositions > 0) {
    mood = "thriving";
    statusText = "IN TRADE ⚡";
  } else if (pnl > 5) {
    mood = "happy";
    statusText = "PROFIT FLOW 💰";
  } else if (pnl > 0) {
    mood = "idle";
    statusText = "STABLE";
  } else if (pnl < -10 || drawdown > 0.05) {
    mood = "zombie";
    statusText = "CRITICAL ⚠️";
  } else if (pnl < -3 || lossStreak >= 3) {
    mood = "sick";
    statusText = "LOSING CONTROL";
  } else if (pnl < 0) {
    mood = "weak";
    statusText = "UNDER PRESSURE";
  } else {
    mood = "cryo";
    statusText = "WAITING";
  }

  const imgPath = `/companion/vaultgirl/vaultgirl_${mood}..png`;

  const secondsAgo = Math.floor((Date.now() - lastUpdate) / 1000);

  return (
    <div
      style={{
        border: "2px solid #00ff88",
        padding: "12px",
        background: "#000",
        color: "#00ff88",
        fontFamily: "monospace",
        textAlign: "center",
      }}
    >
      <h3>PIP-TRADE 3000 · VAULT COMPANION</h3>

      <img
        src={imgPath}
        alt={mood}
        style={{
          width: "180px",
          imageRendering: "pixelated",
          transition: "all 0.3s ease-in-out",
        }}
      />

      <div style={{ marginTop: "10px" }}>
        <div>STATE: {mood.toUpperCase()}</div>
        <div>{statusText}</div>

        <div style={{ marginTop: "6px" }}>
          💰 PNL: ${pnl.toFixed(2)}
        </div>

        <div>📉 LOSS STREAK: {lossStreak}</div>
        <div>📊 POSITIONS: {openPositions}</div>

        <div style={{ marginTop: "6px", fontSize: "12px" }}>
          ⏱ updated {secondsAgo}s ago
        </div>
      </div>
    </div>
  );
}

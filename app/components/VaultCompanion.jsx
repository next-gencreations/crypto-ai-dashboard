"use client";

import { useEffect, useState } from "react";

export default function VaultCompanion() {
  const [state, setState] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/proxy/data");
        const data = await res.json();
        setState(data);
      } catch (err) {
        console.error("Failed to fetch bot state", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!state) {
    return <div style={{ color: "#0f0" }}>Loading companion...</div>;
  }

  // 🔥 BOT DATA
  const pnl = state.pnl_today || 0;
  const lossStreak = state?.brain?.loss_streak || 0;
  const openPositions = state.open_positions_count || 0;
  const drawdown = state.drawdown_from_high_pct || 0;

  // 🎭 MOOD LOGIC
  let mood = "idle";

  if (openPositions > 0) {
    mood = "thriving";
  } else if (pnl > 2) {
    mood = "happy";
  } else if (pnl > 0.5) {
    mood = "idle";
  } else if (pnl < -5 || drawdown > 0.03) {
    mood = "zombie";
  } else if (pnl < -2 || lossStreak >= 3) {
    mood = "sick";
  } else if (pnl < 0) {
    mood = "weak";
  } else {
    mood = "cryo";
  }

  // 🖼 IMAGE PATH (uses your double-dot filenames)
  const imgPath = `/companion/vaultgirl/vaultgirl_${mood}..png`;

  return (
    <div
      style={{
        border: "1px solid #0f0",
        padding: "10px",
        background: "#000",
        color: "#0f0",
        fontFamily: "monospace",
        textAlign: "center",
      }}
    >
      <h3>VAULT COMPANION · HOLOGRAM</h3>

      <img
        src={imgPath}
        alt={mood}
        style={{
          width: "180px",
          imageRendering: "pixelated",
        }}
      />

      <div style={{ marginTop: "10px" }}>
        <div>STATE: {mood.toUpperCase()}</div>
        <div>PNL TODAY: ${pnl.toFixed(2)}</div>
        <div>LOSS STREAK: {lossStreak}</div>
        <div>OPEN POSITIONS: {openPositions}</div>
      </div>
    </div>
  );
}

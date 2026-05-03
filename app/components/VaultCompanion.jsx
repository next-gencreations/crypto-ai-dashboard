"use client";

import { useEffect, useMemo, useState } from "react";

const VAULT_GIRL_IMAGES = {
  cryo: "/companion/vaultgirl/vaultgirl_cryo.png",
  idle: "/companion/vaultgirl/vaultgirl_idle.png",
  happy: "/companion/vaultgirl/vaultgirl_happy.png",
  sick: "/companion/vaultgirl/vaultgirl_sick.png",
  thriving: "/companion/vaultgirl/vaultgirl_thriving.png",
  weak: "/companion/vaultgirl/vaultgirl_weak.png",
  zombie: "/companion/vaultgirl/vaultgirl_zombie.png",
};

function getCompanionState({
  pnl,
  positions,
  lossStreak,
  secondsAgo,
  memory,
  vaultState,
  vaultMood,
  vaultLine,
  vaultRoom,
}) {
  if (secondsAgo > 30) {
    return {
      mood: "cryo",
      state: "CRYO LOCKDOWN",
      line: "SIGNAL LOST · RECONNECTING TO RENDER CORE",
      pulse: "SLEEP",
      action: "Sleeping inside cryo tube",
    };
  }

  if (lossStreak >= 5) {
    return {
      mood: "zombie",
      state: "MEDICAL EMERGENCY",
      line: "LOSS STREAK PROTECTION ACTIVE",
      pulse: "DANGER",
      action: "Critical recovery in Vault 63 med bay",
    };
  }

  if (lossStreak >= 3) {
    return {
      mood: "sick",
      state: "RECOVERY MODE",
      line: "DEFENSIVE MODE ARMED",
      pulse: "WARNING",
      action: "Resting while the trading brain cools down",
    };
  }

  if (positions > 0) {
    return {
      mood: "thriving",
      state: "HUNTER MODE",
      line: "LIVE POSITION UNDER WATCH",
      pulse: "TARGET LOCK",
      action: "Operating the trading terminal",
    };
  }

  if (pnl > 0.05) {
    return {
      mood: "happy",
      state: "VAULT ENERGISED",
      line: "PROFIT MEMORY FEEDING CORE",
      pulse: "GREEN",
      action: "Training, eating, and restoring energy",
    };
  }

  if (pnl < -0.05) {
    return {
      mood: "weak",
      state: "UNDER PRESSURE",
      line: "SMALL DAMAGE DETECTED",
      pulse: "LOW",
      action: "Resting after market damage",
    };
  }

  if (vaultMood === "hunter" || vaultState === "HUNTER MODE") {
    return {
      mood: "idle",
      state: "SCANNING",
      line: vaultLine || "LOOKING FOR CLEAN ENTRY",
      pulse: "SCANNING",
      action: "Scanning market structure from Vault 63 Lab",
    };
  }

  if (memory?.total > 0 && memory?.win_rate >= 0.55) {
    return {
      mood: "happy",
      state: "MEMORY CONFIDENT",
      line: "PAST WINS BOOSTING CORE",
      pulse: "GREEN",
      action: "Reviewing successful trade memory",
    };
  }

  return {
    mood: "idle",
    state: "PATIENT",
    line: "WAITING FOR MARKET EDGE",
    pulse: "SCANNING",
    action: `Standing by in ${vaultRoom || "Vault 63 Lab"}`,
  };
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
  vaultState = "",
  vaultMood = "",
  vaultLine = "",
  vaultRoom = "VAULT 63 LAB",
}) {
  const [display, setDisplay] = useState({
    mood: "idle",
    state: "PATIENT",
    line: "WAITING FOR MARKET EDGE",
    pulse: "SCANNING",
    action: "Standing by in Vault 63 Lab",
  });

  const [imageFailed, setImageFailed] = useState(false);

  const companion = useMemo(
    () =>
      getCompanionState({
        pnl: Number(pnlToday) || 0,
        positions: Number(openPositions) || 0,
        lossStreak: Number(lossStreak) || 0,
        secondsAgo: Number(secondsAgo) || 0,
        memory,
        vaultState,
        vaultMood,
        vaultLine,
        vaultRoom,
      }),
    [
      pnlToday,
      openPositions,
      lossStreak,
      secondsAgo,
      memory,
      vaultState,
      vaultMood,
      vaultLine,
      vaultRoom,
    ]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setDisplay(companion);
      setImageFailed(false);
    }, 150);

    return () => clearTimeout(t);
  }, [companion]);

  const img = VAULT_GIRL_IMAGES[display.mood] || VAULT_GIRL_IMAGES.idle;

  const heartbeat =
    secondsAgo < 10 ? "STRONG" : secondsAgo < 30 ? "WEAK" : "LOST";

  return (
    <div className={`vaultBox pulse-${display.pulse.toLowerCase().replaceAll(" ", "-")}`}>
      <h3>VAULT 63 LAB · MEMORY CORE</h3>

      <div className="roomTag">CURRENT ROOM: {vaultRoom}</div>

      {!imageFailed ? (
        <img
          src={img}
          alt={`Vault Girl ${display.mood}`}
          className="vaultGirlImg"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="imageError">IMAGE PATH ERROR</div>
      )}

      <div className="vaultStatus">
        <div>STATE: {display.state}</div>
        <div>{display.line}</div>
        <div>ACTION: {display.action}</div>
        <div>HEARTBEAT: {heartbeat}</div>
        <div>EQUITY: ${Number(equity).toFixed(2)}</div>

        <div style={{ color: pnlToday >= 0 ? "#00ff88" : "#ff5555" }}>
          TODAY: {pnlToday >= 0 ? "+" : ""}${Number(pnlToday).toFixed(2)}
        </div>

        <div>TRADES ACTIVE: {openPositions}</div>
        <div>LOSS STREAK: {lossStreak}</div>
      </div>

      <div className="memoryBlock">
        <div>MEMORY TRADES: {memory?.total ?? stats?.total ?? 0}</div>
        <div>WINS: {memory?.wins ?? stats?.wins ?? 0}</div>
        <div>LOSSES: {memory?.losses ?? stats?.losses ?? 0}</div>
        <div>
          WIN RATE: {((memory?.win_rate ?? stats?.win_rate ?? 0) * 100).toFixed(1)}%
        </div>
        <div>AVG PNL: ${Number(memory?.avg_pnl ?? 0).toFixed(2)}</div>
        <div>BRAIN MODE: {brain?.mode || "—"}</div>
        <div>AVOID MODE: {brain?.avoid_active ? "YES" : "NO"}</div>
      </div>

      <style>{`
        .vaultBox {
          border: 2px solid #00ff88;
          padding: 12px;
          text-align: center;
          background:
            radial-gradient(circle at top, rgba(0,255,136,0.10), transparent 38%),
            #000;
          color: #00ff88;
          min-height: 540px;
          box-shadow:
            0 0 18px rgba(0,255,136,0.18),
            inset 0 0 18px rgba(0,255,136,0.08);
        }

        .roomTag {
          margin: 8px auto 10px;
          font-size: 13px;
          opacity: 0.85;
          border: 1px solid rgba(0,255,136,0.35);
          padding: 6px 8px;
          max-width: 320px;
          background: rgba(0, 40, 18, 0.45);
        }

        .vaultGirlImg {
          width: 260px;
          max-width: 90%;
          min-height: 260px;
          object-fit: contain;
          transition: opacity 0.5s ease, transform 0.5s ease;
          filter: drop-shadow(0 0 16px rgba(0,255,136,0.55));
        }

        .pulse-scanning .vaultGirlImg {
          animation: scanPulse 2.8s infinite ease-in-out;
        }

        .pulse-target-lock .vaultGirlImg {
          animation: targetLock 1s infinite ease-in-out;
        }

        .pulse-green .vaultGirlImg {
          animation: happyPulse 1.8s infinite ease-in-out;
        }

        .pulse-low .vaultGirlImg,
        .pulse-warning .vaultGirlImg {
          animation: warningPulse 1.4s infinite ease-in-out;
        }

        .pulse-danger .vaultGirlImg {
          animation: dangerPulse 0.75s infinite ease-in-out;
        }

        .pulse-sleep .vaultGirlImg {
          opacity: 0.55;
        }

        .vaultStatus {
          margin-top: 10px;
          font-size: 16px;
          line-height: 1.35;
        }

        .memoryBlock {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px dashed rgba(0,255,136,0.35);
          font-size: 13px;
          text-align: left;
        }

        .imageError {
          min-height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px dashed rgba(0,255,136,0.35);
          margin: 10px auto;
          max-width: 320px;
        }

        @keyframes scanPulse {
          0%, 100% { transform: scale(1); opacity: 0.92; }
          50% { transform: scale(1.015); opacity: 1; }
        }

        @keyframes targetLock {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 14px rgba(0,255,136,0.55));
          }
          50% {
            transform: scale(1.03);
            filter: drop-shadow(0 0 26px rgba(0,255,136,0.95));
          }
        }

        @keyframes happyPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.025); }
        }

        @keyframes warningPulse {
          0%, 100% { opacity: 0.78; transform: translateX(0); }
          50% { opacity: 1; transform: translateX(1px); }
        }

        @keyframes dangerPulse {
          0%, 100% { opacity: 0.55; transform: scale(0.99); }
          50% { opacity: 1; transform: scale(1.025); }
        }
      `}</style>
    </div>
  );
}

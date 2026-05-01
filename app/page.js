"use client";

import { useEffect, useState } from "react";
import VaultCompanion from "./components/VaultCompanion";

export default function HomePage() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 4500);
    return () => clearTimeout(t);
  }, []);

  // 🔥 VAULT INTRO (FIXED POSITION — SAFE)
  if (booting) {
    return (
      <div className="vault-boot">
        <style>{`
          .vault-boot {
            position: fixed;
            inset: 0;
            background: #050604;
            overflow: hidden;
            font-family: "Courier New", monospace;
            color: #67ff9a;
          }

          .vault-camera {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: cameraZoom 4.5s ease-in forwards;
            transform-origin: center;
          }

          .bunker-wall {
            width: min(92vw, 820px);
            height: min(58vw, 470px);
            max-height: 72vh;
            position: relative;
            background:
              repeating-linear-gradient(
                90deg,
                #6f6247 0px,
                #9d8b61 22px,
                #4a3f2d 42px,
                #2b251b 60px
              );
            border: 8px solid #1b1811;
            box-shadow:
              0 0 70px rgba(0,0,0,0.95),
              inset 0 0 80px rgba(0,0,0,0.65);
            border-radius: 8px;
          }

          .door-bay {
            position: absolute;
            right: 7%;
            top: 10%;
            width: 48%;
            height: 78%;
            background: #070807;
            border: 10px solid #252116;
            border-radius: 46% / 30%;
            overflow: hidden;
          }

          .green-inside {
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at center, rgba(0,255,136,1), rgba(0,70,28,0.7) 34%, #000 68%);
            opacity: 0;
            animation: innerGlow 4.5s ease forwards;
          }

          .vault-door {
            position: absolute;
            left: 50%;
            top: 50%;
            width: 68%;
            height: 82%;
            transform: translate(-50%, -50%);
            border-radius: 50% / 32%;
            background:
              radial-gradient(circle at 50% 50%, #34342d 0%, #151515 58%, #050505 100%);
            border: 7px solid #3d3828;
            animation: doorOpen 4.5s cubic-bezier(.55,.02,.22,1) forwards;
          }

          .vault-door::after {
            content: "4";
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255,180,35,0.85);
            font-size: clamp(48px, 9vw, 110px);
            font-weight: 900;
          }

          .boot-text {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 7%;
            text-align: center;
            letter-spacing: 4px;
            font-size: 15px;
            animation: textFade 4.5s ease forwards;
          }

          .blackout {
            position: absolute;
            inset: 0;
            background: #000;
            opacity: 0;
            animation: fadeToDash 4.5s ease forwards;
          }

          @keyframes cameraZoom {
            0% { transform: scale(1); }
            100% { transform: scale(5.5); }
          }

          @keyframes doorOpen {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(105%, -50%) rotate(-12deg); opacity: 0; }
          }

          @keyframes innerGlow {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }

          @keyframes textFade {
            0%, 60% { opacity: 1; }
            100% { opacity: 0; }
          }

          @keyframes fadeToDash {
            0%, 85% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}</style>

        <div className="vault-camera">
          <div className="bunker-wall">
            <div className="door-bay">
              <div className="green-inside" />
              <div className="vault-door" />
            </div>
          </div>
        </div>

        <div className="boot-text">
          VAULT ACCESS SEQUENCE<br />
          ENTERING PIP-TRADE 3000
        </div>

        <div className="blackout" />
      </div>
    );
  }

  // ✅ NORMAL DASHBOARD (kept simple so build doesn't break)
  return (
    <div style={{ padding: 20, color: "#67ff9a" }}>
      <h1>PIP-TRADE 3000</h1>
      <p>System online.</p>

      <VaultCompanion
        pnlToday={0}
        equity={0}
        openPositions={0}
        lossStreak={0}
        secondsAgo={0}
        memory={{}}
        stats={{}}
        brain={{}}
      />
    </div>
  );
}

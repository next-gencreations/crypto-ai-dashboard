"use client";

import { useEffect, useState } from "react";
import VaultCompanion from "./components/VaultCompanion";

export default function HomePage() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 8000); // fallback if video fails
    return () => clearTimeout(t);
  }, []);

  // 🎬 VIDEO INTRO (CONNECTED TO YOUR BLOB)
  if (booting) {
    return (
      <div className="introWrap">
        <video
          className="introVideo"
          src="https://wofr85ahprzdmtaz.public.blob.vercel-storage.com/vault-intro.mp4"
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

  // ✅ DASHBOARD
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

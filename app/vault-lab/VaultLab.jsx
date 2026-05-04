"use client";

import { useEffect, useRef } from "react";

export default function VaultLab() {
  const containerRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadGame() {
      try {
        const mod = await import("../../game/Game");

        if (mounted && mod?.Game) {
          const Game = mod.Game;

          // Mount React component manually
          const el = document.createElement("div");
          el.style.width = "100vw";
          el.style.height = "100vh";

          containerRef.current.innerHTML = "";
          containerRef.current.appendChild(el);

          // Render Game
          import("react-dom/client").then(({ createRoot }) => {
            const root = createRoot(el);
            root.render(<Game />);
          });
        }
      } catch (e) {
        console.error("Vault load error:", e);
      }
    }

    loadGame();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        background: "black",
        color: "#00ff88",
      }}
    >
      Loading Vault 63 Lab...
    </div>
  );
}

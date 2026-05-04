"use client";

import { useEffect, useState } from "react";

export default function VaultLabWrapper() {
  const [Game, setGame] = useState(null);

  useEffect(() => {
    import("../../src/game/Game")
      .then((mod) => setGame(() => mod.Game))
      .catch(() => console.log("Game load failed"));
  }, []);

  if (!Game) {
    return (
      <div style={{ color: "#00ff88", padding: 20 }}>
        Loading Vault 63 Lab...
      </div>
    );
  }

  return <Game />;
}

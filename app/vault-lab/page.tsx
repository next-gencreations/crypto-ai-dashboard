"use client";

import dynamic from "next/dynamic";

const Game = dynamic(
  () => import("../../game/Game").then((mod) => mod.Game),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#010801",
          color: "#00ff44",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Courier New', monospace",
          letterSpacing: 4,
        }}
      >
        LOADING VAULT 63 LAB...
      </div>
    ),
  }
);

export default function VaultLabPage() {
  return <Game />;
}

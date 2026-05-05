"use client";

import dynamic from "next/dynamic";

const Game = dynamic(() => import("../../game/Game"), {
  ssr: false,
});

export default function VaultLabPage() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "black" }}>
      <Game />
    </div>
  );
}

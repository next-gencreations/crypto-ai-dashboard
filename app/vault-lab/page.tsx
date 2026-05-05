"use client";

import dynamic from "next/dynamic";
import { WebGLErrorBoundary } from "../../game/WebGLCheck";

const Game = dynamic(
  () => import("../../game/Game").then((mod) => mod.Game),
  { ssr: false }
);

export default function VaultLabPage() {
  return (
    <WebGLErrorBoundary>
      <Game />
    </WebGLErrorBoundary>
  );
}

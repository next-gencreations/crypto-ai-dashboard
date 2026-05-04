"use client";

import dynamic from "next/dynamic";

// Load Vault Lab safely (no SSR crash)
const VaultLab = dynamic(() => import("./VaultLabWrapper"), {
  ssr: false,
});

export default function Page() {
  return <VaultLab />;
}

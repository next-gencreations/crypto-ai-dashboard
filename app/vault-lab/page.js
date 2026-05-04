"use client";

import dynamic from "next/dynamic";

const VaultLab = dynamic(() => import("./VaultLab"), {
  ssr: false,
});

export default function Page() {
  return <VaultLab />;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { proxyUpstream } from "../../../../_lib";

export async function POST(req) {
  // UI calls /vault/pin/set
  // _lib.js rewriteLegacy will convert it to /vault/pin on the backend
  return proxyUpstream(req, "/vault/pin/set", "POST");
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers":
        "Content-Type, Authorization, X-Vault-Token, X-Requested-With",
    },
  });
}

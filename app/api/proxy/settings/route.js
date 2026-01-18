// app/api/proxy/settings/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { proxyGet, proxyPost } from "../_lib";

export async function GET(req) {
  // upstream: /settings
  return proxyGet(req, "/settings");
}

export async function POST(req) {
  // upstream: /settings
  return proxyPost(req, "/settings");
}

// app/api/proxy/data/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { proxyGet } from "../_lib";

export async function GET(req) {
  return proxyGet(req, "/data");
}

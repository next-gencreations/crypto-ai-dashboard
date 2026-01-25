import { proxyUpstream } from "../_lib";

export const runtime = "nodejs";

export async function GET(req) {
  return proxyUpstream(req, "/ohlc", "GET");
}

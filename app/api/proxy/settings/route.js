import { proxyUpstream } from "../_lib";

export const runtime = "nodejs";

export async function GET(req) {
  return proxyUpstream(req, "/settings", "GET");
}

export async function POST(req) {
  return proxyUpstream(req, "/settings", "POST");
}

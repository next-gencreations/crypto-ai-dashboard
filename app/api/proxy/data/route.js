import { proxyUpstream } from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  return proxyUpstream(req, "/data", "GET");
}

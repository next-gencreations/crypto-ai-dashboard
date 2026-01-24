import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // avoid caching
export const runtime = "nodejs"; // ensure Node runtime

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "crypto-ai-dashboard",
      env: process.env.NODE_ENV ?? "unknown",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

// app/api/proxy/health/route.js
import { NextResponse } from "next/server";
import { proxyGet } from "../_lib";

export async function GET() {
  const out = await proxyGet("/health");
  return NextResponse.json(out);
}

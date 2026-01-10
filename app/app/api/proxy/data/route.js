// app/api/proxy/data/route.js
import { NextResponse } from "next/server";
import { proxyGet } from "../_lib";

export async function GET() {
  const out = await proxyGet("/data");
  return NextResponse.json(out);
}

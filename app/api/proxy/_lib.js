import { NextResponse } from "next/server";

export const runtime = "nodejs";

const API_BASE =
  process.env.CRYPTO_AI_API_URL ||
  "https://crypto-ai-api-1-7cte.onrender.com";

/**
 * Core upstream proxy
 */
export async function proxyUpstream(req, path, method = "GET") {
  const url = `${API_BASE}${path}`;

  try {
    const headers = {};
    const vaultToken = req?.headers?.get("x-vault-token");
    if (vaultToken) headers["x-vault-token"] = vaultToken;

    const init = {
      method,
      headers,
      cache: "no-store",
    };

    if (method !== "GET" && method !== "HEAD") {
      init.body = await req.text();
      const ct = req.headers.get("content-type");
      if (ct) headers["content-type"] = ct;
    }

    const res = await fetch(url, init);
    const body = await res.text();

    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error("Proxy upstream error:", err);
    return NextResponse.json(
      { ok: false, error: "Upstream failed", detail: String(err) },
      { status: 500 }
    );
  }
}

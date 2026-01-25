import { NextResponse } from "next/server";

const API_BASE =
  process.env.CRYPTO_AI_API_URL ||
  "https://crypto-ai-api-1-7cte.onrender.com";

/**
 * Build common headers
 */
function buildHeaders(req) {
  const headers = {
    "Content-Type": "application/json",
  };

  const vaultToken = req.headers.get("x-vault-token");
  if (vaultToken) {
    headers["x-vault-token"] = vaultToken;
  }

  return headers;
}

/**
 * Core proxy handler
 */
async function proxyRequest(req, path, method = "GET") {
  const url = `${API_BASE}${path}`;

  try {
    const res = await fetch(url, {
      method,
      headers: buildHeaders(req),
      body: method === "POST" ? await req.text() : undefined,
      cache: "no-store",
    });

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type":
          res.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json(
      { ok: false, error: "Proxy failed", detail: String(err) },
      { status: 500 }
    );
  }
}

/**
 * ✅ EXPORTS EXPECTED BY YOUR ROUTES
 */

export async function proxyGet(req, path) {
  return proxyRequest(req, path, "GET");
}

export async function proxyPost(req, path) {
  return proxyRequest(req, path, "POST");
}

// Added to fix "proxyFetch is not exported" build error
export async function proxyFetch(req, path, method = "GET") {
  return proxyRequest(req, path, method);
}

// Added to fix "rewriteLegacy is not exported" build error
export function rewriteLegacy(path) {
  return path;
}

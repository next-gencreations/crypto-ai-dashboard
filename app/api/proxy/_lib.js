import { NextResponse } from "next/server";

export const runtime = "nodejs";

const API_BASE =
  process.env.CRYPTO_AI_API_URL ||
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://crypto-ai-api-1-7cte.onrender.com";

/**
 * Map legacy short paths used by the UI to real backend endpoints
 */
export function rewriteLegacy(path) {
  if (!path) return "/";

  let p = String(path);
  if (!p.startsWith("/")) p = `/${p}`;

  // --- legacy shortcuts the UI often uses ---
  if (p === "/h") return "/health";
  if (p === "/v") return "/vault/status";
  if (p === "/s") return "/settings";
  if (p === "/d") return "/data";
  if (p === "/c") return "/ohlc"; // candles shortcut (if used)
  if (p === "/logs") return "/logs";

  // also support these friendly legacy paths
  if (p === "/crypto") return "/data";
  if (p === "/candles") return "/ohlc";
  if (p === "/vault") return "/vault/status";

  return p;
}

/**
 * Copy through headers the backend needs (Vault token especially)
 */
function buildHeaders(req) {
  const headers = {};

  const vaultToken = req?.headers?.get?.("x-vault-token");
  if (vaultToken) headers["x-vault-token"] = vaultToken;

  const auth = req?.headers?.get?.("authorization");
  if (auth) headers["authorization"] = auth;

  return headers;
}

/**
 * Core proxy (always uses Node runtime)
 */
async function proxyRequest(req, path, method = "GET") {
  const upstreamPath = rewriteLegacy(path);
  const url = `${API_BASE}${upstreamPath}`;

  try {
    const init = {
      method,
      headers: {
        ...buildHeaders(req),
      },
      cache: "no-store",
    };

    // Only attach a body for non-GET/HEAD
    if (req && method !== "GET" && method !== "HEAD") {
      init.body = await req.text();
      const ct = req.headers.get("content-type");
      if (ct) init.headers["content-type"] = ct;
    }

    const res = await fetch(url, init);
    const text = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Vault-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
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

/**
 * ✅ IMPORTANT: proxyFetch must support BOTH calling styles
 */
export async function proxyFetch(arg1, arg2, arg3) {
  if (typeof arg1 === "string") {
    const path = arg1;
    const init = arg2 || {};
    const method = (init.method || "GET").toUpperCase();
    return proxyRequest(null, path, method);
  }

  const req = arg1;
  const path = arg2;
  const init = arg3 || {};
  const method = (init.method || req?.method || "GET").toUpperCase();
  return proxyRequest(req, path, method);
}

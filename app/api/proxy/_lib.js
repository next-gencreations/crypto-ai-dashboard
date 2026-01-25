import { NextResponse } from "next/server";

// IMPORTANT: keep this base simple and stable (avoid loops)
const API_BASE =
  process.env.CRYPTO_AI_API_URL || "https://crypto-ai-api-1-7cte.onrender.com";

/**
 * Normalize/legacy rewrite
 */
export function rewriteLegacy(path) {
  if (!path) return "/";

  let p = String(path);
  if (!p.startsWith("/")) p = `/${p}`;

  // Shortcuts the UI may use
  if (p === "/h") return "/health";
  if (p === "/v") return "/vault/status";
  if (p === "/s") return "/settings";
  if (p === "/d") return "/data";
  if (p === "/c") return "/ohlc";
  if (p === "/logs") return "/logs";

  // Friendly legacy paths
  if (p === "/crypto") return "/data";
  if (p === "/candles") return "/ohlc";
  if (p === "/vault") return "/vault/status";

  return p;
}

/**
 * Build headers for upstream
 */
function buildHeaders(req) {
  const headers = {};

  const vaultToken = req?.headers?.get?.("x-vault-token");
  if (vaultToken) headers["x-vault-token"] = vaultToken;

  const auth = req?.headers?.get?.("authorization");
  if (auth) headers["authorization"] = auth;

  const ct = req?.headers?.get?.("content-type");
  if (ct) headers["content-type"] = ct;

  headers["accept"] = req?.headers?.get?.("accept") || "application/json";

  return headers;
}

/**
 * LOW-LEVEL upstream fetch that returns a normal Response (like fetch)
 * This is important because some route handlers expect a Response, not NextResponse.
 */
async function fetchUpstream(req, path, method = "GET") {
  const upstreamPath = rewriteLegacy(path);
  const url = `${API_BASE}${upstreamPath}`;

  const init = {
    method,
    headers: buildHeaders(req),
    cache: "no-store",
  };

  // Body only for non-GET/HEAD
  if (req && method !== "GET" && method !== "HEAD") {
    init.body = await req.text();
  }

  return fetch(url, init);
}

/**
 * Helper: convert a Response into a NextResponse (preserve body + content-type + status)
 */
async function asNextResponse(res) {
  const text = await res.text();
  const contentType =
    res.headers.get("content-type") || "application/json; charset=utf-8";

  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": contentType,
    },
  });
}

/**
 * Core proxy handler (with a PIN endpoint fallback)
 */
async function proxyRequest(req, path, method = "GET") {
  try {
    // First attempt
    let res = await fetchUpstream(req, path, method);

    // Fallback for PIN set route: backend sometimes is /vault/pin not /vault/pin/set
    // Only for POST to that path.
    const p = rewriteLegacy(path);
    if (method === "POST" && p === "/vault/pin/set") {
      // If backend returns 404 OR the classic "Cannot POST" HTML, try /vault/pin
      const clone = res.clone();
      const bodyText = await clone.text().catch(() => "");
      if (res.status === 404 || bodyText.includes("Cannot POST /vault/pin/set")) {
        // retry alternative
        res = await fetchUpstream(req, "/vault/pin", method);
      }
    }

    return asNextResponse(res);
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json(
      { ok: false, error: "Proxy failed", detail: String(err) },
      { status: 500 }
    );
  }
}

/**
 * ✅ Exports expected by your routes
 */
export async function proxyGet(req, path) {
  return proxyRequest(req, path, "GET");
}

export async function proxyPost(req, path) {
  return proxyRequest(req, path, "POST");
}

/**
 * ✅ proxyFetch must behave like real fetch (returns Response)
 * Supports BOTH calling styles:
 *   proxyFetch("/path", { method: "GET" })
 *   proxyFetch(req, "/path", { method: "GET" })
 */
export async function proxyFetch(arg1, arg2, arg3) {
  // Style A: proxyFetch("/path", init)
  if (typeof arg1 === "string") {
    const path = arg1;
    const init = arg2 || {};
    const method = (init.method || "GET").toUpperCase();
    return fetchUpstream(null, path, method);
  }

  // Style B: proxyFetch(req, "/path", init)
  const req = arg1;
  const path = arg2;
  const init = arg3 || {};
  const method = (init.method || req?.method || "GET").toUpperCase();
  return fetchUpstream(req, path, method);
}

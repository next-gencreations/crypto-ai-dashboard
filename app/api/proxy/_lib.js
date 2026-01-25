
// app/api/proxy/_lib.js
export const runtime = "nodejs";

const API_BASE =
  process.env.CRYPTO_AI_API_URL || "https://crypto-ai-api-1-7cte.onrender.com";

export function rewriteLegacy(path) {
  if (!path) return "/";

  let p = String(path);
  if (!p.startsWith("/")) p = `/${p}`;

  if (p === "/h") return "/health";
  if (p === "/v") return "/vault/status";
  if (p === "/s") return "/settings";
  if (p === "/d") return "/data";
  if (p === "/c") return "/ohlc";
  if (p === "/logs") return "/logs";

  if (p === "/crypto") return "/data";
  if (p === "/candles") return "/ohlc";
  if (p === "/vault") return "/vault/status";

  return p;
}

function buildHeaders(req) {
  const headers = new Headers();

  // Pass through important headers
  const vaultToken = req.headers.get("x-vault-token");
  if (vaultToken) headers.set("x-vault-token", vaultToken);

  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);

  const accept = req.headers.get("accept");
  if (accept) headers.set("accept", accept);

  // Only set content-type if present (important for JSON POST)
  const ct = req.headers.get("content-type");
  if (ct) headers.set("content-type", ct);

  return headers;
}

/**
 * Core proxy – returns a normal Response (not NextResponse),
 * so route handlers can return it directly.
 */
export async function proxyUpstream(req, path, method) {
  const upstreamPath = rewriteLegacy(path);

  // Keep querystring
  const urlObj = new URL(req.url);
  const qs = urlObj.search || "";

  const url = `${API_BASE}${upstreamPath}${qs}`;

  const init = {
    method,
    headers: buildHeaders(req),
    cache: "no-store",
  };

  // Body only for non-GET/HEAD
  if (method !== "GET" && method !== "HEAD") {
    const body = await req.arrayBuffer();
    init.body = body;
  }

  // Do the upstream request
  let res = await fetch(url, init);

  // Fallback for PIN endpoint differences
  if (method === "POST" && upstreamPath === "/vault/pin/set" && res.status === 404) {
    const altUrl = `${API_BASE}/vault/pin${qs}`;
    res = await fetch(altUrl, init);
  }

  return res;
}

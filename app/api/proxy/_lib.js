import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Your backend (Render)
const API_BASE =
  process.env.CRYPTO_AI_API_URL ||
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://crypto-ai-api-1-7cte.onrender.com";

/** Optional: map short/legacy paths if your UI ever calls them */
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

  return p;
}

function buildHeaders(req) {
  const headers = {};

  // pass vault token through (case-insensitive in practice)
  const vaultToken = req?.headers?.get?.("x-vault-token");
  if (vaultToken) headers["x-vault-token"] = vaultToken;

  // pass auth if you ever use it
  const auth = req?.headers?.get?.("authorization");
  if (auth) headers["authorization"] = auth;

  // pass content-type for POST/PUT
  const ct = req?.headers?.get?.("content-type");
  if (ct) headers["content-type"] = ct;

  return headers;
}

/** Main upstream proxy helper */
export async function proxyUpstream(req, path, method = "GET") {
  const upstreamPath = rewriteLegacy(path);
  const url = `${API_BASE}${upstreamPath}`;

  try {
    const init = {
      method,
      headers: buildHeaders(req),
      cache: "no-store",
    };

    if (req && method !== "GET" && method !== "HEAD") {
      init.body = await req.text();
    }

    const res = await fetch(url, init);
    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("proxyUpstream error:", err);
    return NextResponse.json(
      { ok: false, error: "Proxy failed", detail: String(err) },
      { status: 500 }
    );
  }
}
// Compatibility export: some routes import proxyFetch
export async function proxyFetch(arg1, arg2, arg3) {
  // Style 1: proxyFetch(req, "/path", { method: "GET" })
  if (arg1 && typeof arg1 === "object" && typeof arg2 === "string") {
    const req = arg1;
    const path = arg2;
    const init = arg3 || {};
    const method = (init.method || req?.method || "GET").toUpperCase();
    return proxyUpstream(req, path, method);
  }

  // Style 2: proxyFetch("/path", { method: "GET" })
  const path = String(arg1 || "/");
  const init = arg2 || {};
  const method = (init.method || "GET").toUpperCase();
  return proxyUpstream(null, path, method);
}

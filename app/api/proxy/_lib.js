import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE =
  process.env.CRYPTO_AI_API_URL ||
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://crypto-ai-api-1-7cte.onrender.com";

/**
 * Rewrite paths that the dashboard/UI uses into the REAL backend routes.
 * Key fix: /vault/pin/set  -> /vault/pin
 */
export function rewriteLegacy(path) {
  if (!path) return "/";

  let p = String(path);
  if (!p.startsWith("/")) p = `/${p}`;

  // Shortcuts
  if (p === "/h") return "/health";
  if (p === "/v") return "/vault/status";
  if (p === "/s") return "/settings";
  if (p === "/d") return "/data";
  if (p === "/c") return "/ohlc";
  if (p === "/logs") return "/logs";

  // Friendly aliases
  if (p === "/crypto") return "/data";
  if (p === "/candles") return "/ohlc";
  if (p === "/vault") return "/vault/status";

  // ✅ IMPORTANT FIX FOR PIN SET:
  // UI sends /vault/pin/set but backend expects /vault/pin
  if (p === "/vault/pin/set") return "/vault/pin";

  return p;
}

function buildHeaders(req) {
  const out = {};

  // pass vault token through
  const token =
    req?.headers?.get?.("x-vault-token") || req?.headers?.get?.("X-Vault-Token");
  if (token) out["x-vault-token"] = token;

  const auth = req?.headers?.get?.("authorization");
  if (auth) out["authorization"] = auth;

  // preserve content-type for POST/PUT/PATCH if present
  const ct = req?.headers?.get?.("content-type");
  if (ct) out["content-type"] = ct;

  return out;
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers":
      "Content-Type, Authorization, X-Vault-Token, X-Requested-With",
  };
}

/**
 * Main upstream proxy (Node runtime).
 */
export async function proxyUpstream(req, path, method = "GET") {
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

    // only attach body for non-GET/HEAD
    if (req && method !== "GET" && method !== "HEAD") {
      init.body = await req.text();
      // if no content-type came through, default to json
      if (!init.headers["content-type"]) init.headers["content-type"] = "application/json";
    }

    const res = await fetch(url, init);
    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
        ...corsHeaders(),
      },
    });
  } catch (err) {
    console.error("proxyUpstream error:", err);
    return NextResponse.json(
      { ok: false, error: "Proxy failed", detail: String(err) },
      { status: 500, headers: corsHeaders() }
    );
  }
}

/**
 * Exports expected by your route files
 */
export async function proxyGet(req, path) {
  return proxyUpstream(req, path, "GET");
}

export async function proxyPost(req, path) {
  return proxyUpstream(req, path, "POST");
}

/**
 * Some files import proxyFetch(req, "/path") so we provide it.
 * Also supports proxyFetch("/path", { method: "POST" }) style.
 */
export async function proxyFetch(arg1, arg2, arg3) {
  // proxyFetch("/health", { method: "GET" })
  if (typeof arg1 === "string") {
    const path = arg1;
    const init = arg2 || {};
    const method = (init.method || "GET").toUpperCase();
    return proxyUpstream(null, path, method);
  }

  // proxyFetch(req, "/health", { method: "GET" })
  const req = arg1;
  const path = arg2;
  const init = arg3 || {};
  const method = (init.method || req?.method || "GET").toUpperCase();
  return proxyUpstream(req, path, method);
}

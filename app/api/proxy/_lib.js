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
 * Optional legacy mapping (keep simple)
 */
export function rewriteLegacy(path) {
  if (!path) return "/";
  let p = String(path);
  if (!p.startsWith("/")) p = `/${p}`;
  return p;
}

/**
 * Copy through headers the backend needs
 */
function buildHeaders(req) {
  const headers = {};

  // Vault token can be passed from UI to API
  const vaultToken = req?.headers?.get?.("x-vault-token");
  if (vaultToken) headers["x-vault-token"] = vaultToken;

  const auth = req?.headers?.get?.("authorization");
  if (auth) headers["authorization"] = auth;

  const ct = req?.headers?.get?.("content-type");
  if (ct) headers["content-type"] = ct;

  return headers;
}

/**
 * Core upstream proxy used by route files
 */
export async function proxyUpstream(req, path, method = "GET") {
  const upstreamPath = rewriteLegacy(path);
  const url = `${API_BASE}${upstreamPath}`;

  try {
    const init = {
      method,
      headers: buildHeaders(req),
      cache: "no-store",
    };

    // Only attach a body for non-GET/HEAD
    if (req && method !== "GET" && method !== "HEAD") {
      init.body = await req.text();
    }

    const res = await fetch(url, init);
    const text = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": contentType,
        // You can remove CORS headers if not needed
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Vault-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
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

/**
 * Backwards-compatible exports (in case other routes import these)
 */
export async function proxyGet(req, path) {
  return proxyUpstream(req, path, "GET");
}

export async function proxyPost(req, path) {
  return proxyUpstream(req, path, "POST");
}

export async function proxyFetch(req, path, method = "GET") {
  return proxyUpstream(req, path, method);
}

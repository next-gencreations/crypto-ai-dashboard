export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Catch-all proxy:
 * /api/proxy/<anything>  ->  ${API_URL}/<anything>
 *
 * It forwards:
 *  - method
 *  - query string
 *  - body (json/text)
 *  - headers (except host)
 *
 * It also adds CORS headers so browser calls work.
 */

function getBaseUrl() {
  // Prefer server env vars (set these in Vercel -> Project -> Settings -> Environment Variables)
  const candidates = [
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.CRYPTO_AI_API_URL,
    process.env.NEXT_PUBLIC_CRYPTO_AI_API_URL,
  ].filter(Boolean);

  const base = (candidates[0] || "https://crypto-ai-api-1-7cte.onrender.com").trim();
  return base.replace(/\/+$/, "");
}

function withCors(res) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, X-Vault-Token, Authorization");
  return res;
}

async function handler(req, ctx) {
  const base = getBaseUrl();
  const pathParts = (ctx?.params?.path || []).map(encodeURIComponent).join("/");
  const url = new URL(req.url);

  // Build target URL (preserve query string)
  const target = `${base}/${pathParts}${url.search || ""}`;

  // Copy headers (remove host + content-length)
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  // Body handling: only send body for non-GET/HEAD
  const method = req.method.toUpperCase();
  let body = undefined;

  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    // Read raw body (works for JSON or text)
    const buf = await req.arrayBuffer();
    body = buf.byteLength ? Buffer.from(buf) : undefined;
  }

  // OPTIONS preflight
  if (method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  let upstreamRes;
  try {
    upstreamRes = await fetch(target, {
      method,
      headers,
      body,
      cache: "no-store",
    });
  } catch (err) {
    const msg = String(err?.message || err);
    return withCors(
      new Response(JSON.stringify({ ok: false, error: "proxy_fetch_failed", detail: msg }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      })
    );
  }

  // Pass through response body + status
  const respBody = await upstreamRes.arrayBuffer();
  const outHeaders = new Headers(upstreamRes.headers);

  // Make sure browser can read it
  outHeaders.set("Cache-Control", "no-store");
  outHeaders.delete("content-encoding"); // avoid weird gzip issues sometimes

  const res = new Response(respBody, {
    status: upstreamRes.status,
    headers: outHeaders,
  });

  return withCors(res);
}

export async function GET(req, ctx) {
  return handler(req, ctx);
}
export async function POST(req, ctx) {
  return handler(req, ctx);
}
export async function PUT(req, ctx) {
  return handler(req, ctx);
}
export async function PATCH(req, ctx) {
  return handler(req, ctx);
}
export async function DELETE(req, ctx) {
  return handler(req, ctx);
}
export async function OPTIONS(req, ctx) {
  return handler(req, ctx);
}

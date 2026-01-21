export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function upstreamBase() {
  return (process.env.UPSTREAM_API_URL ||
    process.env.RENDER_API_URL ||
    process.env.UPSTREAM_URL ||
    "https://crypto-ai-api-1-7cte.onrender.com")
    .trim()
    .replace(/\/+$/, "");
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Vault-Token",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Cache-Control": "no-store",
  };
}

async function proxy(req, ctx) {
  const base = upstreamBase();
  const parts = (ctx?.params?.path || []).map(String);
  const url = new URL(`${base}/${parts.join("/")}`);

  // preserve querystring
  const incoming = new URL(req.url);
  incoming.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const headers = new Headers();
  const vaultToken = req.headers.get("x-vault-token");
  if (vaultToken) headers.set("X-Vault-Token", vaultToken);

  const method = req.method || "GET";
  let body = undefined;

  if (method !== "GET" && method !== "HEAD") {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await req.json().catch(() => ({}));
      body = JSON.stringify(j);
      headers.set("Content-Type", "application/json");
    } else {
      body = await req.text();
      if (ct) headers.set("Content-Type", ct);
    }
  }

  const upstreamRes = await fetch(url.toString(), { method, headers, body, cache: "no-store" });

  const respHeaders = new Headers(corsHeaders());
  const upstreamCT = upstreamRes.headers.get("content-type");
  if (upstreamCT) respHeaders.set("content-type", upstreamCT);

  const data = await upstreamRes.arrayBuffer();
  return new Response(data, { status: upstreamRes.status, headers: respHeaders });
}

export async function OPTIONS() {
  return new Response("", { status: 200, headers: corsHeaders() });
}

export async function GET(req, ctx) {
  return proxy(req, ctx);
}

export async function POST(req, ctx) {
  return proxy(req, ctx);
}

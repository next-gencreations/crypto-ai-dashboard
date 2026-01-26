// app/api/proxy/_lib.js

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
]);

function getUpstreamBase() {
  const base =
    process.env.API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.UPSTREAM_API_BASE ||
    "";

  if (!base) {
    throw new Error(
      "Missing API base URL. Set API_BASE (recommended) to https://crypto-ai-api-1-7cte.onrender.com"
    );
  }

  return base.replace(/\/+$/, ""); // trim trailing slash
}

export async function proxyFetch(req, upstreamPath) {
  const base = getUpstreamBase();

  // If route passed "/vault/status" keep it, if passed "vault/status" fix it
  const p = (upstreamPath || "").startsWith("/")
    ? upstreamPath
    : "/" + (upstreamPath || "");

  const url = new URL(base + p);

  // Copy query string from incoming request
  const inUrl = new URL(req.url);
  inUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  // Forward headers (including X-Vault-Token)
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (!HOP_BY_HOP.has(k)) headers.set(key, value);
  });

  // Ensure JSON works nicely through proxy
  if (!headers.has("accept")) headers.set("accept", "application/json");

  // Forward body for non-GET/HEAD
  let body = undefined;
  const method = req.method || "GET";
  if (method !== "GET" && method !== "HEAD") {
    // IMPORTANT: use arrayBuffer so it works for json + anything else
    const buf = await req.arrayBuffer();
    body = buf.byteLength ? buf : undefined;
  }

  const upstreamRes = await fetch(url.toString(), {
    method,
    headers,
    body,
    redirect: "manual",
  });

  // Copy response headers back (but avoid hop-by-hop)
  const outHeaders = new Headers();
  upstreamRes.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (!HOP_BY_HOP.has(k)) outHeaders.set(key, value);
  });

  // Add permissive CORS (safe for your dashboard)
  outHeaders.set("access-control-allow-origin", "*");
  outHeaders.set(
    "access-control-allow-methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  outHeaders.set("access-control-allow-headers", "*");

  const resBody = await upstreamRes.arrayBuffer();
  return new Response(resBody, {
    status: upstreamRes.status,
    headers: outHeaders,
  });
}

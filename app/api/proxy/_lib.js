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
      "Missing API base URL. Set API_BASE to https://crypto-ai-api-1-7cte.onrender.com"
    );
  }

  return base.replace(/\/+$/, "");
}

export async function proxyFetch(req, upstreamPath) {
  const base = getUpstreamBase();

  const p = (upstreamPath || "").startsWith("/")
    ? upstreamPath
    : "/" + (upstreamPath || "");

  const url = new URL(base + p);

  // forward query params
  const inUrl = new URL(req.url);
  inUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  // forward headers (incl X-Vault-Token)
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (!HOP_BY_HOP.has(k)) headers.set(key, value);
  });

  if (!headers.has("accept")) headers.set("accept", "application/json");

  // forward body for non-GET/HEAD
  let body = undefined;
  const method = req.method || "GET";
  if (method !== "GET" && method !== "HEAD") {
    const buf = await req.arrayBuffer();
    body = buf.byteLength ? buf : undefined;
  }

  const upstreamRes = await fetch(url.toString(), {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const outHeaders = new Headers();
  upstreamRes.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (!HOP_BY_HOP.has(k)) outHeaders.set(key, value);
  });

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

// Some routes import proxyUpstream. Keep it as an alias.
export async function proxyUpstream(req, upstreamPath) {
  return proxyFetch(req, upstreamPath);
}

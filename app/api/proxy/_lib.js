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
    process.env.UPSTREAM_API_URL ||
    process.env.API_URL ||
    process.env.API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.UPSTREAM_API_BASE ||
    "";

  if (!base) {
    throw new Error(
      "Missing upstream URL. Add UPSTREAM_API_URL=https://coinbase-trader-bot-r39n.onrender.com in Vercel environment variables."
    );
  }

  return base.replace(/\/+$/, "");
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "*",
  };
}

export async function proxyFetch(req, upstreamPath) {
  try {
    const base = getUpstreamBase();

    const path = upstreamPath.startsWith("/")
      ? upstreamPath
      : "/" + upstreamPath;

    const url = new URL(base + path);

    const inUrl = new URL(req.url);
    inUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

    const headers = new Headers();

    req.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (!HOP_BY_HOP.has(k)) headers.set(key, value);
    });

    headers.set("accept", "application/json");

    const method = req.method || "GET";
    let body = undefined;

    if (method !== "GET" && method !== "HEAD") {
      const buf = await req.arrayBuffer();
      body = buf.byteLength ? buf : undefined;
    }

    const upstreamRes = await fetch(url.toString(), {
      method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });

    const contentType = upstreamRes.headers.get("content-type") || "";
    const text = await upstreamRes.text();

    if (!upstreamRes.ok) {
      return Response.json(
        {
          ok: false,
          status: upstreamRes.status,
          upstream: url.toString(),
          error: text.slice(0, 600),
        },
        {
          status: upstreamRes.status,
          headers: corsHeaders(),
        }
      );
    }

    if (contentType.includes("application/json")) {
      return new Response(text, {
        status: 200,
        headers: {
          ...corsHeaders(),
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      });
    }

    return Response.json(
      {
        ok: false,
        upstream: url.toString(),
        error: "Upstream did not return JSON",
        preview: text.slice(0, 600),
      },
      {
        status: 502,
        headers: corsHeaders(),
      }
    );
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: err.message || String(err),
      },
      {
        status: 500,
        headers: corsHeaders(),
      }
    );
  }
}

export async function proxyUpstream(req, upstreamPath) {
  return proxyFetch(req, upstreamPath);
}

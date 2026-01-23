export const runtime = "nodejs";

function rewriteLegacy(path) {
  // Support old/legacy vault routes that some UI builds used
  if (path === "/vault/set-pin") return "/vault/pin/set";
  if (path === "/vault/use-pin") return "/vault/unlock";
  return path;
}

function getApiBase() {
  // Prefer Vercel env var, fallback to your Render URL
  return (process.env.API_BASE || "https://crypto-ai-api-1-7cte.onrender.com").replace(/\/$/, "");
}

async function forward(req, ctx) {
  const API_BASE = getApiBase();

  const raw = "/" + ((ctx?.params?.path || []).join("/"));
  const path = rewriteLegacy(raw);
  const url = API_BASE + path;

  // Copy headers but remove ones that can break proxying
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  // Ensure content-type for JSON posts (some clients omit it)
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (!headers.get("content-type")) {
      headers.set("content-type", "application/json");
    }
  }

  // Build fetch init
  const init = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  // ✅ IMPORTANT FIX:
  // In Next.js route handlers, req.body is a ReadableStream.
  // Forwarding that stream directly is unreliable in Node/Undici.
  // Buffer it and forward bytes instead.
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const buf = await req.arrayBuffer();
      // Only set body if there actually is one
      if (buf && buf.byteLength > 0) {
        init.body = buf;
      }
    } catch (e) {
      // If body read fails, still try without body
    }
  }

  let res;
  try {
    res = await fetch(url, init);
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: "proxy_fetch_failed", detail: String(e) }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  // Pass response through
  const outHeaders = new Headers(res.headers);
  outHeaders.set("access-control-allow-origin", "*");

  return new Response(res.body, {
    status: res.status,
    headers: outHeaders,
  });
}

export async function GET(req, ctx) { return forward(req, ctx); }
export async function POST(req, ctx) { return forward(req, ctx); }
export async function PUT(req, ctx) { return forward(req, ctx); }
export async function PATCH(req, ctx) { return forward(req, ctx); }
export async function DELETE(req, ctx) { return forward(req, ctx); }

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "*",
    },
  });
}

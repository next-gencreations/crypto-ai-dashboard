export const runtime = "nodejs";

function rewriteLegacy(path) {
  // Support old/legacy vault routes that some UI builds may still call
  // Old:  /vault/set-pin  -> New: /vault/pin/set
  if (path === "/vault/set-pin") return "/vault/pin/set";
  if (path === "/vault/use-pin") return "/vault/unlock"; // (optional legacy)
  return path;
}

async function forward(req, ctx) {
  const API_BASE = process.env.API_BASE || "https://crypto-ai-api-1-7cte.onrender.com";

  const raw = "/" + (ctx?.params?.path || []).join("/");
  const path = rewriteLegacy(raw);

  const url = API_BASE.replace(/\/$/, "") + path;

  const headers = new Headers(req.headers);
  headers.delete("host");

  const init = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const res = await fetch(url, init);

  const outHeaders = new Headers(res.headers);
  outHeaders.set("x-proxy-upstream", url);

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

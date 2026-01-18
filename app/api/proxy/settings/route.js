export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function forward(method, req) {
  const base = (process.env.UPSTREAM_API_URL || "").replace(/\/+$/, "");
  if (!base) {
    return new Response(JSON.stringify({ ok:false, error:"Missing UPSTREAM_API_URL"}), { status:500 });
  }

  const body = method !== "GET" ? await req.text() : undefined;

  const r = await fetch(`${base}/settings`, {
    method,
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store"
  });

  const text = await r.text();
  return new Response(text, { status:r.status, headers:{ "Content-Type":"application/json" }});
}

export async function GET(req){ return forward("GET", req); }
export async function POST(req){ return forward("POST", req); }

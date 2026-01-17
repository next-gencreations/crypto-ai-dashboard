export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = (process.env.UPSTREAM_API_URL || process.env.RENDER_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

async function handler(req, { params }) {
  if (!BASE) return new Response("No upstream", { status: 500 });

  const path = params.path?.join("/") || "";
  const url = `${BASE}/${path}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  const init = {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
  };

  const r = await fetch(url, init);
  return new Response(r.body, { status: r.status, headers: r.headers });
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };

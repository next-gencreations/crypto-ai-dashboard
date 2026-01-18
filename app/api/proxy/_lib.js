export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function upstreamBase() {
  return (
    process.env.UPSTREAM_API_URL ||
    process.env.RENDER_API_URL ||
    process.env.API_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");
}

export async function proxyGet(path) {
  const base = upstreamBase();
  if (!base) {
    return new Response(JSON.stringify({ ok: false, error: "Missing upstream env on Vercel." }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const url = `${base}/${String(path).replace(/^\/+/, "")}`;
  const r = await fetch(url, { cache: "no-store" });

  const ct = r.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await r.json() : await r.text();

  return new Response(JSON.stringify(body), {
    status: r.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

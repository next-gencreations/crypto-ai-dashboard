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

export async function GET() {
  const base = upstreamBase();
  const url = `${base}/health`;

  try {
    const r = await fetch(url, { cache: "no-store" });
    const ct = r.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await r.json() : await r.text();

    return new Response(
      JSON.stringify({
        ok: r.ok,
        upstreamBase: base,
        upstreamHealthUrl: url,
        upstreamStatus: r.status,
        upstreamBody: body,
      }),
      { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, upstreamBase: base, upstreamHealthUrl: url, error: String(e?.message || e) }),
      { status: 502, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  }
}

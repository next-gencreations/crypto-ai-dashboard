export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const base = (process.env.UPSTREAM_API_URL ||
    process.env.RENDER_API_URL ||
    process.env.UPSTREAM_URL ||
    "").trim().replace(/\/+$/, "");

  if (!base) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing UPSTREAM_API_URL/RENDER_API_URL on Vercel" }),
      { status: 500, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  }

  const healthUrl = `${base}/health`;
  let upstreamStatus = null;
  let upstreamBody = null;

  try {
    const r = await fetch(healthUrl, { cache: "no-store" });
    upstreamStatus = r.status;
    const ct = r.headers.get("content-type") || "";
    upstreamBody = ct.includes("application/json") ? await r.json() : await r.text();
  } catch (e) {
    upstreamBody = String(e?.message || e);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      upstreamBase: base,
      healthUrl,
      upstreamStatus,
      upstreamBody,
      time: new Date().toISOString(),
    }),
    { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
  );
}

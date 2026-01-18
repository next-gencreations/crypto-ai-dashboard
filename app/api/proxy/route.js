// app/api/proxy/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const base = (process.env.UPSTREAM_API_URL || process.env.RENDER_API_URL || process.env.API_URL || "")
    .trim()
    .replace(/\/+$/, "");

  const healthUrl = base ? `${base}/health` : null;

  let upstreamStatus = null;
  let upstreamBody = null;

  if (healthUrl) {
    try {
      const r = await fetch(healthUrl, { cache: "no-store" });
      upstreamStatus = r.status;
      const ct = r.headers.get("content-type") || "";
      upstreamBody = ct.includes("application/json") ? await r.json() : await r.text();
    } catch (e) {
      upstreamBody = String(e?.message || e);
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      time: new Date().toISOString(),
      hasUpstreamEnv: !!base,
      upstreamBase: base || null,
      upstreamHealthUrl: healthUrl,
      upstreamStatus,
      upstreamBody,
    }),
    { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const base = (process.env.UPSTREAM_API_URL || process.env.RENDER_API_URL || "")
    .trim()
    .replace(/\/+$/, "");

  const testUrl = base ? `${base}/health` : null;

  let upstream = null;
  let upstreamStatus = null;
  let upstreamBody = null;

  if (testUrl) {
    try {
      const r = await fetch(testUrl, { cache: "no-store" });
      upstreamStatus = r.status;
      const ct = r.headers.get("content-type") || "";
      upstreamBody = ct.includes("application/json") ? await r.json() : await r.text();
      upstream = testUrl;
    } catch (e) {
      upstream = testUrl;
      upstreamBody = String(e?.message || e);
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      vercelTime: new Date().toISOString(),
      hasUpstreamEnv: !!base,
      upstreamBase: base || null,
      upstreamHealthUrl: upstream,
      upstreamStatus,
      upstreamBody,
    }),
    { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
  );
}

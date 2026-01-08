export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(JSON.stringify({
    UPSTREAM_API_URL: process.env.UPSTREAM_API_URL || null,
    RENDER_API_URL: process.env.RENDER_API_URL || null,
  }, null, 2), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

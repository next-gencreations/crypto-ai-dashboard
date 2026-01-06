// app/api/proxy/[...path]/route.js
export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const base = (process.env.RENDER_API_URL || "").replace(/\/+$/, "");
  if (!base) {
    return new Response(
      JSON.stringify({ error: "Missing RENDER_API_URL on Vercel" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const path = Array.isArray(params?.path) ? params.path.join("/") : "";
  const url = new URL(req.url);
  const upstream = `${base}/${path}${url.search || ""}`;

  try {
    const res = await fetch(upstream, { cache: "no-store" });
    const text = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";

    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch upstream", detail: String(err) }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}

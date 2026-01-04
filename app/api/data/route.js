// app/api/data/route.js
export const dynamic = "force-dynamic";

export async function GET() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!apiBase) {
    return new Response(
      JSON.stringify({ error: "Missing NEXT_PUBLIC_API_URL" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const res = await fetch(`${apiBase}/data`, { cache: "no-store" });
    const text = await res.text();

    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch upstream", detail: String(err) }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}

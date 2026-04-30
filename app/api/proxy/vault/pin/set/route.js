export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    const apiBase =
      process.env.API_BASE ||
      process.env.UPSTREAM_API_BASE ||
      process.env.NEXT_PUBLIC_API_BASE;

    if (!apiBase) {
      return Response.json(
        { ok: false, error: "Missing API_BASE env var" },
        { status: 500 }
      );
    }

    const upstream = await fetch(`${apiBase}/vault/pin/set`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await upstream.text();

    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return Response.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

// app/api/proxy/_lib.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function upstreamBase() {
  const base = (
    process.env.UPSTREAM_API_URL ||
    process.env.RENDER_API_URL ||
    process.env.API_URL ||          // keep compatibility
    process.env.UPSTREAM_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");

  return base;
}

export async function proxyGet(pathname) {
  const base = upstreamBase();
  if (!base) {
    return {
      ok: false,
      error:
        "No upstream set. Add UPSTREAM_API_URL (recommended) or RENDER_API_URL (or API_URL) on Vercel.",
    };
  }

  const url = `${base}${pathname.startsWith("/") ? "" : "/"}${pathname}`;

  try {
    const r = await fetch(url, { cache: "no-store" });
    const ct = r.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await r.json() : await r.text();

    // If upstream returns JSON with ok/enabled fields, pass it through.
    if (typeof body === "object" && body !== null) return body;

    return { ok: r.ok, status: r.status, body };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

// app/api/proxy/_lib.js

export function getUpstreamBase() {
  const base = (process.env.API_URL || "").replace(/\/+$/, "");

  // IMPORTANT:
  // During Vercel build/prerender, env vars may not be available.
  // Don't throw here—return null so the route can respond gracefully.
  if (!base) return null;

  return base;
}

export async function proxyGet(path) {
  const base = getUpstreamBase();
  if (!base) {
    return { ok: false, error: "API_URL not configured (missing in Vercel env vars)" };
  }

  const url = `${base}${path}`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  const txt = await res.text().catch(() => "");

  if (!res.ok) {
    return {
      ok: false,
      upstream_status: res.status,
      upstream_statusText: res.statusText,
      upstream_url: url,
      error: txt ? txt.slice(0, 500) : "Upstream failed",
    };
  }

  try {
    return txt ? JSON.parse(txt) : null;
  } catch {
    return {
      ok: false,
      upstream_url: url,
      error: `Upstream returned non-JSON: ${txt.slice(0, 200)}`,
    };
  }
}

export async function proxyPost(path, body) {
  const base = getUpstreamBase();
  if (!base) {
    return { ok: false, error: "API_URL not configured (missing in Vercel env vars)" };
  }

  const url = `${base}${path}`;

  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body || {}),
  });

  const txt = await res.text().catch(() => "");

  if (!res.ok) {
    return {
      ok: false,
      upstream_status: res.status,
      upstream_statusText: res.statusText,
      upstream_url: url,
      error: txt ? txt.slice(0, 500) : "Upstream failed",
    };
  }

  try {
    return txt ? JSON.parse(txt) : null;
  } catch {
    return {
      ok: false,
      upstream_url: url,
      error: `Upstream returned non-JSON: ${txt.slice(0, 200)}`,
    };
  }
}

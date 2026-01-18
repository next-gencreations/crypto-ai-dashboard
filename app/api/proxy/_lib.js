// app/api/proxy/_lib.js

function upstreamBase() {
  const base = (
    process.env.UPSTREAM_API_URL ||
    process.env.RENDER_API_URL ||
    process.env.UPSTREAM_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");

  return base;
}

function joinUrl(base, path) {
  const p = String(path || "").replace(/^\/+/, "");
  return `${base}/${p}`;
}

async function proxyFetch(path, { method = "GET", body } = {}) {
  const base = upstreamBase();

  if (!base) {
    return {
      ok: false,
      error: "Missing UPSTREAM_API_URL (or RENDER_API_URL / UPSTREAM_URL) on Vercel.",
    };
  }

  const url = joinUrl(base, path);

  const headers = new Headers();
  headers.set("accept", "application/json");

  const init = {
    method,
    headers,
    cache: "no-store",
  };

  if (body !== undefined) {
    headers.set("content-type", "application/json");
    init.body = JSON.stringify(body);
  }

  try {
    const r = await fetch(url, init);
    const ct = r.headers.get("content-type") || "";
    const data = ct.includes("application/json") ? await r.json() : await r.text();

    // If upstream returns non-2xx, still return payload for debugging
    if (!r.ok) {
      return { ok: false, status: r.status, upstream: url, body: data };
    }

    return data; // keep same behavior as your existing proxyGet
  } catch (e) {
    return { ok: false, error: String(e?.message || e), upstream: url };
  }
}

export async function proxyGet(path) {
  return proxyFetch(path, { method: "GET" });
}

export async function proxyPost(path, body) {
  return proxyFetch(path, { method: "POST", body });
}

export async function proxyPut(path, body) {
  return proxyFetch(path, { method: "PUT", body });
}

export async function proxyPatch(path, body) {
  return proxyFetch(path, { method: "PATCH", body });
}

export async function proxyDelete(path, body) {
  return proxyFetch(path, { method: "DELETE", body });
}

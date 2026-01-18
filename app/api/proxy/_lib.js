// app/api/proxy/_lib.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function upstreamBase() {
  const base = (
    process.env.API_URL ||
    process.env.UPSTREAM_API_URL ||
    process.env.RENDER_API_URL ||
    process.env.UPSTREAM_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");

  return base;
}

export function joinUrl(base, path) {
  const p = String(path || "").replace(/^\/+/, "");
  return `${base}/${p}`;
}

async function requestUpstream(path, { method = "GET", body, headers } = {}) {
  const base = upstreamBase();

  if (!base) {
    return {
      ok: false,
      error: "missing_upstream_env",
      hint:
        "Set API_URL (recommended) or UPSTREAM_API_URL on Vercel to your Render base, e.g. https://xxxx.onrender.com",
    };
  }

  const url = joinUrl(base, path);

  const h = new Headers(headers || {});
  if (!h.get("accept")) h.set("accept", "application/json");

  const init = { method, headers: h, cache: "no-store" };

  if (method !== "GET" && method !== "HEAD" && body !== undefined) {
    // if body is already a string/Buffer/etc keep it, otherwise JSON encode
    if (
      typeof body === "string" ||
      body instanceof ArrayBuffer ||
      ArrayBuffer.isView(body)
    ) {
      init.body = body;
    } else {
      h.set("content-type", "application/json");
      init.body = JSON.stringify(body);
    }
  }

  const res = await fetch(url, init);
  const ct = res.headers.get("content-type") || "";

  let data;
  try {
    data = ct.includes("application/json") ? await res.json() : await res.text();
  } catch (e) {
    data = { parse_error: String(e?.message || e) };
  }

  // If upstream returns an object already, keep it.
  // If it returns text, wrap it so NextResponse.json doesn't break.
  if (typeof data === "string") {
    return { ok: res.ok, status: res.status, text: data };
  }

  // Merge a few helpful bits without overwriting upstream keys
  return {
    ok: res.ok,
    status: res.status,
    ...data,
  };
}

export async function proxyGet(path, extraHeaders) {
  return requestUpstream(path, { method: "GET", headers: extraHeaders });
}

export async function proxyPost(path, body, extraHeaders) {
  return requestUpstream(path, { method: "POST", body, headers: extraHeaders });
}

export async function proxyPut(path, body, extraHeaders) {
  return requestUpstream(path, { method: "PUT", body, headers: extraHeaders });
}

export async function proxyDelete(path, extraHeaders) {
  return requestUpstream(path, { method: "DELETE", headers: extraHeaders });
}

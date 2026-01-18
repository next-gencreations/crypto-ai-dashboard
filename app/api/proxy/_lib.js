const UPSTREAM = process.env.UPSTREAM_API;

function buildUrl(path) {
  if (!UPSTREAM) throw new Error("UPSTREAM_API not set");
  return `${UPSTREAM}${path}`;
}

export async function proxyGet(path) {
  const res = await fetch(buildUrl(path), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function proxyPost(path, body) {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

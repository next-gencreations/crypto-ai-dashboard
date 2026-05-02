export async function GET(req, { params }) {
  try {
    const path = params.path.join("/")
    const base = process.env.BOT_BASE_URL

    const url = `${base}/${path}`

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Bot request failed" }),
        { status: res.status }
      )
    }

    const data = await res.text()

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Proxy error", details: err.message }),
      { status: 500 }
    )
  }
}

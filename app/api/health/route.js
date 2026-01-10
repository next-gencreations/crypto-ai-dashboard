export async function GET() {
  return new Response(
    JSON.stringify({ ok: true, service: "dashboard" }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

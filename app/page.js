"use client";

import { useEffect, useMemo, useState } from "react";

const REFRESH_MS = 5000;

function fmtMoney(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}
function fmtNum(n, dp = 2) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(dp);
}
function fmtPct(n, dp = 1) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return (Number(n) * 100).toFixed(dp) + "%";
}

function MiniLineChart({ points, height = 140 }) {
  // points: [{time_utc, equity_usd}]
  const w = 520;
  const h = height;

  const series = (points || []).filter(p => typeof p?.equity_usd === "number");
  if (series.length < 2) {
    return (
      <div style={{ height: h, display: "grid", placeItems: "center", opacity: 0.7 }}>
        Not enough data yet
      </div>
    );
  }

  const ys = series.map(p => p.equity_usd);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = (maxY - minY) * 0.08 || 1;

  const yMin = minY - pad;
  const yMax = maxY + pad;

  const toX = (i) => (i / (series.length - 1)) * (w - 20) + 10;
  const toY = (y) => {
    const t = (y - yMin) / (yMax - yMin);
    return (h - 20) - t * (h - 20) + 10;
  };

  const d = series
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.equity_usd)}`)
    .join(" ");

  const latest = series[series.length - 1]?.equity_usd;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.8, fontSize: 12, marginBottom: 6 }}>
        <span>Equity (last {series.length} pts)</span>
        <span>Latest: {fmtMoney(latest)}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ borderRadius: 14, background: "rgba(255,255,255,0.03)" }}>
        {/* baseline */}
        <line x1="10" y1={h - 10} x2={w - 10} y2={h - 10} stroke="rgba(255,255,255,0.10)" />
        {/* midline */}
        <line x1="10" y1={h / 2} x2={w - 10} y2={h / 2} stroke="rgba(255,255,255,0.06)" />
        {/* path */}
        <path d={d} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.6, fontSize: 12, marginTop: 6 }}>
        <span>Min: {fmtMoney(minY)}</span>
        <span>Max: {fmtMoney(maxY)}</span>
      </div>
    </div>
  );
}

export default function Page() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";
  const dataUrl = apiBase ? `${apiBase}/data` : "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [payload, setPayload] = useState(null);
  const [lastFetchAt, setLastFetchAt] = useState(null);

  const heartbeat = payload?.heartbeat || {};
  const pet = payload?.pet || {};
  const stats = payload?.stats || {};
  const equity = payload?.equity || [];
  const trades = payload?.trades || [];
  const control = payload?.control || {};
  const prices = payload?.prices || {};

  const pricesOk = heartbeat?.prices_ok === 1 || heartbeat?.prices_ok === true;

  async function fetchData(signal) {
    if (!dataUrl) {
      setErr("Missing NEXT_PUBLIC_API_URL in Vercel environment variables.");
      setLoading(false);
      return;
    }
    try {
      setErr("");
      const res = await fetch(dataUrl, { cache: "no-store", signal });
      if (!res.ok) throw new Error(`API responded ${res.status}`);
      const json = await res.json();
      setPayload(json);
      setLastFetchAt(new Date());
    } catch (e) {
      if (e?.name === "AbortError") return;
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ac = new AbortController();
    fetchData(ac.signal);

    const t = setInterval(() => {
      const ac2 = new AbortController();
      fetchData(ac2.signal);
      // auto-abort after 8s to avoid hanging on free tiers
      setTimeout(() => ac2.abort(), 8000);
    }, REFRESH_MS);

    return () => {
      ac.abort();
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl]);

  async function postJson(path, body) {
    if (!apiBase) return;
    const res = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json();
  }

  const paused = !!stats?.paused;

  const pageStyle = {
    minHeight: "100vh",
    padding: 18,
    background: "radial-gradient(1200px 900px at 20% 10%, rgba(120,90,255,0.25), transparent 55%), radial-gradient(900px 800px at 70% 40%, rgba(0,200,255,0.15), transparent 55%), #070A12",
    color: "rgba(255,255,255,0.92)",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
  };

  const card = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  };

  const pill = (bg) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    background: bg || "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    fontSize: 12,
    opacity: 0.95,
  });

  const btn = {
    padding: "9px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.92)",
    cursor: "pointer",
  };

  const grid = {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "repeat(12, 1fr)",
    alignItems: "stretch",
  };

  const small = { fontSize: 12, opacity: 0.75 };

  const petEmoji = useMemo(() => {
    const stage = String(pet?.stage || "egg").toLowerCase();
    if (stage.includes("egg")) return "🥚";
    if (stage.includes("hatch")) return "🐣";
    if (stage.includes("active")) return "🐥";
    if (stage.includes("beast")) return "🐉";
    return "🐣";
  }, [pet?.stage]);

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.2 }}>🚀 Crypto AI Dashboard</div>
            <div style={small}>
              API: <span style={{ opacity: 0.95 }}>{apiBase || "—"}</span> · Refresh: {REFRESH_MS / 1000}s ·{" "}
              Last update: {lastFetchAt ? lastFetchAt.toLocaleTimeString() : "—"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={btn} onClick={() => fetchData(new AbortController().signal)}>Refresh</button>
            <a style={{ ...btn, textDecoration: "none", display: "inline-flex", alignItems: "center" }} href={dataUrl} target="_blank" rel="noreferrer">
              Open /data
            </a>
            <button
              style={btn}
              onClick={async () => {
                try {
                  await postJson("/control/pause", { seconds: 600, reason: "Paused from dashboard" });
                  await fetchData(new AbortController().signal);
                } catch (e) {
                  setErr(String(e?.message || e));
                }
              }}
            >
              Pause 10m
            </button>
            <button
              style={btn}
              onClick={async () => {
                try {
                  await postJson("/control/revive", { reason: "Revived from dashboard" });
                  await fetchData(new AbortController().signal);
                } catch (e) {
                  setErr(String(e?.message || e));
                }
              }}
            >
              Revive
            </button>
          </div>
        </div>

        {err && (
          <div style={{ ...card, borderColor: "rgba(255,80,80,0.45)", background: "rgba(255,80,80,0.10)", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠️ Dashboard error</div>
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12, opacity: 0.95 }}>
              {err}
            </div>
            <div style={{ marginTop: 8, ...small }}>
              If this says “Missing NEXT_PUBLIC_API_URL”, add it in Vercel and redeploy. If it says “API responded 404/500”, the API endpoint is wrong or down.
            </div>
          </div>
        )}

        {/* Top grid */}
        <div style={grid}>
          {/* Heartbeat */}
          <div style={{ ...card, gridColumn: "span 12" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Heartbeat</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span style={pill(paused ? "rgba(255,200,80,0.15)" : "rgba(80,255,170,0.12)")}>
                  {paused ? "⏸ Paused" : "✅ Running"}
                </span>
                <span style={pill(pricesOk ? "rgba(80,255,170,0.12)" : "rgba(255,80,80,0.12)")}>
                  {pricesOk ? "Prices OK" : "Prices NOT OK"}
                </span>
                <span style={pill("rgba(255,255,255,0.08)")}>Survival: {heartbeat?.survival_mode || "—"}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 12 }}>
              <div>
                <div style={small}>Equity</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{fmtMoney(heartbeat?.equity_usd)}</div>
              </div>
              <div>
                <div style={small}>Markets</div>
                <div style={{ fontWeight: 700 }}>
                  {(() => {
                    try {
                      const m = heartbeat?.markets;
                      if (Array.isArray(m)) return m.join(", ") || "—";
                      if (typeof m === "string") {
                        const parsed = JSON.parse(m);
                        return Array.isArray(parsed) ? parsed.join(", ") : m;
                      }
                      return "—";
                    } catch {
                      return heartbeat?.markets || "—";
                    }
                  })()}
                </div>
              </div>
              <div>
                <div style={small}>Open positions</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{heartbeat?.open_positions ?? "—"}</div>
              </div>
              <div>
                <div style={small}>Bot status</div>
                <div style={{ fontWeight: 800 }}>{heartbeat?.status || "—"}</div>
              </div>
              <div>
                <div style={small}>Last heartbeat</div>
                <div style={{ fontWeight: 700 }}>{heartbeat?.time_utc || "—"}</div>
              </div>
            </div>
          </div>

          {/* Pet */}
          <div style={{ ...card, gridColumn: "span 5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Pet</div>
              <div style={{ fontSize: 42 }}>{petEmoji}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 10 }}>
              <div>
                <div style={small}>Stage</div>
                <div style={{ fontWeight: 800 }}>{pet?.stage || "—"}</div>
              </div>
              <div>
                <div style={small}>Mood</div>
                <div style={{ fontWeight: 800 }}>{pet?.mood || "—"}</div>
              </div>
              <div>
                <div style={small}>Health</div>
                <div style={{ fontWeight: 800 }}>{fmtNum(pet?.health, 1)}</div>
              </div>
              <div>
                <div style={small}>Hunger</div>
                <div style={{ fontWeight: 800 }}>{fmtNum(pet?.hunger, 1)}</div>
              </div>
              <div>
                <div style={small}>Growth</div>
                <div style={{ fontWeight: 800 }}>{fmtNum(pet?.growth, 1)}</div>
              </div>
              <div>
                <div style={small}>Fainted until</div>
                <div style={{ fontWeight: 700, fontSize: 12, opacity: 0.85 }}>{pet?.fainted_until_utc || "—"}</div>
              </div>
            </div>

            <div style={{ marginTop: 10, ...small }}>
              Pet time: <span style={{ opacity: 0.95 }}>{pet?.time_utc || "—"}</span>
            </div>
          </div>

          {/* Stats + chart */}
          <div style={{ ...card, gridColumn: "span 7" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Trading Stats</div>
              <div style={small}>
                Control updated: <span style={{ opacity: 0.95 }}>{control?.updated_time_utc || "—"}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
              <div>
                <div style={small}>Total trades</div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{stats?.total_trades ?? "—"}</div>
              </div>
              <div>
                <div style={small}>Win rate</div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{fmtPct(stats?.win_rate)}</div>
              </div>
              <div>
                <div style={small}>Total PnL</div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{fmtMoney(stats?.total_pnl_usd)}</div>
              </div>
              <div>
                <div style={small}>Deaths</div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{stats?.total_deaths ?? "—"}</div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <MiniLineChart points={equity} />
            </div>
          </div>

          {/* Trades */}
          <div style={{ ...card, gridColumn: "span 12" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Recent Trades</div>
              <div style={small}>{trades?.length ? `${trades.length} loaded` : "No trades yet"}</div>
            </div>

            <div style={{ marginTop: 10, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr style={{ textAlign: "left", fontSize: 12, opacity: 0.7 }}>
                    <th style={{ padding: "10px 8px" }}>Time (UTC)</th>
                    <th style={{ padding: "10px 8px" }}>Market</th>
                    <th style={{ padding: "10px 8px" }}>Side</th>
                    <th style={{ padding: "10px 8px" }}>Size</th>
                    <th style={{ padding: "10px 8px" }}>Price</th>
                    <th style={{ padding: "10px 8px" }}>PnL</th>
                    <th style={{ padding: "10px 8px" }}>Confidence</th>
                    <th style={{ padding: "10px 8px" }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(trades || []).slice(-15).reverse().map((t, idx) => (
                    <tr key={idx} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                      <td style={{ padding: "10px 8px", fontSize: 12, opacity: 0.85 }}>{t.time_utc || "—"}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 700 }}>{t.market || "—"}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 800 }}>{t.side || "—"}</td>
                      <td style={{ padding: "10px 8px" }}>{fmtMoney(t.size_usd)}</td>
                      <td style={{ padding: "10px 8px" }}>{fmtNum(t.price, 2)}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 900 }}>{fmtMoney(t.pnl_usd)}</td>
                      <td style={{ padding: "10px 8px" }}>{fmtNum(t.confidence, 2)}</td>
                      <td style={{ padding: "10px 8px", fontSize: 12, opacity: 0.85 }}>{t.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 10, ...small }}>
              Prices snapshot:{" "}
              <span style={{ opacity: 0.95 }}>
                {Object.keys(prices || {}).length ? JSON.stringify(prices).slice(0, 120) + "…" : "—"}
              </span>
            </div>
          </div>
        </div>

        {loading && !payload && (
          <div style={{ ...small, marginTop: 12, opacity: 0.9 }}>
            Loading dashboard data…
          </div>
        )}
      </div>
    </div>
  );
}

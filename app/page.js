"use client";

import { useEffect, useMemo, useState } from "react";

function fmt(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fmtInt(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString();
}

function timeAgo(iso) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function clamp01(x) {
  const v = Number(x);
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

function ProgressBar({ label, value }) {
  const v = clamp01(value);
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.85 }}>
        <span>{label}</span>
        <span>{fmt(v, 0)}%</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div
          style={{
            width: `${v}%`,
            height: "100%",
            borderRadius: 999,
            background: "linear-gradient(90deg, rgba(122,162,247,0.95), rgba(46,213,115,0.95))",
          }}
        />
      </div>
    </div>
  );
}

// Simple SVG line chart (no libraries)
function EquityChart({ points }) {
  const W = 900;
  const H = 220;
  const PAD = 18;

  const series = Array.isArray(points) ? points : [];
  const xs = series.map((_, i) => i);
  const ys = series.map((p) => Number(p.equity_usd)).filter((n) => !Number.isNaN(n));

  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 1;
  const span = maxY - minY || 1;

  const d = series
    .map((p, i) => {
      const x = PAD + (i / Math.max(1, series.length - 1)) * (W - PAD * 2);
      const yv = Number(p.equity_usd);
      const y = PAD + (1 - (yv - minY) / span) * (H - PAD * 2);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const latest = series[series.length - 1]?.equity_usd;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontSize: 14, opacity: 0.9 }}>Equity (last {fmtInt(series.length)} points)</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Latest: ${fmt(latest, 2)}</div>
      </div>

      <div
        style={{
          marginTop: 10,
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="220" preserveAspectRatio="none">
          <defs>
            <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(122,162,247,0.35)" />
              <stop offset="100%" stopColor="rgba(122,162,247,0.02)" />
            </linearGradient>
          </defs>

          {/* baseline */}
          <line
            x1={PAD}
            y1={H - PAD}
            x2={W - PAD}
            y2={H - PAD}
            stroke="rgba(255,255,255,0.08)"
          />

          {/* area fill */}
          {series.length > 1 && (
            <path
              d={`${d} L ${W - PAD} ${H - PAD} L ${PAD} ${H - PAD} Z`}
              fill="url(#eqFill)"
              stroke="none"
            />
          )}

          {/* line */}
          <path d={d} fill="none" stroke="rgba(122,162,247,0.95)" strokeWidth="2.5" />

          {/* labels */}
          <text x={PAD} y={PAD} fill="rgba(255,255,255,0.55)" fontSize="12">
            ${fmt(maxY, 2)}
          </text>
          <text x={PAD} y={H - 6} fill="rgba(255,255,255,0.45)" fontSize="12">
            ${fmt(minY, 2)}
          </text>
        </svg>
      </div>
    </div>
  );
}

function Card({ title, children, right }) {
  return (
    <div
      style={{
        borderRadius: 18,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, letterSpacing: 0.2, opacity: 0.95 }}>{title}</h3>
        {right}
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

export default function Page() {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const refreshMs = 5000;

  async function load() {
    if (!API) {
      setErr("Missing NEXT_PUBLIC_API_URL. Add it in Vercel → Project → Settings → Environment Variables.");
      setLoading(false);
      return;
    }
    try {
      setErr("");
      const res = await fetch(`${API}/data`, { cache: "no-store" });
      if (!res.ok) throw new Error(`API responded ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setErr(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, refreshMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API]);

  const hb = data?.heartbeat || {};
  const pet = data?.pet || {};
  const stats = data?.stats || {};
  const equity = data?.equity || [];
  const trades = data?.trades || [];
  const prices = data?.prices || {};
  const control = data?.control || {};

  const marketsText = useMemo(() => {
    try {
      if (typeof hb.markets === "string") {
        const arr = JSON.parse(hb.markets);
        return Array.isArray(arr) ? arr.join(", ") : hb.markets;
      }
      if (Array.isArray(hb.markets)) return hb.markets.join(", ");
      return "";
    } catch {
      return hb.markets || "";
    }
  }, [hb.markets]);

  const topPriceLine = useMemo(() => {
    const entries = Object.entries(prices || {});
    if (!entries.length) return "—";
    // show a few
    return entries
      .slice(0, 6)
      .map(([k, v]) => `${k}: ${fmt(v, 2)}`)
      .join("  •  ");
  }, [prices]);

  return (
    <main
      style={{
        padding: 22,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        color: "rgba(255,255,255,0.92)",
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 700px at 20% 10%, rgba(122,162,247,0.22), transparent 60%), radial-gradient(1000px 600px at 80% 0%, rgba(46,213,115,0.12), transparent 60%), #0b1020",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 750, letterSpacing: 0.2 }}>
            🚀 Crypto AI Dashboard
          </div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
            API: <span style={{ opacity: 0.95 }}>{API || "—"}</span> • Refresh: {refreshMs / 1000}s
          </div>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
            Prices: {topPriceLine}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={load}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.9)",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
          <a
            href={API ? `${API}/data` : "#"}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.9)",
              textDecoration: "none",
              cursor: API ? "pointer" : "not-allowed",
              opacity: API ? 1 : 0.6,
            }}
          >
            Open /data
          </a>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 14,
            border: "1px solid rgba(255,80,80,0.35)",
            background: "rgba(255,80,80,0.08)",
            color: "rgba(255,220,220,0.95)",
            fontSize: 13,
          }}
        >
          <b>Problem:</b> {err}
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div style={{ marginTop: 18, opacity: 0.8 }}>Loading dashboard data…</div>
      )}

      {/* Grid */}
      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 14,
        }}
      >
        {/* Heartbeat */}
        <div style={{ gridColumn: "span 12" }}>
          <Card
            title="Heartbeat"
            right={
              <span
                style={{
                  fontSize: 12,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: hb.status === "running" ? "rgba(46,213,115,0.18)" : "rgba(255,160,80,0.18)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {hb.status || "—"}
              </span>
            }
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 10 }}>
              <div style={{ gridColumn: "span 6" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Equity</div>
                <div style={{ fontSize: 22, fontWeight: 740 }}>${fmt(hb.equity_usd ?? stats.equity_usd, 2)}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                  Last update: {timeAgo(hb.time_utc)}
                </div>
              </div>
              <div style={{ gridColumn: "span 6" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Markets</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>{marketsText || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Open positions</div>
                    <div style={{ fontSize: 16, marginTop: 4 }}>{fmtInt(hb.open_positions)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Prices OK</div>
                    <div style={{ fontSize: 16, marginTop: 4 }}>{hb.prices_ok ? "✅" : "❌"}</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                  Survival mode: <b>{hb.survival_mode || pet.survival_mode || "—"}</b>
                  {stats.paused ? (
                    <>
                      {" "}
                      • <b style={{ color: "rgba(255,210,120,0.95)" }}>PAUSED</b> until{" "}
                      <span>{stats.pause_until_utc || "—"}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Pet */}
        <div style={{ gridColumn: "span 12", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 14 }}>
          <div style={{ gridColumn: "span 5" }}>
            <Card title="Pet">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Stage</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{pet.stage || "—"}</div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                    Mood: <b>{pet.mood || "—"}</b>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                    Last update: {timeAgo(pet.time_utc)}
                  </div>
                </div>
                <div
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 20,
                    background: "rgba(122,162,247,0.10)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 34,
                  }}
                  title="Your bot-pet avatar placeholder (we’ll replace with a real one next)"
                >
                  🐣
                </div>
              </div>

              <ProgressBar label="Health" value={pet.health} />
              <ProgressBar label="Hunger" value={pet.hunger} />
              <ProgressBar label="Growth" value={pet.growth} />

              {pet.fainted_until_utc ? (
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                  Fainted until: <b>{pet.fainted_until_utc}</b>
                </div>
              ) : null}
            </Card>
          </div>

          {/* Stats */}
          <div style={{ gridColumn: "span 7" }}>
            <Card title="Trading Stats">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 10 }}>
                <div style={{ gridColumn: "span 4" }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Total trades</div>
                  <div style={{ fontSize: 20, fontWeight: 740 }}>{fmtInt(stats.total_trades)}</div>
                </div>
                <div style={{ gridColumn: "span 4" }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Win rate</div>
                  <div style={{ fontSize: 20, fontWeight: 740 }}>{fmt((stats.win_rate || 0) * 100, 1)}%</div>
                </div>
                <div style={{ gridColumn: "span 4" }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Total PnL</div>
                  <div style={{ fontSize: 20, fontWeight: 740 }}>${fmt(stats.total_pnl_usd, 2)}</div>
                </div>

                <div style={{ gridColumn: "span 4" }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Wins</div>
                  <div style={{ fontSize: 16, marginTop: 4 }}>{fmtInt(stats.wins)}</div>
                </div>
                <div style={{ gridColumn: "span 4" }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Losses</div>
                  <div style={{ fontSize: 16, marginTop: 4 }}>{fmtInt(stats.losses)}</div>
                </div>
                <div style={{ gridColumn: "span 4" }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Avg PnL</div>
                  <div style={{ fontSize: 16, marginTop: 4 }}>${fmt(stats.avg_pnl, 2)}</div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(0,0,0,0.18)",
                  fontSize: 12,
                  opacity: 0.85,
                }}
              >
                Control:{" "}
                <b>{stats.paused ? `PAUSED (${stats.pause_reason || "no reason"})` : "RUNNING"}</b>{" "}
                • Control updated: <b>{timeAgo(control.updated_time_utc)}</b>
              </div>

              <EquityChart points={equity} />
            </Card>
          </div>
        </div>

        {/* Trades */}
        <div style={{ gridColumn: "span 12" }}>
          <Card
            title="Recent Trades"
            right={<span style={{ fontSize: 12, opacity: 0.75 }}>{fmtInt(trades.length)} loaded</span>}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "left", opacity: 0.8 }}>
                    <th style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Time</th>
                    <th style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Market</th>
                    <th style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Side</th>
                    <th style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Size ($)</th>
                    <th style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Price</th>
                    <th style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>PnL ($)</th>
                    <th style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Reason</th>
                    <th style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Conf</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.slice(-25).reverse().map((t, idx) => {
                    const pnl = Number(t.pnl_usd);
                    const pnlColor =
                      Number.isNaN(pnl) ? "rgba(255,255,255,0.85)" : pnl >= 0 ? "rgba(46,213,115,0.95)" : "rgba(255,90,90,0.95)";
                    return (
                      <tr key={`${t.time_utc}-${idx}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <td style={{ padding: "10px 8px", opacity: 0.85 }}>{t.time_utc ? timeAgo(t.time_utc) : "—"}</td>
                        <td style={{ padding: "10px 8px" }}>{t.market || "—"}</td>
                        <td style={{ padding: "10px 8px" }}>{t.side || "—"}</td>
                        <td style={{ padding: "10px 8px" }}>{fmt(t.size_usd, 2)}</td>
                        <td style={{ padding: "10px 8px" }}>{fmt(t.price, 2)}</td>
                        <td style={{ padding: "10px 8px", color: pnlColor, fontWeight: 700 }}>{fmt(t.pnl_usd, 2)}</td>
                        <td style={{ padding: "10px 8px", opacity: 0.85 }}>{t.reason || "—"}</td>
                        <td style={{ padding: "10px 8px", opacity: 0.85 }}>{fmt(t.confidence, 2)}</td>
                      </tr>
                    );
                  })}
                  {!trades.length ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 12, opacity: 0.75 }}>
                        No trades yet. (The bot will start feeding this when it runs.)
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div style={{ gridColumn: "span 12", opacity: 0.65, fontSize: 12, padding: "4px 2px" }}>
          Next steps: add **candles** + TradingView-style chart, add **events feed**, add **pause/revive buttons**, add **market selector**.
        </div>
      </div>
    </main>
  );
}

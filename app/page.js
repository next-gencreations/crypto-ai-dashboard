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

function timeLeft(isoUtc) {
  if (!isoUtc) return "";
  const t = Date.parse(isoUtc);
  if (Number.isNaN(t)) return "";
  const ms = t - Date.now();
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}s`;
  return `${m}m ${r}s`;
}

function MiniLineChart({ points, height = 140 }) {
  const w = 520;
  const h = height;

  const series = (points || []).filter((p) => typeof p?.equity_usd === "number");
  if (series.length < 2) {
    return <div style={{ height: h, display: "grid", placeItems: "center", opacity: 0.7 }}>Not enough data yet</div>;
  }

  const ys = series.map((p) => p.equity_usd);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = (maxY - minY) * 0.08 || 1;

  const yMin = minY - pad;
  const yMax = maxY + pad;

  const toX = (i) => (i / (series.length - 1)) * (w - 20) + 10;
  const toY = (y) => {
    const t = (y - yMin) / (yMax - yMin);
    return h - 10 - t * (h - 20);
  };

  const d = series.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.equity_usd)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ borderRadius: 14, background: "rgba(255,255,255,0.03)" }}>
      <line x1="10" y1={h - 10} x2={w - 10} y2={h - 10} stroke="rgba(255,255,255,0.10)" />
      <line x1="10" y1={h / 2} x2={w - 10} y2={h / 2} stroke="rgba(255,255,255,0.06)" />
      <path d={d} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" />
    </svg>
  );
}

function CandleChart({ candles, height = 220 }) {
  const w = 520;
  const h = height;
  const data = (candles || []).slice(-80);

  if (!data.length) {
    return <div style={{ height: h, display: "grid", placeItems: "center", opacity: 0.7 }}>No candle data yet</div>;
  }

  const highs = data.map((c) => c.h);
  const lows = data.map((c) => c.l);
  const maxY = Math.max(...highs);
  const minY = Math.min(...lows);
  const pad = (maxY - minY) * 0.06 || 1;
  const yMax = maxY + pad;
  const yMin = minY - pad;

  const toY = (y) => {
    const t = (y - yMin) / (yMax - yMin);
    return h - 10 - t * (h - 20);
  };

  const bw = Math.max(4, Math.floor((w - 20) / data.length) - 1);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ borderRadius: 14, background: "rgba(255,255,255,0.03)" }}>
      <line x1="10" y1={h - 10} x2={w - 10} y2={h - 10} stroke="rgba(255,255,255,0.10)" />
      {data.map((c, i) => {
        const x = 10 + i * (bw + 1);
        const yO = toY(c.o);
        const yC = toY(c.c);
        const yH = toY(c.h);
        const yL = toY(c.l);

        const up = c.c >= c.o;
        const bodyTop = Math.min(yO, yC);
        const bodyBot = Math.max(yO, yC);
        const bodyH = Math.max(2, bodyBot - bodyTop);

        return (
          <g key={c.t}>
            {/* wick */}
            <line x1={x + bw / 2} y1={yH} x2={x + bw / 2} y2={yL} stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
            {/* body */}
            <rect
              x={x}
              y={bodyTop}
              width={bw}
              height={bodyH}
              rx="1.5"
              fill={up ? "rgba(120,255,190,0.35)" : "rgba(255,120,120,0.35)"}
              stroke={up ? "rgba(120,255,190,0.9)" : "rgba(255,120,120,0.9)"}
              strokeWidth="1"
            />
          </g>
        );
      })}
    </svg>
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
  const control = payload?.control || {};
  const equity = payload?.equity || [];
  const trades = payload?.trades || [];
  const stateMode = payload?.state || "—";

  const marketForCandles = "BTCUSDT";
  const [ohlc, setOhlc] = useState([]);

  async function fetchJson(url, signal) {
    const res = await fetch(url, { cache: "no-store", signal });
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    return res.json();
  }

  async function fetchData(signal) {
    if (!dataUrl) {
      setErr("Missing NEXT_PUBLIC_API_URL in Vercel environment variables.");
      setLoading(false);
      return;
    }
    try {
      setErr("");
      const json = await fetchJson(dataUrl, signal);
      setPayload(json);
      setLastFetchAt(new Date());

      // fetch candles from your own API aggregation
      const o = await fetchJson(`${apiBase}/ohlc?market=${marketForCandles}&interval=60&limit=200`, signal);
      setOhlc(o?.candles || []);
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

  const pricesOk = heartbeat?.prices_ok === 1 || heartbeat?.prices_ok === true;

  const card = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  };

  const btn = {
    padding: "9px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.92)",
    cursor: "pointer",
  };

  const small = { fontSize: 12, opacity: 0.75 };

  const petFace = useMemo(() => {
    const sex = String(pet?.sex || "boy").toLowerCase();
    const cryo = String(stateMode).toUpperCase() === "CRYO";
    if (cryo) return sex === "girl" ? "👧🏻" : "👦🏻";
    return sex === "girl" ? "🧝‍♀️" : "🧝‍♂️";
  }, [pet?.sex, stateMode]);

  const cryoActive = String(stateMode).toUpperCase() === "CRYO";
  const pausedActive = String(stateMode).toUpperCase() === "PAUSED";

  const countdown = cryoActive
    ? timeLeft(control?.cryo_until_utc)
    : pausedActive
      ? timeLeft(control?.pause_until_utc)
      : "";

  return (
    <div style={{
      minHeight: "100vh",
      padding: 16,
      background:
        "radial-gradient(1200px 900px at 20% 10%, rgba(120,90,255,0.25), transparent 55%), radial-gradient(900px 800px at 70% 40%, rgba(0,200,255,0.15), transparent 55%), #070A12",
      color: "rgba(255,255,255,0.92)",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ minWidth: 260 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>🚀 Crypto AI Dashboard</div>
            <div style={small} className="wrap">
              API: <span style={{ opacity: 0.95 }}>{apiBase || "—"}</span> · Refresh: {REFRESH_MS / 1000}s · Last update:{" "}
              {lastFetchAt ? lastFetchAt.toLocaleTimeString() : "—"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={btn} onClick={() => fetchData(new AbortController().signal)}>Refresh</button>

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
                  await postJson("/control/cryo", { seconds: 600, reason: "Manual cryo from dashboard" });
                  await fetchData(new AbortController().signal);
                } catch (e) {
                  setErr(String(e?.message || e));
                }
              }}
            >
              Cryo 10m
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
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12, opacity: 0.95 }} className="wrap">
              {err}
            </div>
          </div>
        )}

        {/* Grid */}
        <div style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(12, 1fr)",
          alignItems: "stretch",
        }}>
          {/* Heartbeat */}
          <div style={{ ...card, gridColumn: "span 12" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 900, fontSize: 14 }}>Status</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span className="badge">{cryoActive ? "🧊 CRYO" : pausedActive ? "⏸ PAUSED" : "✅ ACTIVE"}</span>
                <span className="badge">{pricesOk ? "Prices OK" : "Prices NOT OK"}</span>
                {countdown && <span className="badge">Thaw in: {countdown}</span>}
              </div>
            </div>

            <div className="grid5" style={{ marginTop: 12 }}>
              <div>
                <div className="small">Equity</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{fmtMoney(heartbeat?.equity_usd)}</div>
              </div>
              <div>
                <div className="small">Markets</div>
                <div style={{ fontWeight: 700 }} className="wrap">
                  {(Array.isArray(heartbeat?.markets) ? heartbeat.markets.join(", ") : "—") || "—"}
                </div>
              </div>
              <div>
                <div className="small">Open positions</div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{heartbeat?.open_positions ?? "—"}</div>
              </div>
              <div>
                <div className="small">Survival</div>
                <div style={{ fontWeight: 900 }}>{heartbeat?.survival_mode || "—"}</div>
              </div>
              <div>
                <div className="small">Last heartbeat</div>
                <div style={{ fontWeight: 700 }} className="wrap">{heartbeat?.time_utc || "—"}</div>
              </div>
            </div>
          </div>

          {/* Pet */}
          <div style={{ ...card, gridColumn: "span 5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 14 }}>Pet AI</div>
              <div style={{ fontSize: 40 }}>{petFace}</div>
            </div>

            {/* Cryo tube visual */}
            <div style={{
              marginTop: 10,
              borderRadius: 16,
              padding: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: cryoActive
                ? "linear-gradient(180deg, rgba(80,200,255,0.15), rgba(255,255,255,0.03))"
                : "rgba(255,255,255,0.03)",
              position: "relative",
              overflow: "hidden"
            }}>
              {cryoActive && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(600px 200px at 50% 30%, rgba(150,240,255,0.20), transparent 60%)",
                  opacity: 0.9
                }} />
              )}
              <div style={{ position: "relative" }}>
                <div style={{ fontWeight: 800 }}>{cryoActive ? "🧊 In Cryo Tube" : "🫀 Alive & Hunting"}</div>
                <div className="small wrap" style={{ marginTop: 4 }}>
                  {cryoActive ? (control?.cryo_reason || "safety") : (pet?.mood || "focused")}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 10 }}>
              <div><div className="small">Stage</div><div style={{ fontWeight: 800 }}>{pet?.stage || "—"}</div></div>
              <div><div className="small">Mood</div><div style={{ fontWeight: 800 }}>{pet?.mood || "—"}</div></div>
              <div><div className="small">Health</div><div style={{ fontWeight: 800 }}>{fmtNum(pet?.health, 1)}</div></div>
              <div><div className="small">Hunger</div><div style={{ fontWeight: 800 }}>{fmtNum(pet?.hunger, 1)}</div></div>
              <div><div className="small">Growth</div><div style={{ fontWeight: 800 }}>{fmtNum(pet?.growth, 1)}</div></div>
              <div><div className="small">Updated</div><div className="small wrap">{pet?.time_utc || "—"}</div></div>
            </div>
          </div>

          {/* Stats + Equity + Candles */}
          <div style={{ ...card, gridColumn: "span 7" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 14 }}>Charts</div>
              <div className="small wrap">Candles: {marketForCandles} (from /prices → /ohlc)</div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="small" style={{ marginBottom: 6 }}>Equity</div>
              <MiniLineChart points={equity} />
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="small" style={{ marginBottom: 6 }}>Candles (1m)</div>
              <CandleChart candles={ohlc} />
            </div>
          </div>

          {/* Trades */}
          <div style={{ ...card, gridColumn: "span 12" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 14 }}>Recent Trades</div>
              <div className="small">{trades?.length ? `${trades.length} loaded` : "No trades yet"}</div>
            </div>

            <div style={{ marginTop: 10, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr style={{ textAlign: "left", fontSize: 12, opacity: 0.7 }}>
                    <th style={{ padding: "10px 8px" }}>Time</th>
                    <th style={{ padding: "10px 8px" }}>Market</th>
                    <th style={{ padding: "10px 8px" }}>Side</th>
                    <th style={{ padding: "10px 8px" }}>Size</th>
                    <th style={{ padding: "10px 8px" }}>Price</th>
                    <th style={{ padding: "10px 8px" }}>PnL</th>
                    <th style={{ padding: "10px 8px" }}>Conf</th>
                    <th style={{ padding: "10px 8px" }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(trades || []).slice(-15).reverse().map((t, idx) => (
                    <tr key={idx} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                      <td style={{ padding: "10px 8px", fontSize: 12, opacity: 0.85 }} className="wrap">{t.time_utc || "—"}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 800 }}>{t.market || "—"}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 900 }}>{t.side || "—"}</td>
                      <td style={{ padding: "10px 8px" }}>{fmtMoney(t.size_usd)}</td>
                      <td style={{ padding: "10px 8px" }}>{fmtNum(t.price, 2)}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 900 }}>{fmtMoney(t.pnl_usd)}</td>
                      <td style={{ padding: "10px 8px" }}>{fmtNum(t.confidence, 2)}</td>
                      <td style={{ padding: "10px 8px", fontSize: 12, opacity: 0.85 }} className="wrap">{t.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {loading && !payload && (
          <div className="small" style={{ marginTop: 12, opacity: 0.9 }}>
            Loading dashboard data…
          </div>
        )}
      </div>
    </div>
  );
}

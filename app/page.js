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

function safeStr(v) {
  if (v === null || v === undefined) return "—";
  const s = String(v);
  return s.length ? s : "—";
}

function MiniLineChart({ points, height = 140 }) {
  const w = 520;
  const h = height;

  const series = (points || []).filter((p) => typeof p?.equity_usd === "number");
  if (series.length < 2) {
    return (
      <div style={{ height: h, display: "grid", placeItems: "center", opacity: 0.7 }}>
        Not enough data yet
      </div>
    );
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
    return (h - 20) - t * (h - 20) + 10;
  };

  const d = series
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.equity_usd)}`)
    .join(" ");

  const latest = series[series.length - 1]?.equity_usd;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.8, fontSize: 12, marginBottom: 6, gap: 10, flexWrap: "wrap" }}>
        <span>Equity (last {series.length} pts)</span>
        <span>Latest: {fmtMoney(latest)}</span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={h}
        style={{ borderRadius: 14, background: "rgba(255,255,255,0.03)", overflow: "hidden" }}
      >
        <line x1="10" y1={h - 10} x2={w - 10} y2={h - 10} stroke="rgba(255,255,255,0.10)" />
        <line x1="10" y1={h / 2} x2={w - 10} y2={h / 2} stroke="rgba(255,255,255,0.06)" />
        <path d={d} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.6, fontSize: 12, marginTop: 6, gap: 10, flexWrap: "wrap" }}>
        <span>Min: {fmtMoney(minY)}</span>
        <span>Max: {fmtMoney(maxY)}</span>
      </div>
    </div>
  );
}

function TradingViewCandles({ symbol = "BINANCE:BTCUSDT", interval = "5" }) {
  // iframe embed = simplest + reliable, no scripts required
  const src = useMemo(() => {
    const params = new URLSearchParams({
      symbol,
      interval,
      theme: "dark",
      style: "1",
      locale: "en",
      toolbarbg: "#0b1220",
      hide_top_toolbar: "0",
      hide_legend: "0",
      allow_symbol_change: "1",
      save_image: "0",
      withdateranges: "1",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [symbol, interval]);

  return (
    <div style={{ width: "100%", height: 420, borderRadius: 18, overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)" }}>
      <iframe
        title="Candlestick chart"
        src={src}
        style={{ width: "100%", height: "100%", border: 0 }}
        loading="lazy"
        allowFullScreen
      />
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
  const equity = payload?.equity || [];
  const trades = payload?.trades || [];
  const control = payload?.control || {};
  const prices = payload?.prices || [];
  const deaths = payload?.deaths || []; // optional if you later add it to /data

  const pricesOk = heartbeat?.prices_ok === 1 || heartbeat?.prices_ok === true;

  const derivedStats = useMemo(() => {
    const t = Array.isArray(trades) ? trades : [];
    const total_trades = t.length;

    let wins = 0;
    let pnl = 0;
    for (const x of t) {
      const p = Number(x?.pnl_usd || 0);
      pnl += p;
      if (p > 0) wins += 1;
    }
    const win_rate = total_trades > 0 ? wins / total_trades : null;

    // deaths count: if /data doesn’t include deaths yet, show —
    const total_deaths = Array.isArray(deaths) ? deaths.length : null;

    return {
      total_trades,
      win_rate,
      total_pnl_usd: pnl,
      total_deaths,
    };
  }, [trades, deaths]);

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

  // Pause detection: your /data control has pause_until_utc; dashboard “paused” should be derived
  const paused = useMemo(() => {
    const until = control?.pause_until_utc;
    if (!until) return false;
    const t = Date.parse(until);
    if (Number.isNaN(t)) return false;
    return t > Date.now();
  }, [control?.pause_until_utc]);

  const pageStyle = {
    minHeight: "100vh",
    padding: 18,
    background:
      "radial-gradient(1200px 900px at 20% 10%, rgba(120,90,255,0.25), transparent 55%), radial-gradient(900px 800px at 70% 40%, rgba(0,200,255,0.15), transparent 55%), #070A12",
    color: "rgba(255,255,255,0.92)",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
  };

  const card = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    overflow: "hidden", // key for mobile overflow
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
    maxWidth: "100%",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
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

  // Pick a chart symbol from your heartbeat markets if possible
  const chartSymbol = useMemo(() => {
    // If your heartbeat markets includes BTCUSDT, we’ll chart it
    const m = heartbeat?.markets;
    let markets = [];
    try {
      if (Array.isArray(m)) markets = m;
      else if (typeof m === "string") markets = JSON.parse(m);
    } catch {}
    const hasBTC = (markets || []).some((x) => String(x).toUpperCase().includes("BTC"));
    return hasBTC ? "BINANCE:BTCUSDT" : "BINANCE:BTCUSDT";
  }, [heartbeat?.markets]);

  // Heartbeat markets string (safe)
  const marketsText = useMemo(() => {
    try {
      const m = heartbeat?.markets;
      if (Array.isArray(m)) return m.join(", ") || "—";
      if (typeof m === "string") {
        const parsed = JSON.parse(m);
        return Array.isArray(parsed) ? parsed.join(", ") || "—" : safeStr(m);
      }
      return "—";
    } catch {
      return safeStr(heartbeat?.markets);
    }
  }, [heartbeat?.markets]);

  // Prices snapshot from /data prices[] (list of rows)
  const pricesSnapshot = useMemo(() => {
    if (!Array.isArray(prices) || prices.length === 0) return "—";
    const latestFew = prices.slice(0, 8).map((p) => ({
      market: p.market,
      price: p.price,
      time_utc: p.time_utc,
    }));
    const s = JSON.stringify(latestFew);
    return s.length > 160 ? s.slice(0, 160) + "…" : s;
  }, [prices]);

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ minWidth: 260 }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.2 }}>🚀 Crypto AI Dashboard</div>
            <div style={small}>
              API: <span style={{ opacity: 0.95 }}>{apiBase || "—"}</span> · Refresh: {REFRESH_MS / 1000}s · Last update:{" "}
              {lastFetchAt ? lastFetchAt.toLocaleTimeString() : "—"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={btn} onClick={() => fetchData(new AbortController().signal)}>
              Refresh
            </button>
            <a style={{ ...btn, textDecoration: "none", display: "inline-flex", alignItems: "center" }} href={dataUrl} target="_blank" rel="noreferrer">
              Open /data
            </a>
            <button
              style={btn}
              onClick={async () => {
                try {
                  // ✅ your API expects minutes
                  await postJson("/control/pause", { minutes: 10 });
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
                  await postJson("/control/revive", {});
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
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12, opacity: 0.95 }}>{err}</div>
            <div style={{ marginTop: 8, ...small }}>
              If this says “Missing NEXT_PUBLIC_API_URL”, add it in Vercel and redeploy. If it says “API responded 404/500”, the API endpoint is wrong or down.
            </div>
          </div>
        )}

        {/* Main grid */}
        <div style={grid}>
          {/* Heartbeat */}
          <div style={{ ...card, gridColumn: "span 12" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Heartbeat</div>

              {/* ✅ wrap + no overflow */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: "100%" }}>
                <span style={pill(paused ? "rgba(255,200,80,0.15)" : "rgba(80,255,170,0.12)")}>{paused ? "⏸ Paused" : "✅ Running"}</span>
                <span style={pill(pricesOk ? "rgba(80,255,170,0.12)" : "rgba(255,80,80,0.12)")}>{pricesOk ? "Prices OK" : "Prices NOT OK"}</span>
                <span style={pill("rgba(255,255,255,0.08)")}>Survival: {safeStr(heartbeat?.survival_mode)}</span>
              </div>
            </div>

            {/* ✅ responsive grid: 1 col on tiny, 2 cols on mobile, 5 on wide */}
            <div
              style={{
                display: "grid",
                gap: 12,
                marginTop: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              }}
            >
              <div>
                <div style={small}>Equity</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{fmtMoney(heartbeat?.equity_usd)}</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={small}>Markets</div>
                <div
                  style={{
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                  title={marketsText}
                >
                  {marketsText}
                </div>
              </div>
              <div>
                <div style={small}>Open positions</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{heartbeat?.open_positions ?? "—"}</div>
              </div>
              <div>
                <div style={small}>Bot status</div>
                <div style={{ fontWeight: 800 }}>{safeStr(heartbeat?.status)}</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={small}>Last heartbeat</div>
                <div style={{ fontWeight: 700, fontSize: 12, opacity: 0.9, wordBreak: "break-word" }}>{safeStr(heartbeat?.time_utc)}</div>
              </div>
            </div>
          </div>

          {/* Pet */}
          <div style={{ ...card, gridColumn: "span 12" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Pet</div>
              <div style={{ fontSize: 42 }}>{petEmoji}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginTop: 10 }}>
              <div>
                <div style={small}>Stage</div>
                <div style={{ fontWeight: 800 }}>{safeStr(pet?.stage)}</div>
              </div>
              <div>
                <div style={small}>Mood</div>
                <div style={{ fontWeight: 800 }}>{safeStr(pet?.mood)}</div>
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
              <div style={{ minWidth: 0 }}>
                <div style={small}>Fainted until</div>
                <div style={{ fontWeight: 700, fontSize: 12, opacity: 0.85, wordBreak: "break-word" }}>{safeStr(pet?.fainted_until_utc)}</div>
              </div>
            </div>

            <div style={{ marginTop: 10, ...small }}>
              Pet time: <span style={{ opacity: 0.95 }}>{safeStr(pet?.time_utc)}</span>
            </div>
          </div>

          {/* Candles */}
          <div style={{ ...card, gridColumn: "span 12" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Candlestick Chart</div>
              <div style={small}>Symbol: <span style={{ opacity: 0.95 }}>{chartSymbol}</span></div>
            </div>
            <TradingViewCandles symbol={chartSymbol} interval="5" />
          </div>

          {/* Stats + equity mini chart */}
          <div style={{ ...card, gridColumn: "span 12" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Trading Stats</div>
              <div style={small}>
                Control updated: <span style={{ opacity: 0.95 }}>{safeStr(control?.updated_time_utc)}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 12 }}>
              <div>
                <div style={small}>Total trades</div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{derivedStats.total_trades ?? "—"}</div>
              </div>
              <div>
                <div style={small}>Win rate</div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{derivedStats.win_rate === null ? "—" : fmtPct(derivedStats.win_rate)}</div>
              </div>
              <div>
                <div style={small}>Total PnL</div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{fmtMoney(derivedStats.total_pnl_usd)}</div>
              </div>
              <div>
                <div style={small}>Deaths</div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{derivedStats.total_deaths ?? "—"}</div>
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
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 820 }}>
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
                  {(trades || []).slice(-50).reverse().map((t, idx) => (
                    <tr key={idx} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                      <td style={{ padding: "10px 8px", fontSize: 12, opacity: 0.85, whiteSpace: "nowrap" }}>{safeStr(t.time_utc)}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 700 }}>{safeStr(t.market)}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 800 }}>{safeStr(t.side)}</td>
                      <td style={{ padding: "10px 8px" }}>{fmtMoney(t.size_usd)}</td>
                      <td style={{ padding: "10px 8px" }}>{fmtNum(t.price, 2)}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 900 }}>{fmtMoney(t.pnl_usd)}</td>
                      <td style={{ padding: "10px 8px" }}>{fmtNum(t.confidence, 2)}</td>
                      <td style={{ padding: "10px 8px", fontSize: 12, opacity: 0.85 }}>{safeStr(t.reason)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 10, ...small }}>
              Prices snapshot: <span style={{ opacity: 0.95 }}>{pricesSnapshot}</span>
            </div>
          </div>
        </div>

        {loading && !payload && <div style={{ ...small, marginTop: 12, opacity: 0.9 }}>Loading dashboard data…</div>}
      </div>
    </div>
  );
}

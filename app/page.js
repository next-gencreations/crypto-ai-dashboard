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
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ borderRadius: 14, background: "rgba(255,255,255,0.03)" }}>
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

function CandleChart({ candles, height = 280 }) {
  const w = 520;
  const h = height;

  const cs = (candles || []).filter(
    (c) => typeof c?.open === "number" && typeof c?.high === "number" && typeof c?.low === "number" && typeof c?.close === "number"
  );

  if (cs.length < 5) {
    return (
      <div style={{ height: h, display: "grid", placeItems: "center", opacity: 0.7 }}>
        Not enough candle data yet
      </div>
    );
  }

  const highs = cs.map((c) => c.high);
  const lows = cs.map((c) => c.low);
  const minY = Math.min(...lows);
  const maxY = Math.max(...highs);
  const pad = (maxY - minY) * 0.06 || 1;

  const yMin = minY - pad;
  const yMax = maxY + pad;

  const toY = (y) => {
    const t = (y - yMin) / (yMax - yMin);
    return (h - 20) - t * (h - 20) + 10;
  };

  const n = cs.length;
  const left = 10;
  const right = 10;
  const innerW = w - left - right;
  const step = innerW / n;
  const bodyW = Math.max(3, Math.min(10, step * 0.6));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ borderRadius: 14, background: "rgba(255,255,255,0.03)" }}>
      <line x1="10" y1={h - 10} x2={w - 10} y2={h - 10} stroke="rgba(255,255,255,0.10)" />
      <line x1="10" y1={h / 2} x2={w - 10} y2={h / 2} stroke="rgba(255,255,255,0.06)" />

      {cs.map((c, i) => {
        const x = left + i * step + step / 2;
        const o = toY(c.open);
        const cl = toY(c.close);
        const hi = toY(c.high);
        const lo = toY(c.low);

        const up = c.close >= c.open;
        const stroke = up ? "rgba(80,255,170,0.95)" : "rgba(255,80,80,0.95)";
        const fill = up ? "rgba(80,255,170,0.35)" : "rgba(255,80,80,0.35)";

        const top = Math.min(o, cl);
        const bottom = Math.max(o, cl);
        const bodyH = Math.max(2, bottom - top);

        return (
          <g key={i}>
            <line x1={x} y1={hi} x2={x} y2={lo} stroke={stroke} strokeWidth="2" />
            <rect x={x - bodyW / 2} y={top} width={bodyW} height={bodyH} fill={fill} stroke={stroke} strokeWidth="1.5" rx="2" />
          </g>
        );
      })}
    </svg>
  );
}

export default function Page() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";
  const dataUrl = apiBase ? `${apiBase}/data` : "";

  const market = "BTCUSDT";
  const [tf, setTf] = useState("5m");
  const ohlcUrl = apiBase
    ? `${apiBase}/ohlc?market=${encodeURIComponent(market)}&tf=${encodeURIComponent(tf)}&limit=120`
    : "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [payload, setPayload] = useState(null);
  const [lastFetchAt, setLastFetchAt] = useState(null);
  const [candles, setCandles] = useState([]);

  const heartbeat = payload?.heartbeat || {};
  const pet = payload?.pet || {};
  const stats = payload?.stats || {};
  const equity = payload?.equity || [];
  const trades = payload?.trades || [];
  const control = payload?.control || {};
  const prices = payload?.prices || {};

  const pricesOk = heartbeat?.prices_ok === 1 || heartbeat?.prices_ok === true;
  const paused = !!stats?.paused;

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

      if (ohlcUrl) {
        try {
          const r2 = await fetch(ohlcUrl, { cache: "no-store", signal });
          if (r2.ok) {
            const j2 = await r2.json();
            setCandles(j2?.candles || []);
          }
        } catch {}
      }
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
  }, [dataUrl, ohlcUrl]);

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

  // TradingView widget
  const tvSymbol = "BINANCE:BTCUSDT";
  const tvInterval = tf === "1m" ? "1" : tf === "5m" ? "5" : tf === "15m" ? "15" : tf === "30m" ? "30" : tf === "1h" ? "60" : "240";
  const tvSrc =
    "https://s.tradingview.com/widgetembed/?" +
    new URLSearchParams({
      symbol: tvSymbol,
      interval: tvInterval,
      hidetoptoolbar: "0",
      hidelegend: "1",
      saveimage: "0",
      toolbarbg: "rgba(0,0,0,0)",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: "0",
      allow_symbol_change: "0",
    }).toString();

  // ---------- Styles ----------
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
    overflow: "hidden", // ✅ prevents “bleed”
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
  });

  const btn = {
    padding: "9px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.92)",
    cursor: "pointer",
  };

  const small = { fontSize: 12, opacity: 0.75 };

  // ✅ Responsive layout: 1 column on mobile, 12-col grid on bigger screens
  const grid = {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "1fr", // mobile default
    alignItems: "stretch",
  };

  // ✅ This makes 2 cards become 1 column on mobile, 2 columns on wide screens
  const twoColWrap = {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "1fr", // mobile
  };

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
          <div style={{ minWidth: 220 }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.2 }}>🚀 Crypto AI Dashboard</div>
            <div style={small}>
              API: <span style={{ opacity: 0.95, wordBreak: "break-word" }}>{apiBase || "—"}</span> · Refresh: {REFRESH_MS / 1000}s · Last update:{" "}
              {lastFetchAt ? lastFetchAt.toLocaleTimeString() : "—"}
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
          </div>
        )}

        <div style={grid}>
          {/* Heartbeat */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Heartbeat</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span style={pill(paused ? "rgba(255,200,80,0.15)" : "rgba(80,255,170,0.12)")}>{paused ? "⏸ Paused" : "✅ Running"}</span>
                <span style={pill(pricesOk ? "rgba(80,255,170,0.12)" : "rgba(255,80,80,0.12)")}>{pricesOk ? "Prices OK" : "Prices NOT OK"}</span>
                <span style={pill("rgba(255,255,255,0.08)")}>Survival: {heartbeat?.survival_mode || "—"}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginTop: 12 }}>
              <div><div style={small}>Equity</div><div style={{ fontSize: 20, fontWeight: 900 }}>{fmtMoney(heartbeat?.equity_usd)}</div></div>
              <div><div style={small}>Markets</div><div style={{ fontWeight: 700, wordBreak: "break-word" }}>{Array.isArray(heartbeat?.markets) ? heartbeat.markets.join(", ") : (heartbeat?.markets || "—")}</div></div>
              <div><div style={small}>Open positions</div><div style={{ fontWeight: 800, fontSize: 18 }}>{heartbeat?.open_positions ?? "—"}</div></div>
              <div><div style={small}>Bot status</div><div style={{ fontWeight: 800 }}>{heartbeat?.status || "—"}</div></div>
              <div><div style={small}>Last heartbeat</div><div style={{ fontWeight: 700, fontSize: 12, opacity: 0.9, wordBreak: "break-word" }}>{heartbeat?.time_utc || "—"}</div></div>
            </div>
          </div>

          {/* Pet + Candles (responsive wrapper) */}
          <div
            style={twoColWrap}
          >
            {/* Pet */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>Pet</div>
                <div style={{ fontSize: 42 }}>{petEmoji}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 10 }}>
                <div><div style={small}>Stage</div><div style={{ fontWeight: 800 }}>{pet?.stage || "—"}</div></div>
                <div><div style={small}>Mood</div><div style={{ fontWeight: 800 }}>{pet?.mood || "—"}</div></div>
                <div><div style={small}>Health</div><div style={{ fontWeight: 800 }}>{fmtNum(pet?.health, 1)}</div></div>
                <div><div style={small}>Hunger</div><div style={{ fontWeight: 800 }}>{fmtNum(pet?.hunger, 1)}</div></div>
                <div><div style={small}>Growth</div><div style={{ fontWeight: 800 }}>{fmtNum(pet?.growth, 1)}</div></div>
                <div><div style={small}>Fainted until</div><div style={{ fontWeight: 700, fontSize: 12, opacity: 0.85, wordBreak: "break-word" }}>{pet?.fainted_until_utc || "—"}</div></div>
              </div>

              <div style={{ marginTop: 10, ...small }}>
                Pet time: <span style={{ opacity: 0.95, wordBreak: "break-word" }}>{pet?.time_utc || "—"}</span>
              </div>
            </div>

            {/* Candlestick */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>Candlestick Chart</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={small}>Symbol: {market}</span>
                  <select
                    value={tf}
                    onChange={(e) => setTf(e.target.value)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.92)",
                      maxWidth: "100%",
                    }}
                  >
                    <option value="1m">1m</option>
                    <option value="5m">5m</option>
                    <option value="15m">15m</option>
                    <option value="30m">30m</option>
                    <option value="1h">1h</option>
                    <option value="4h">4h</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ ...small, marginBottom: 8, opacity: 0.85 }}>TradingView (external)</div>
                <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)" }}>
                  <iframe title="TradingView" src={tvSrc} style={{ width: "100%", height: 340, border: 0 }} loading="lazy" />
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ ...small, marginBottom: 8, opacity: 0.85 }}>Bot candles (from your /prices ticks)</div>
                <CandleChart candles={candles} height={240} />
                <div style={{ marginTop: 8, ...small, opacity: 0.75 }}>
                  Candles are built from your bot’s own /prices ticks.
                </div>
              </div>
            </div>
          </div>

          {/* Trading Stats */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Trading Stats</div>
              <div style={small}>
                Control updated: <span style={{ opacity: 0.95, wordBreak: "break-word" }}>{control?.updated_time_utc || "—"}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginTop: 12 }}>
              <div><div style={small}>Total trades</div><div style={{ fontWeight: 900, fontSize: 18 }}>{stats?.total_trades ?? "—"}</div></div>
              <div><div style={small}>Win rate</div><div style={{ fontWeight: 900, fontSize: 18 }}>{fmtPct(stats?.win_rate)}</div></div>
              <div><div style={small}>Total PnL</div><div style={{ fontWeight: 900, fontSize: 18 }}>{fmtMoney(stats?.total_pnl_usd)}</div></div>
              <div><div style={small}>Deaths</div><div style={{ fontWeight: 900, fontSize: 18 }}>{stats?.total_deaths ?? "—"}</div></div>
            </div>

            <div style={{ marginTop: 12 }}>
              <MiniLineChart points={equity} />
            </div>
          </div>

          {/* Trades */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Recent Trades</div>
              <div style={small}>{trades?.length ? `${trades.length} loaded` : "No trades yet"}</div>
            </div>

            <div style={{ marginTop: 10, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 720 }}>
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
                      <td style={{ padding: "10px 8px", fontSize: 12, opacity: 0.85, whiteSpace: "nowrap" }}>{t.time_utc || "—"}</td>
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
              Prices snapshot: <span style={{ opacity: 0.95 }}>{Array.isArray(prices) && prices.length ? JSON.stringify(prices.slice(0, 3)) + "…" : "—"}</span>
            </div>
          </div>
        </div>

        {loading && !payload && <div style={{ ...small, marginTop: 12, opacity: 0.9 }}>Loading dashboard data…</div>}

        {/* ✅ Responsive media query (inline) */}
        <style jsx global>{`
          @media (min-width: 900px) {
            /* restore desktop 12-col feel by making the wrapper 2 columns */
            .__twoColWide {
              grid-template-columns: 5fr 7fr !important;
            }
          }
        `}</style>

        {/* Apply the class by JS (simple + reliable) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                const els=document.querySelectorAll('[data-two-col]');
                els.forEach(el=>el.classList.add('__twoColWide'));
              })();
            `,
          }}
        />
      </div>
    </div>
  );
}

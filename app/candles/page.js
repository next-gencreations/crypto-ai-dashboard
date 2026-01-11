"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const REFRESH_MS = 5000;
const FETCH_TIMEOUT_MS = 20000;

function normalizeCandles(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((c) => {
      const t = c?.t ?? c?.time_epoch ?? c?.time_utc ?? c?.time ?? "";
      const o = c?.o ?? c?.open;
      const h = c?.h ?? c?.high;
      const l = c?.l ?? c?.low;
      const cl = c?.c ?? c?.close;

      const on = Number(o);
      const hn = Number(h);
      const ln = Number(l);
      const cn = Number(cl);

      if (t === "" || [on, hn, ln, cn].some((x) => !Number.isFinite(x))) return null;
      return { t, o: on, h: hn, l: ln, c: cn };
    })
    .filter(Boolean);
}

function fmt(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  // compact-ish formatting
  if (x >= 1000) return x.toFixed(1);
  if (x >= 100) return x.toFixed(2);
  return x.toFixed(3);
}

/**
 * Real candlestick SVG chart (mobile friendly)
 * - thicker candle bodies
 * - proper wicks
 * - grid + last price line
 * - auto reduces candle count on narrow screens so it doesn't become "dots"
 */
function CandleChart({ candles, height = 360 }) {
  const containerRef = useRef(null);
  const [w, setW] = useState(520);

  const h = height;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const cw = Math.floor(el.getBoundingClientRect().width || 520);
      setW(Math.max(320, Math.min(980, cw)));
    };

    measure();

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    } else {
      window.addEventListener("resize", measure);
    }

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", measure);
    };
  }, []);

  const all = Array.isArray(candles) ? candles : [];
  if (all.length < 2) {
    return (
      <div style={{ height: h, display: "grid", placeItems: "center", opacity: 0.8 }}>
        NO CANDLES YET
      </div>
    );
  }

  // ✅ Pick a candle count that still looks like a real chart on small screens
  // Target body width around 6–10px.
  const PAD_L = 52;
  const PAD_R = 16;
  const PAD_T = 14;
  const PAD_B = 26;

  const innerW = Math.max(1, w - PAD_L - PAD_R);

  // Start with up to 200, but reduce if too tight
  const hardMax = 200;
  const maxC = Math.min(hardMax, all.length);

  // If we show maxC candles, what's the step?
  // If step is tiny, it becomes dots.
  const stepIfMax = innerW / maxC;

  // Minimum step desired to make bodies visible
  const minStep = w < 430 ? 5.4 : 4.6; // mobile vs larger
  const targetCount = Math.max(40, Math.floor(innerW / minStep));
  const count = Math.min(maxC, targetCount);

  const data = all.slice(-count);

  // Y scale
  const highs = data.map((c) => c.h);
  const lows = data.map((c) => c.l);

  const maxY0 = Math.max(...highs);
  const minY0 = Math.min(...lows);

  const range = maxY0 - minY0 || 1;
  const pad = Math.max(range * 0.08, maxY0 * 0.0005, 0.5);

  const yMax = maxY0 + pad;
  const yMin = minY0 - pad;
  const denom = yMax - yMin || 1;

  const toY = (y) => {
    const t = (y - yMin) / denom;
    return PAD_T + (1 - t) * (h - PAD_T - PAD_B);
  };

  // Candle geometry
  const step = innerW / data.length;

  // ✅ Make the body width feel real:
  // Keep a min body width, let it grow, cap it.
  const bw = Math.max(5, Math.min(12, step * 0.72));
  const wickW = Math.max(1.2, Math.min(2.0, bw * 0.18));

  // Grid lines
  const gridLines = 4;
  const yTicks = Array.from({ length: gridLines + 1 }, (_, i) => i / gridLines);

  // Last price line
  const lastClose = data[data.length - 1]?.c;
  const yLast = toY(lastClose);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
        {/* Background faint frame */}
        <rect
          x="0"
          y="0"
          width={w}
          height={h}
          fill="rgba(0,0,0,0.0)"
          stroke="rgba(119,255,154,0.10)"
          strokeWidth="1"
          rx="12"
        />

        {/* Horizontal grid */}
        {yTicks.map((t, idx) => {
          const y = PAD_T + t * (h - PAD_T - PAD_B);
          const val = yMax - t * (yMax - yMin);
          return (
            <g key={`gy-${idx}`}>
              <line
                x1={PAD_L}
                y1={y}
                x2={w - PAD_R}
                y2={y}
                stroke={idx === yTicks.length - 1 ? "rgba(119,255,154,0.18)" : "rgba(119,255,154,0.09)"}
                strokeWidth={idx === yTicks.length - 1 ? 1.2 : 1}
              />
              {/* Y-axis labels */}
              <text
                x={PAD_L - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="rgba(119,255,154,0.65)"
                style={{ fontFamily: "ui-monospace, Menlo, Monaco, Consolas, monospace" }}
              >
                {fmt(val)}
              </text>
            </g>
          );
        })}

        {/* Last price line */}
        <line
          x1={PAD_L}
          y1={yLast}
          x2={w - PAD_R}
          y2={yLast}
          stroke="rgba(119,255,154,0.22)"
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />
        <text
          x={w - PAD_R}
          y={yLast - 6}
          textAnchor="end"
          fontSize="11"
          fill="rgba(119,255,154,0.75)"
          style={{ fontFamily: "ui-monospace, Menlo, Monaco, Consolas, monospace" }}
        >
          {fmt(lastClose)}
        </text>

        {/* Candles */}
        {data.map((c, i) => {
          const xCenter = PAD_L + i * step + step / 2;

          const yO = toY(c.o);
          const yC = toY(c.c);
          const yH = toY(c.h);
          const yL = toY(c.l);

          const up = c.c >= c.o;

          // Use your theme colors
          const stroke = up ? "var(--pip-up)" : "var(--pip-down)";
          const fill = up ? "var(--pip-up-fill)" : "var(--pip-down-fill)";

          const bodyTop = Math.min(yO, yC);
          const bodyBot = Math.max(yO, yC);

          // ✅ allow thin candles but not invisible
          const bodyH = Math.max(2.2, bodyBot - bodyTop);

          return (
            <g key={`${c.t}-${i}`}>
              {/* Wick */}
              <line
                x1={xCenter}
                y1={yH}
                x2={xCenter}
                y2={yL}
                stroke={stroke}
                strokeWidth={wickW}
                strokeLinecap="round"
                opacity="0.95"
              />

              {/* Body */}
              <rect
                x={xCenter - bw / 2}
                y={bodyTop}
                width={bw}
                height={bodyH}
                fill={fill}
                stroke={stroke}
                strokeWidth="1.4"
                rx="1.4"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function safeMarketsList(m) {
  try {
    if (Array.isArray(m)) return m;
    if (typeof m === "string") {
      const parsed = JSON.parse(m);
      if (Array.isArray(parsed)) return parsed;
      return m ? [m] : [];
    }
    return [];
  } catch {
    return typeof m === "string" ? [m] : [];
  }
}

async function fetchJson(url, signal) {
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    signal,
    headers: { accept: "application/json" },
  });

  const txt = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText}${txt ? ` — ${txt.slice(0, 180)}` : ""}`);
  }

  try {
    return txt ? JSON.parse(txt) : null;
  } catch {
    throw new Error(`API returned non-JSON: ${txt.slice(0, 180)}`);
  }
}

export default function CandlesPage() {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  const [err, setErr] = useState("");
  const [lastFetchAt, setLastFetchAt] = useState(null);

  const [markets, setMarkets] = useState(["BTCUSDT"]);
  const [market, setMarket] = useState("BTCUSDT");

  const [intervalSec, setIntervalSec] = useState(60);
  const [ohlc, setOhlc] = useState([]);

  const tfLabel =
    intervalSec === 60
      ? "1M"
      : intervalSec === 300
      ? "5M"
      : intervalSec === 900
      ? "15M"
      : intervalSec === 3600
      ? "1H"
      : `${Math.floor(intervalSec / 60)}M`;

  async function fetchAll(signal) {
    const dataUrl = `/api/proxy/data`;
    const ohlcUrl = `/api/proxy/ohlc?market=${encodeURIComponent(market)}&interval=${intervalSec}&limit=600`;

    try {
      setErr("");

      const data = await fetchJson(dataUrl, signal);
      const hbMarkets = safeMarketsList(data?.heartbeat?.markets);

      if (hbMarkets.length) {
        setMarkets(hbMarkets);
        if (!hbMarkets.includes(market)) setMarket(hbMarkets[0]);
      }

      const o = await fetchJson(ohlcUrl, signal);
      setOhlc(normalizeCandles(o?.candles || o || []));

      setLastFetchAt(new Date());
    } catch (e) {
      if (e?.name === "AbortError") return;
      setErr(String(e?.message || e));
    }
  }

  useEffect(() => {
    const ac = new AbortController();
    fetchAll(ac.signal);

    const t = setInterval(() => {
      const ac2 = new AbortController();
      fetchAll(ac2.signal);
      setTimeout(() => ac2.abort(), FETCH_TIMEOUT_MS);
    }, REFRESH_MS);

    return () => {
      ac.abort();
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, intervalSec]);

  const title = useMemo(() => `PRICE CANDLES (${market}) · ${tfLabel}`, [market, tfLabel]);

  return (
    <div className="pip-crt">
      <div className="pip-shell">
        <div className="pip-topbar">
          <div className="pip-topbar-left">
            <div className="pip-title">PIP-TRADE 3000</div>
            <div className="pip-sub wrap">
              Candles page · API: {apiBase || "—"} · Refresh: {REFRESH_MS / 1000}s · Last:{" "}
              {lastFetchAt ? lastFetchAt.toLocaleTimeString() : "—"}
            </div>
          </div>
        </div>

        <div className="pip-links">
          <Link className="pip-link" href="/">HOME</Link>
          <Link className="pip-link active" href="/candles">CANDLES</Link>
          <Link className="pip-link" href="/crypto">CRYPTO</Link>
        </div>

        {err && (
          <div className="pip-content">
            <div className="pip-panel">
              <div className="pip-heading">ERROR</div>
              <div className="wrap">{err}</div>
            </div>
          </div>
        )}

        <div className="pip-content">
          <div className="pip-panel">
            <div className="pip-heading">{title}</div>

            <div className="pip-row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div className="pip-k">Market</div>
                <select
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(120,255,170,0.25)",
                    background: "rgba(0,0,0,0.35)",
                    color: "rgba(180,255,210,0.95)",
                    outline: "none",
                  }}
                >
                  {markets.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className={`pip-link ${intervalSec === 60 ? "active" : ""}`} onClick={() => setIntervalSec(60)} type="button">1M</button>
                <button className={`pip-link ${intervalSec === 300 ? "active" : ""}`} onClick={() => setIntervalSec(300)} type="button">5M</button>
                <button className={`pip-link ${intervalSec === 900 ? "active" : ""}`} onClick={() => setIntervalSec(900)} type="button">15M</button>
                <button className={`pip-link ${intervalSec === 3600 ? "active" : ""}`} onClick={() => setIntervalSec(3600)} type="button">1H</button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <CandleChart candles={ohlc} />
            </div>

            <div className="pip-muted" style={{ marginTop: 10 }}>
              Shows a mobile-optimized window of recent candles (up to 200). Green = up, Red = down.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

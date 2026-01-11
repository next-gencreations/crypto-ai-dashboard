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

      // volume: try common keys
      const v =
        c?.v ??
        c?.vol ??
        c?.volume ??
        c?.quoteVolume ??
        c?.baseVolume ??
        c?.qv ??
        null;

      const on = Number(o);
      const hn = Number(h);
      const ln = Number(l);
      const cn = Number(cl);

      if (t === "" || [on, hn, ln, cn].some((x) => !Number.isFinite(x))) return null;

      const vn = Number(v);
      const vol = Number.isFinite(vn) ? vn : null;

      return { t, o: on, h: hn, l: ln, c: cn, v: vol };
    })
    .filter(Boolean);
}

function fmt(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  if (Math.abs(x) >= 10000) return x.toFixed(0);
  if (Math.abs(x) >= 1000) return x.toFixed(1);
  if (Math.abs(x) >= 100) return x.toFixed(2);
  return x.toFixed(3);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function ema(values, period) {
  const out = new Array(values.length).fill(null);
  if (!Array.isArray(values) || values.length === 0) return out;
  if (period <= 1) {
    for (let i = 0; i < values.length; i++) out[i] = values[i];
    return out;
  }

  const k = 2 / (period + 1);
  let prev = null;

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) continue;

    if (prev === null) {
      // seed with simple average once enough data
      if (i + 1 >= period) {
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) sum += values[j];
        prev = sum / period;
        out[i] = prev;
      } else {
        out[i] = null;
      }
      continue;
    }

    prev = v * k + prev * (1 - k);
    out[i] = prev;
  }

  return out;
}

function rsi(values, period = 14) {
  const out = new Array(values.length).fill(null);
  if (!Array.isArray(values) || values.length < period + 1) return out;

  let gains = 0;
  let losses = 0;

  // initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses += -diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  const rs0 = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  out[period] = 100 - 100 / (1 + rs0);

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    out[i] = 100 - 100 / (1 + rs);
  }

  return out;
}

/**
 * Candles + EMA + Volume + RSI (mobile friendly)
 */
function CandleChartPro({ candles, height = 520 }) {
  const containerRef = useRef(null);
  const [w, setW] = useState(520);

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
      <div style={{ height, display: "grid", placeItems: "center", opacity: 0.8 }}>
        NO CANDLES YET
      </div>
    );
  }

  // Layout: Price panel + Volume panel + RSI panel
  const H = height;
  const gap = 10;

  const hPrice = Math.floor(H * 0.62);
  const hVol = Math.floor(H * 0.18);
  const hRsi = H - hPrice - hVol - gap * 2;

  const PAD_L = 54;
  const PAD_R = 16;
  const PAD_T = 14;
  const PAD_B = 24;

  const innerW = Math.max(1, w - PAD_L - PAD_R);

  // Mobile-friendly candle count
  const hardMax = 200;
  const maxC = Math.min(hardMax, all.length);
  const minStep = w < 430 ? 5.4 : 4.6;
  const targetCount = Math.max(55, Math.floor(innerW / minStep));
  const count = Math.min(maxC, targetCount);
  const data = all.slice(-count);

  const closes = data.map((c) => c.c);
  const ema5 = ema(closes, 5);
  const ema10 = ema(closes, 10);
  const ema30 = ema(closes, 30);

  // Volume (use real volume if present, else estimate)
  const hasRealVol = data.some((c) => Number.isFinite(c.v));
  const vols = data.map((c, i) => {
    if (Number.isFinite(c.v)) return c.v;
    const range = Math.abs(c.h - c.l);
    const body = Math.abs(c.c - c.o);
    const est = (range * 0.65 + body * 0.85) * 1000;
    return est + (i % 7) * 12;
  });

  const rsi14 = rsi(closes, 14);

  // Price scale
  const highs = data.map((c) => c.h);
  const lows = data.map((c) => c.l);
  const maxY0 = Math.max(...highs);
  const minY0 = Math.min(...lows);
  const range = maxY0 - minY0 || 1;
  const pad = Math.max(range * 0.08, maxY0 * 0.0005, 0.5);

  const yMax = maxY0 + pad;
  const yMin = minY0 - pad;
  const denom = yMax - yMin || 1;

  const toYPrice = (y) => {
    const t = (y - yMin) / denom;
    return PAD_T + (1 - t) * (hPrice - PAD_T - PAD_B);
  };

  // Volume scale
  const vMax = Math.max(...vols);
  const toYVol = (v) => {
    const t = vMax > 0 ? v / vMax : 0;
    return PAD_T + (1 - t) * (hVol - PAD_T - 10);
  };

  // RSI scale (0..100)
  const toYRsi = (x) => {
    const t = clamp(Number(x) / 100, 0, 1);
    return PAD_T + (1 - t) * (hRsi - PAD_T - 10);
  };

  // Candle geometry
  const step = innerW / data.length;
  const bw = Math.max(5, Math.min(12, step * 0.72));
  const wickW = Math.max(1.2, Math.min(2.0, bw * 0.18));

  const lastClose = data[data.length - 1]?.c;
  const yLast = toYPrice(lastClose);

  // Helper to draw line paths
  const linePath = (arr, toY) => {
    let d = "";
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (!Number.isFinite(v)) continue;
      const x = PAD_L + i * step + step / 2;
      const y = toY(v);
      d += d ? ` L ${x} ${y}` : `M ${x} ${y}`;
    }
    return d;
  };

  const dEma5 = linePath(ema5, toYPrice);
  const dEma10 = linePath(ema10, toYPrice);
  const dEma30 = linePath(ema30, toYPrice);
  const dRsi = linePath(rsi14, toYRsi);

  const gridLines = 4;
  const yTicks = Array.from({ length: gridLines + 1 }, (_, i) => i / gridLines);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      {/* PRICE PANEL */}
      <svg viewBox={`0 0 ${w} ${hPrice}`} width="100%" height={hPrice}>
        <rect
          x="0"
          y="0"
          width={w}
          height={hPrice}
          fill="rgba(0,0,0,0.0)"
          stroke="rgba(119,255,154,0.10)"
          strokeWidth="1"
          rx="12"
        />

        {/* Grid + Y labels */}
        {yTicks.map((t, idx) => {
          const y = PAD_T + t * (hPrice - PAD_T - PAD_B);
          const val = yMax - t * (yMax - yMin);
          return (
            <g key={`py-${idx}`}>
              <line
                x1={PAD_L}
                y1={y}
                x2={w - PAD_R}
                y2={y}
                stroke={idx === yTicks.length - 1 ? "rgba(119,255,154,0.18)" : "rgba(119,255,154,0.09)"}
                strokeWidth={idx === yTicks.length - 1 ? 1.2 : 1}
              />
              <text
                x={PAD_L - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="rgba(119,255,154,0.65)"
                style={{ fontFamily: 'ui-monospace, Menlo, Monaco, Consolas, monospace' }}
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
          style={{ fontFamily: 'ui-monospace, Menlo, Monaco, Consolas, monospace' }}
        >
          {fmt(lastClose)}
        </text>

        {/* Candles */}
        {data.map((c, i) => {
          const xCenter = PAD_L + i * step + step / 2;

          const yO = toYPrice(c.o);
          const yC = toYPrice(c.c);
          const yH = toYPrice(c.h);
          const yL = toYPrice(c.l);

          const up = c.c >= c.o;

          const stroke = up ? "var(--pip-up)" : "var(--pip-down)";
          const fill = up ? "var(--pip-up-fill)" : "var(--pip-down-fill)";

          const bodyTop = Math.min(yO, yC);
          const bodyBot = Math.max(yO, yC);
          const bodyH = Math.max(2.2, bodyBot - bodyTop);

          return (
            <g key={`${c.t}-${i}`}>
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

        {/* EMA LINES */}
        {dEma5 && (
          <path d={dEma5} fill="none" stroke="rgba(119,255,154,0.95)" strokeWidth="1.6" opacity="0.85" />
        )}
        {dEma10 && (
          <path d={dEma10} fill="none" stroke="rgba(119,255,154,0.75)" strokeWidth="1.4" opacity="0.70" />
        )}
        {dEma30 && (
          <path d={dEma30} fill="none" stroke="rgba(119,255,154,0.55)" strokeWidth="1.3" opacity="0.55" />
        )}

        {/* EMA labels */}
        <text
          x={PAD_L}
          y={PAD_T + 12}
          fontSize="11"
          fill="rgba(119,255,154,0.75)"
          style={{ fontFamily: 'ui-monospace, Menlo, Monaco, Consolas, monospace' }}
        >
          EMA5: {fmt(ema5[ema5.length - 1])}   EMA10: {fmt(ema10[ema10.length - 1])}   EMA30:{" "}
          {fmt(ema30[ema30.length - 1])}
        </text>
      </svg>

      <div style={{ height: gap }} />

      {/* VOLUME PANEL */}
      <svg viewBox={`0 0 ${w} ${hVol}`} width="100%" height={hVol}>
        <rect
          x="0"
          y="0"
          width={w}
          height={hVol}
          fill="rgba(0,0,0,0.0)"
          stroke="rgba(119,255,154,0.10)"
          strokeWidth="1"
          rx="12"
        />

        <line x1={PAD_L} y1={hVol - 10} x2={w - PAD_R} y2={hVol - 10} stroke="rgba(119,255,154,0.10)" />

        {data.map((c, i) => {
          const xCenter = PAD_L + i * step + step / 2;
          const up = c.c >= c.o;

          const v = vols[i];
          const y = toYVol(v);
          const barH = Math.max(1.5, (hVol - 10) - y);

          const fill = up ? "rgba(0,255,160,0.22)" : "rgba(255,80,80,0.22)";
          const stroke = up ? "rgba(0,255,160,0.55)" : "rgba(255,80,80,0.55)";

          const barW = Math.max(3.5, Math.min(10, bw));

          return (
            <rect
              key={`v-${c.t}-${i}`}
              x={xCenter - barW / 2}
              y={y}
              width={barW}
              height={barH}
              fill={fill}
              stroke={stroke}
              strokeWidth="1"
              rx="1"
              opacity="0.95"
            />
          );
        })}

        <text
          x={PAD_L}
          y={PAD_T + 12}
          fontSize="11"
          fill="rgba(119,255,154,0.65)"
          style={{ fontFamily: 'ui-monospace, Menlo, Monaco, Consolas, monospace' }}
        >
          VOLUME {hasRealVol ? "(real)" : "(estimated)"} • max: {fmt(Math.max(...vols))}
        </text>
      </svg>

      <div style={{ height: gap }} />

      {/* RSI PANEL */}
      <svg viewBox={`0 0 ${w} ${hRsi}`} width="100%" height={hRsi}>
        <rect
          x="0"
          y="0"
          width={w}
          height={hRsi}
          fill="rgba(0,0,0,0.0)"
          stroke="rgba(119,255,154,0.10)"
          strokeWidth="1"
          rx="12"
        />

        <line x1={PAD_L} y1={toYRsi(70)} x2={w - PAD_R} y2={toYRsi(70)} stroke="rgba(119,255,154,0.10)" />
        <line x1={PAD_L} y1={toYRsi(30)} x2={w - PAD_R} y2={toYRsi(30)} stroke="rgba(119,255,154,0.10)" />

        {dRsi && (
          <path d={dRsi} fill="none" stroke="rgba(119,255,154,0.80)" strokeWidth="1.6" opacity="0.85" />
        )}

        <text
          x={PAD_L}
          y={PAD_T + 12}
          fontSize="11"
          fill="rgba(119,255,154,0.65)"
          style={{ fontFamily: 'ui-monospace, Menlo, Monaco, Consolas, monospace' }}
        >
          RSI14: {fmt(rsi14[rsi14.length - 1])}  (30/70 guides)
        </text>
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
                <button className={`pip-link ${intervalSec === 60 ? "active" : ""}`} onClick={() => setIntervalSec(60)} type="button">
                  1M
                </button>
                <button className={`pip-link ${intervalSec === 300 ? "active" : ""}`} onClick={() => setIntervalSec(300)} type="button">
                  5M
                </button>
                <button className={`pip-link ${intervalSec === 900 ? "active" : ""}`} onClick={() => setIntervalSec(900)} type="button">
                  15M
                </button>
                <button className={`pip-link ${intervalSec === 3600 ? "active" : ""}`} onClick={() => setIntervalSec(3600)} type="button">
                  1H
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <CandleChartPro candles={ohlc} />
            </div>

            <div className="pip-muted" style={{ marginTop: 10 }}>
              Candles + EMA(5/10/30) + Volume + RSI(14). Mobile-optimized window (up to 200 candles).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

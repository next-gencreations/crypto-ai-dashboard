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
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

/* ---------- normalize candles from API ---------- */
/**
 * Accepts candles in either format:
 *  A) { t, o, h, l, c }
 *  B) { t, open, high, low, close }
 * Also coerces string numbers -> numbers.
 */
function normalizeCandles(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((c) => {
      const t = c?.t || c?.time_utc || c?.time || "";
      const o = c?.o ?? c?.open;
      const h = c?.h ?? c?.high;
      const l = c?.l ?? c?.low;
      const cl = c?.c ?? c?.close;

      const on = Number(o);
      const hn = Number(h);
      const ln = Number(l);
      const cn = Number(cl);

      if (!t || [on, hn, ln, cn].some((x) => Number.isNaN(x))) return null;

      return { t, o: on, h: hn, l: ln, c: cn };
    })
    .filter(Boolean);
}

function safeMarketsList(m) {
  try {
    if (Array.isArray(m)) return m.map(String);
    if (typeof m === "string") {
      // might be JSON string like ["BTCUSDT","ETHUSDT"]
      const parsed = JSON.parse(m);
      if (Array.isArray(parsed)) return parsed.map(String);
      return m ? [m] : [];
    }
    return [];
  } catch {
    return typeof m === "string" ? [m] : [];
  }
}

/* --------- simple line chart (equity) --------- */
function MiniLineChart({ points, height = 150 }) {
  const w = 520;
  const h = height;

  const series = (points || []).filter((p) => typeof p?.equity_usd === "number");
  if (series.length < 2) {
    return (
      <div style={{ height: h, display: "grid", placeItems: "center", opacity: 0.8 }}>
        NOT ENOUGH DATA
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
    return h - 10 - t * (h - 20);
  };

  const d = series
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.equity_usd)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      <line x1="10" y1={h - 10} x2={w - 10} y2={h - 10} stroke="rgba(119,255,154,0.18)" />
      <line x1="10" y1={h / 2} x2={w - 10} y2={h / 2} stroke="rgba(119,255,154,0.10)" />
      <path d={d} fill="none" stroke="rgba(119,255,154,0.95)" strokeWidth="2.2" />
    </svg>
  );
}

/* --------- candle chart (your /ohlc) --------- */
function CandleChart({ candles, height = 240 }) {
  const w = 520;
  const h = height;
  const data = (candles || []).slice(-70);

  if (data.length < 2) {
    return (
      <div style={{ height: h, display: "grid", placeItems: "center", opacity: 0.8 }}>
        NO CANDLES YET
      </div>
    );
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
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      <line x1="10" y1={h - 10} x2={w - 10} y2={h - 10} stroke="rgba(119,255,154,0.18)" />
      <line x1="10" y1={h / 2} x2={w - 10} y2={h / 2} stroke="rgba(119,255,154,0.10)" />

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
          <g key={`${c.t}-${i}`}>
            <line
              x1={x + bw / 2}
              y1={yH}
              x2={x + bw / 2}
              y2={yL}
              stroke="rgba(119,255,154,0.55)"
              strokeWidth="1.1"
            />
            <rect
              x={x}
              y={bodyTop}
              width={bw}
              height={bodyH}
              fill={up ? "rgba(119,255,154,0.25)" : "rgba(119,255,154,0.08)"}
              stroke="rgba(119,255,154,0.85)"
              strokeWidth="1"
            />
          </g>
        );
      })}
    </svg>
  );
}

function TradingViewEmbed({ symbol = "BINANCE:BTCUSDT", interval = "5" }) {
  const src =
    "https://s.tradingview.com/widgetembed/?" +
    new URLSearchParams({
      symbol,
      interval,
      theme: "dark",
      style: "1",
      locale: "en",
      toolbarbg: "#06110a",
      enable_publishing: "false",
      hide_side_toolbar: "false",
      allow_symbol_change: "true",
      save_image: "false",
      studies: "",
    }).toString();

  return (
    <div className="pip-chartwrap" style={{ padding: 0, overflow: "hidden" }}>
      <iframe
        title="TradingView"
        src={src}
        style={{ width: "100%", height: 520, border: 0, display: "block" }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export default function Page()

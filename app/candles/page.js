"use client";
import "../globals.css";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const REFRESH_MS = 5000;

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

function CandleChart({ candles, height = 360 }) {
  const containerRef = useRef(null);
  const [w, setW] = useState(520);

  // Responsive width: match container width (phone-friendly)
  useEffect(() => {
    function measure() {
      const el = containerRef.current;
      if (!el) return;
      const cw = Math.floor(el.getBoundingClientRect().width || 520);
      setW(Math.max(320, Math.min(980, cw))); // clamp
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const h = height;

  // SHOW MORE CANDLES (denser)
  const data = (candles || []).slice(-200);

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

  // Vertical padding so it doesn’t look overly zoomed
  const pad = (maxY - minY) * 0.18 || 1;
  const yMax = maxY + pad;
  const yMin = minY - pad;

  const toY = (y) => {
    const t = (y - yMin) / (yMax - yMin);
    return h - 12 - t * (h - 24);
  };

  // THINNER candles: hard cap candle body width
  // More candles visible on phone.
  const innerW = w - 24;
  const step = innerW / data.length;

  // 1) Keep them thin (max 4px)
  // 2) Keep minimum 1px so you always see them
  const bw = Math.max(1, Math.min(4, step * 0.55));

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
        {/* grid */}
        <line x1="12" y1={h - 12} x2={w - 12} y2={h - 12} stroke="var(--pip-grid-1)" />
        <line x1="12" y1={h / 2} x2={w - 12} y2={h / 2} stroke="var(--pip-grid-2)" />

        {data.map((c, i) => {
          const xCenter = 12 + i * step + step / 2;

          const yO = toY(c.o);
          const yC = toY(c.c);
          const yH = toY(c.h);
          const yL = toY(c.l);

          const up = c.c >= c.o;
          const stroke = up ? "var(--pip-up)" : "var(--pip-down)";
          const fill = up ? "var(--pip-up-fill)" : "var(--pip-down-fill)";

          const bodyTop = Math.min(yO, yC);
          const bodyBot = Math.max(yO, yC);
          const bodyH = Math.max(2, bodyBot - bodyTop);

          return (
            <g key={`${c.t}-${i}`}>
              {/* wick */}
              <line x1={xCenter} y1={yH} x2={xCenter} y2={yL} stroke={stroke} strokeWidth="1.1" />
              {/* body */}
              <rect
                x={xCenter - bw / 2}
                y={bodyTop}
                width={bw}
                height={bodyH}
                fill={fill}
                stroke={stroke}
                strokeWidth="1"
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

export default function CandlesPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";

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

  async function fetchJson(url, signal) {
    const res = await fetch(url, { cache: "no-store", signal });
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    return res.json();
  }

  async function fetchAll(signal) {
    if (!apiBase) {
      setErr("Missing NEXT_PUBLIC_API_URL in Vercel environment variables.");
      return;
    }
    try {
      setErr("");

      const data = await fetchJson(`${apiBase}/data`, signal);
      const hbMarkets = safeMarketsList(data?.heartbeat?.markets);
      if (hbMarkets.length) {
        setMarkets(hbMarkets);
        if (!hbMarkets.includes(market)) setMarket(hbMarkets[0]);
      }

      const o = await fetchJson(
        `${apiBase}/ohlc?market=${encodeURIComponent(market)}&interval=${intervalSec}&limit=600`,
        signal
      );

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
      setTimeout(() => ac2.abort(), 8000);
    }, REFRESH_MS);

    return () => {
      ac.abort();
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, market, intervalSec]);

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
              <div className="pip-row" style={{ gap: 10, flexWrap: "wrap" }}>
                <div className="pip-k">Market</div>
                <select className="pip-tab" value={market} onChange={(e) => setMarket(e.target.value)}>
                  {markets.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pip-row" style={{ gap: 8, flexWrap: "wrap" }}>
                <button className={`pip-tab ${intervalSec === 60 ? "active" : ""}`} onClick={() => setIntervalSec(60)}>1M</button>
                <button className={`pip-tab ${intervalSec === 300 ? "active" : ""}`} onClick={() => setIntervalSec(300)}>5M</button>
                <button className={`pip-tab ${intervalSec === 900 ? "active" : ""}`} onClick={() => setIntervalSec(900)}>15M</button>
                <button className={`pip-tab ${intervalSec === 3600 ? "active" : ""}`} onClick={() => setIntervalSec(3600)}>1H</button>
              </div>
            </div>

            <div className="pip-chartwrap">
              <CandleChart candles={ohlc} />
            </div>

            <div className="pip-muted" style={{ marginTop: 10 }}>
              Thinner candles + shows more history (200 candles). Green = up, Red = down.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

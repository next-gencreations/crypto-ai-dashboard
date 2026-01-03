"use client";

import Link from "next/link";
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

function MiniCandlePreview({ candles, height = 160 }) {
  const w = 520;
  const h = height;
  const data = (candles || []).slice(-70);

  if (data.length < 2) {
    return <div style={{ height: h, display: "grid", placeItems: "center", opacity: 0.8 }}>NO DATA</div>;
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

  const bw = Math.max(3, Math.floor((w - 20) / data.length) - 1);

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
            <line x1={x + bw / 2} y1={yH} x2={x + bw / 2} y2={yL} stroke="rgba(119,255,154,0.45)" strokeWidth="1" />
            <rect
              x={x}
              y={bodyTop}
              width={bw}
              height={bodyH}
              fill={up ? "rgba(119,255,154,0.22)" : "rgba(119,255,154,0.06)"}
              stroke="rgba(119,255,154,0.8)"
              strokeWidth="1"
            />
          </g>
        );
      })}
    </svg>
  );
}

export default function CryptoPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";

  const [err, setErr] = useState("");
  const [lastFetchAt, setLastFetchAt] = useState(null);

  const [heartbeat, setHeartbeat] = useState({});
  const [markets, setMarkets] = useState([]);

  const [marketA, setMarketA] = useState("BTCUSDT");
  const [marketB, setMarketB] = useState("ETHUSDT");
  const [candlesA, setCandlesA] = useState([]);
  const [candlesB, setCandlesB] = useState([]);

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

      // Load /data for heartbeat + markets
      const data = await fetchJson(`${apiBase}/data`, signal);
      const hb = data?.heartbeat || {};
      setHeartbeat(hb);

      const m = safeMarketsList(hb?.markets);
      setMarkets(m);

      // If we have a markets list, try to keep selections valid
      if (m.length) {
        if (!m.includes(marketA)) setMarketA(m[0]);
        if (!m.includes(marketB)) setMarketB(m[Math.min(1, m.length - 1)]);
      }

      // Load candles for two selected markets (1m default)
      const aRes = await fetchJson(`${apiBase}/ohlc?market=${encodeURIComponent(marketA)}&interval=60&limit=250`, signal);
      setCandlesA(normalizeCandles(aRes?.candles || aRes || []));

      const bRes = await fetchJson(`${apiBase}/ohlc?market=${encodeURIComponent(marketB)}&interval=60&limit=250`, signal);
      setCandlesB(normalizeCandles(bRes?.candles || bRes || []));

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
  }, [apiBase, marketA, marketB]);

  const pricesOk = heartbeat?.prices_ok === 1 || heartbeat?.prices_ok === true;
  const marketsText = useMemo(() => (markets?.length ? markets.join(", ") : "—"), [markets]);

  return (
    <div className="pip-crt">
      <div className="pip-shell">
        <div className="pip-topbar">
          <div className="pip-topbar-left">
            <div className="pip-title">PIP-TRADE 3000</div>
            <div className="pip-sub wrap">
              Crypto overview · API: {apiBase || "—"} · Refresh: {REFRESH_MS / 1000}s · Last: {lastFetchAt ? lastFetchAt.toLocaleTimeString() : "—"}
            </div>
          </div>

          <div className="pip-topbar-right">
            <span className="pip-badge">{pricesOk ? "PRICES OK" : "PRICES FAIL"}</span>
            <span className="pip-badge">Equity: {fmtMoney(heartbeat?.equity_usd)}</span>
          </div>
        </div>

        <div className="pip-links">
          <Link className="pip-link" href="/">HOME</Link>
          <Link className="pip-link" href="/candles">CANDLES</Link>
          <Link className="pip-link active" href="/crypto">CRYPTO</Link>
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
          <div className="pip-grid">
            <div className="pip-panel">
              <div className="pip-heading">MARKET STATUS</div>

              <div className="pip-row">
                <div className="pip-k">Equity</div>
                <div className="pip-v">{fmtMoney(heartbeat?.equity_usd)}</div>
              </div>

              <div className="pip-row">
                <div className="pip-k">Markets</div>
                <div className="pip-v wrap">{marketsText}</div>
              </div>

              <div className="pip-row">
                <div className="pip-k">Open positions</div>
                <div className="pip-v">{heartbeat?.open_positions ?? "—"}</div>
              </div>

              <div className="pip-row">
                <div className="pip-k">Survival</div>
                <div className="pip-v">{heartbeat?.survival_mode || "—"}</div>
              </div>

              <div className="pip-row">
                <div className="pip-k">Last heartbeat</div>
                <div className="pip-v wrap">{heartbeat?.time_utc || "—"}</div>
              </div>
            </div>

            <div className="pip-panel">
              <div className="pip-heading">PREVIEW A (1M)</div>

              <div className="pip-row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div className="pip-row" style={{ gap: 10, flexWrap: "wrap" }}>
                  <div className="pip-k">Market</div>
                  <select className="pip-select" value={marketA} onChange={(e) => setMarketA(e.target.value)}>
                    {(markets?.length ? markets : ["BTCUSDT", "ETHUSDT"]).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pip-chartwrap">
                <MiniCandlePreview candles={candlesA} />
              </div>

              <div className="pip-muted" style={{ marginTop: 8 }}>
                Full controls on the CANDLES page
              </div>
            </div>

            <div className="pip-panel">
              <div className="pip-heading">PREVIEW B (1M)</div>

              <div className="pip-row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div className="pip-row" style={{ gap: 10, flexWrap: "wrap" }}>
                  <div className="pip-k">Market</div>
                  <select className="pip-select" value={marketB} onChange={(e) => setMarketB(e.target.value)}>
                    {(markets?.length ? markets : ["ETHUSDT", "BTCUSDT"]).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pip-chartwrap">
                <MiniCandlePreview candles={candlesB} />
              </div>

              <div className="pip-muted" style={{ marginTop: 8 }}>
                Full controls on the CANDLES page
              </div>
            </div>
          </div>

          <div className="pip-panel" style={{ marginTop: 14 }}>
            <div className="pip-heading">QUICK NOTES</div>
            <div className="pip-row">
              <div className="pip-k">Prices source</div>
              <div className="pip-v wrap">These candles are built from YOUR bot’s /prices stream → /ohlc.</div>
            </div>
            <div className="pip-row">
              <div className="pip-k">Tip</div>
              <div className="pip-v wrap">If previews show “NO DATA”, leave bot running a while to generate ticks.</div>
            </div>
            <div className="pip-row">
              <div className="pip-k">API</div>
              <div className="pip-v wrap">{apiBase || "—"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

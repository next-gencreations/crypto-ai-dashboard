"use client";

import React, { useEffect, useMemo, useState } from "react";

function clampNum(v, lo, hi, d = v) {
  const n = Number(v);
  const x = Number.isFinite(n) ? n : Number(d);
  return Math.max(lo, Math.min(hi, x));
}

async function fetchJson(url, signal) {
  const res = await fetch(url, { signal, cache: "no-store" });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    const e = new Error("fetchJson failed");
    e.status = res.status;
    e.data = data;
    throw e;
  }
  return data;
}

export default function CandlesPage() {
  const [market, setMarket] = useState("BTCUSDT");
  const [tf, setTf] = useState("1m");

  const [ohlc, setOhlc] = useState([]);
  const [last, setLast] = useState("");
  const [err, setErr] = useState("");
  const [ohlcBlocked, setOhlcBlocked] = useState(false);

  const refreshMs = 5000;

  const ohlcUrl = useMemo(() => {
    return `/api/proxy/ohlc?market=${encodeURIComponent(market)}&tf=${encodeURIComponent(tf)}`;
  }, [market, tf]);

  useEffect(() => {
    const ac = new AbortController();
    let alive = true;

    async function fetchAll(signal) {
      try {
        setErr("");
        setOhlcBlocked(false);

        const data = await fetchJson(ohlcUrl, signal);

        // expected: { ok:true, candles:[...], time_utc:"..." }
        const candles = Array.isArray(data?.candles) ? data.candles : [];
        setOhlc(candles);
        setLast(String(data?.time_utc || ""));
      } catch (e) {
        const status = e?.status || 0;
        const text = e?.data || e?.message || String(e);
        const lower = String(text).toLowerCase();

        // Binance restriction (451 / "restricted location")
        if (
          lower.includes("binance_failed") ||
          lower.includes("restricted location") ||
          String(status) === "451" ||
          String(text).includes('status":451')
        ) {
          setOhlcBlocked(true);
          setOhlc([]);
          setErr(`Candles feed blocked (Binance restriction). Showing TradingView only.`);
        } else {
          setErr(`API ${status} — ${text}`);
        }
      }
    }

    fetchAll(ac.signal);

    const t = setInterval(() => {
      if (!alive) return;
      fetchAll(ac.signal);
    }, refreshMs);

    return () => {
      alive = false;
      clearInterval(t);
      ac.abort();
    };
  }, [ohlcUrl]);

  return (
    <div style={{ padding: 18 }}>
      <div style={{ marginBottom: 12, opacity: 0.9 }}>
        <div style={{ fontSize: 32, letterSpacing: 4, fontFamily: "monospace" }}>PIP-TRADE 3000</div>
        <div style={{ fontFamily: "monospace", opacity: 0.8 }}>
          Candles page · API: /api/proxy · Refresh: 5s · Last: {last || "—"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <button onClick={() => setMarket("BTCUSDT")}>BTC</button>
        <button onClick={() => setMarket("ETHUSDT")}>ETH</button>
        <button onClick={() => setMarket("SOLUSDT")}>SOL</button>

        <span style={{ marginLeft: 12, fontFamily: "monospace" }}>TF:</span>
        <button onClick={() => setTf("1m")}>1M</button>
        <button onClick={() => setTf("5m")}>5M</button>
        <button onClick={() => setTf("15m")}>15M</button>
        <button onClick={() => setTf("1h")}>1H</button>
      </div>

      {err ? (
        <div style={{ padding: 12, marginBottom: 12, border: "1px solid rgba(0,255,160,0.25)", borderRadius: 12 }}>
          <div style={{ fontFamily: "monospace", color: "rgba(0,255,160,0.9)" }}>{err}</div>
        </div>
      ) : null}

      {/* Always show TradingView as the reliable view */}
      <div style={{ padding: 12, border: "1px solid rgba(0,255,160,0.18)", borderRadius: 14, marginBottom: 14 }}>
        <div style={{ fontFamily: "monospace", marginBottom: 10, opacity: 0.85 }}>
          TRADINGVIEW (reliable) — {market} · {tf}
        </div>
        <iframe
          title="TradingView"
          style={{ width: "100%", height: 520, border: "0", borderRadius: 12 }}
          src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(
            market
          )}&interval=${encodeURIComponent(tf)}&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=rgba(0,0,0,0.35)&studies=[]&theme=dark`}
        />
      </div>

      {/* Optional: your API candles (only when not blocked) */}
      <div style={{ padding: 12, border: "1px solid rgba(0,255,160,0.12)", borderRadius: 14 }}>
        <div style={{ fontFamily: "monospace", marginBottom: 10, opacity: 0.85 }}>
          PRICE CANDLES ({market}) · {tf}
        </div>

        {ohlcBlocked ? (
          <div style={{ fontFamily: "monospace", opacity: 0.8 }}>
            CANDLES FEED BLOCKED — USING TRADINGVIEW
          </div>
        ) : ohlc.length === 0 ? (
          <div style={{ fontFamily: "monospace", opacity: 0.8 }}>NO CANDLES YET</div>
        ) : (
          <pre style={{ fontFamily: "monospace", fontSize: 12, whiteSpace: "pre-wrap" }}>
            {JSON.stringify(ohlc.slice(-25), null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

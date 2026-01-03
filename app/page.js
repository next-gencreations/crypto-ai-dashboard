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

/* --------- simple line chart (equity) --------- */
function MiniLineChart({ points, height = 150 }) {
  const w = 520;
  const h = height;

  const series = (points || []).filter((p) => typeof p?.equity_usd === "number");
  if (series.length < 2) {
    return <div style={{ height: h, display: "grid", placeItems: "center", opacity: 0.8 }}>NOT ENOUGH DATA</div>;
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

  if (!data.length) {
    return <div style={{ height: h, display: "grid", placeItems: "center", opacity: 0.8 }}>NO CANDLES YET</div>;
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
            <line x1={x + bw / 2} y1={yH} x2={x + bw / 2} y2={yL} stroke="rgba(119,255,154,0.55)" strokeWidth="1.1" />
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

export default function Page() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";
  const dataUrl = apiBase ? `${apiBase}/data` : "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [payload, setPayload] = useState(null);
  const [lastFetchAt, setLastFetchAt] = useState(null);

  const [tab, setTab] = useState("STATUS"); // STATUS | CHARTS | TRADES
  const [intervalSec, setIntervalSec] = useState(60);

  const heartbeat = payload?.heartbeat || {};
  const pet = payload?.pet || {};
  const control = payload?.control || {};
  const equity = payload?.equity || [];
  const trades = payload?.trades || [];
  const stateMode = String(payload?.state || "ACTIVE").toUpperCase();

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

      const o = await fetchJson(`${apiBase}/ohlc?market=${marketForCandles}&interval=${intervalSec}&limit=200`, signal);
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
  }, [dataUrl, intervalSec]);

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
  const countdown =
    stateMode === "CRYO" ? timeLeft(control?.cryo_until_utc) : stateMode === "PAUSED" ? timeLeft(control?.pause_until_utc) : "";

  const sex = String(pet?.sex || "boy").toLowerCase();
  const petChar = sex === "girl" ? "VAULT GIRL" : "VAULT BOY";

  const statusBadge = useMemo(() => {
    if (stateMode === "CRYO") return "CRYO";
    if (stateMode === "PAUSED") return "PAUSED";
    return "ACTIVE";
  }, [stateMode]);

  return (
    <div className="pip-crt">
      <div className="pip-shell">
        <div className="pip-topbar">
          <div>
            <div className="pip-title">PIP-TRADE 3000</div>
            <div className="pip-sub wrap">
              API: {apiBase || "—"} · Refresh: {REFRESH_MS / 1000}s · Last: {lastFetchAt ? lastFetchAt.toLocaleTimeString() : "—"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="pip-badge">{statusBadge}</span>
            <span className="pip-badge">{pricesOk ? "PRICES OK" : "PRICES FAIL"}</span>
            {countdown ? <span className="pip-badge">THAW: {countdown}</span> : null}
          </div>
        </div>

        <div className="pip-tabs">
          <button className={`pip-tab ${tab === "STATUS" ? "active" : ""}`} onClick={() => setTab("STATUS")}>STATUS</button>
          <button className={`pip-tab ${tab === "CHARTS" ? "active" : ""}`} onClick={() => setTab("CHARTS")}>DATA</button>
          <button className={`pip-tab ${tab === "TRADES" ? "active" : ""}`} onClick={() => setTab("TRADES")}>LOG</button>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="pip-btn" onClick={() => fetchData(new AbortController().signal)}>REFRESH</button>
            <button className="pip-btn" onClick={async () => { try { await postJson("/control/pause", { seconds: 600, reason: "Paused from Pip" }); } catch {} }}>
              PAUSE
            </button>
            <button className="pip-btn" onClick={async () => { try { await postJson("/control/cryo", { seconds: 600, reason: "Manual Cryo" }); } catch {} }}>
              CRYO
            </button>
            <button className="pip-btn" onClick={async () => { try { await postJson("/control/revive", { reason: "Revive" }); } catch {} }}>
              REVIVE
            </button>
          </div>
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
          {tab === "STATUS" && (
            <div className="pip-grid">
              <div className="pip-panel">
                <div className="pip-heading">SYSTEM STATUS</div>
                <div className="pip-row"><div className="pip-k">Equity</div><div className="pip-v">{fmtMoney(heartbeat?.equity_usd)}</div></div>
                <div className="pip-row"><div className="pip-k">Markets</div><div className="pip-v wrap">{Array.isArray(heartbeat?.markets) ? heartbeat.markets.join(", ") : "—"}</div></div>
                <div className="pip-row"><div className="pip-k">Open positions</div><div className="pip-v">{heartbeat?.open_positions ?? "—"}</div></div>
                <div className="pip-row"><div className="pip-k">Survival</div><div className="pip-v">{heartbeat?.survival_mode || "—"}</div></div>
                <div className="pip-row"><div className="pip-k">Last heartbeat</div><div className="pip-v wrap">{heartbeat?.time_utc || "—"}</div></div>
              </div>

              <div className="pip-panel">
                <div className="pip-heading">VAULT COMPANION</div>
                <div className="pip-row"><div className="pip-k">Name</div><div className="pip-v">{petChar}</div></div>
                <div className="pip-row"><div className="pip-k">Stage</div><div className="pip-v">{pet?.stage || "—"}</div></div>
                <div className="pip-row"><div className="pip-k">Mood</div><div className="pip-v">{pet?.mood || "—"}</div></div>
                <div className="pip-row"><div className="pip-k">Health</div><div className="pip-v">{fmtNum(pet?.health, 1)}</div></div>
                <div className="pip-row"><div className="pip-k">Hunger</div><div className="pip-v">{fmtNum(pet?.hunger, 1)}</div></div>
                <div className="pip-row"><div className="pip-k">Growth</div><div className="pip-v">{fmtNum(pet?.growth, 1)}</div></div>
                <div className="pip-row"><div className="pip-k">Updated</div><div className="pip-v wrap">{pet?.time_utc || "—"}</div></div>
                {stateMode === "CRYO" && (
                  <div className="pip-muted" style={{ marginTop: 10 }}>
                    CRYO TUBE ACTIVE: {control?.cryo_reason || "safety"} · THAW IN {countdown || "—"}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "CHARTS" && (
            <div className="pip-grid">
              <div className="pip-panel">
                <div className="pip-heading">EQUITY GRAPH</div>
                <div className="pip-chartwrap">
                  <MiniLineChart points={equity} />
                </div>
              </div>

              <div className="pip-panel">
                <div className="pip-heading">
                  PRICE CANDLES ({marketForCandles}) · {intervalSec === 60 ? "1M" : intervalSec === 300 ? "5M" : `${intervalSec / 60}M`}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <button className={`pip-tab ${intervalSec === 60 ? "active" : ""}`} onClick={() => setIntervalSec(60)}>1M</button>
                  <button className={`pip-tab ${intervalSec === 300 ? "active" : ""}`} onClick={() => setIntervalSec(300)}>5M</button>
                  <button className={`pip-tab ${intervalSec === 900 ? "active" : ""}`} onClick={() => setIntervalSec(900)}>15M</button>
                </div>

                <div className="pip-chartwrap">
                  <CandleChart candles={ohlc} />
                </div>

                <div className="pip-muted" style={{ marginTop: 10 }}>
                  Candles are built from your bot’s own /prices ticks → /ohlc
                </div>
              </div>
            </div>
          )}

          {tab === "TRADES" && (
            <div className="pip-panel">
              <div className="pip-heading">TRADE LOG</div>

              <div style={{ overflowX: "auto" }}>
                <table className="pip-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Market</th>
                      <th>Side</th>
                      <th>Size</th>
                      <th>Price</th>
                      <th>PnL</th>
                      <th>Conf</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(trades || []).slice(-25).reverse().map((t, idx) => (
                      <tr key={idx}>
                        <td className="wrap">{t.time_utc || "—"}</td>
                        <td>{t.market || "—"}</td>
                        <td>{t.side || "—"}</td>
                        <td>{fmtMoney(t.size_usd)}</td>
                        <td>{fmtNum(t.price, 2)}</td>
                        <td>{fmtMoney(t.pnl_usd)}</td>
                        <td>{fmtNum(t.confidence, 2)}</td>
                        <td className="wrap">{t.reason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!loading && (!trades || trades.length === 0) && <div className="pip-muted" style={{ marginTop: 12 }}>NO TRADES YET</div>}
            </div>
          )}
        </div>

        {loading && !payload && (
          <div className="pip-content">
            <div className="pip-muted">LOADING…</div>
          </div>
        )}
      </div>
    </div>
  );
}

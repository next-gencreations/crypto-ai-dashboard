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

/* Normalise /ohlc candles from API */
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
  const pad = (maxY - minY) * 0.12 || 1;

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
      <line x1="10" y1={h - 10} x2={w - 10} y2={h - 10} stroke="var(--pip-grid-1)" />
      <line x1="10" y1={h / 2} x2={w - 10} y2={h / 2} stroke="var(--pip-grid-2)" />
      <path d={d} fill="none" stroke="var(--pip-up)" strokeWidth="2.2" />
    </svg>
  );
}

/* --------- candle chart (your /ohlc) --------- */
function CandleChart({ candles, height = 240 }) {
  const w = 520;
  const h = height;
  const data = (candles || []).slice(-70);

  if (data.length < 2) {
    return <div style={{ height: h, display: "grid", placeItems: "center", opacity: 0.8 }}>NO CANDLES YET</div>;
  }

  const highs = data.map((c) => c.h);
  const lows = data.map((c) => c.l);
  const maxY = Math.max(...highs);
  const minY = Math.min(...lows);

  // MORE padding = less “zoomed in”
  const pad = (maxY - minY) * 0.22 || 1;

  const yMax = maxY + pad;
  const yMin = minY - pad;

  const toY = (y) => {
    const t = (y - yMin) / (yMax - yMin);
    return h - 10 - t * (h - 20);
  };

  const bw = Math.max(4, Math.floor((w - 20) / data.length) - 1);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      {/* grid */}
      <line x1="10" y1={h - 10} x2={w - 10} y2={h - 10} stroke="var(--pip-grid-1)" />
      <line x1="10" y1={h / 2} x2={w - 10} y2={h / 2} stroke="var(--pip-grid-2)" />

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

        const stroke = up ? "var(--pip-up)" : "var(--pip-down)";
        const fill = up ? "var(--pip-up-fill)" : "var(--pip-down-fill)";

        return (
          <g key={`${c.t}-${i}`}>
            <line x1={x + bw / 2} y1={yH} x2={x + bw / 2} y2={yL} stroke={stroke} strokeWidth="1.1" />
            <rect x={x} y={bodyTop} width={bw} height={bodyH} fill={fill} stroke={stroke} strokeWidth="1" />
          </g>
        );
      })}
    </svg>
  );
}

/* Simple built-in PipBoy/PipGirl SVG (no images needed) */
function VaultAvatar({ sex = "boy" }) {
  const girl = String(sex).toLowerCase() === "girl";
  return (
    <svg viewBox="0 0 64 64" width="44" height="44" aria-label={girl ? "Vault Girl" : "Vault Boy"}>
      {/* head */}
      <circle cx="32" cy="28" r="16" fill="rgba(119,255,154,0.20)" stroke="rgba(119,255,154,0.85)" strokeWidth="2" />
      {/* hair */}
      {girl ? (
        <path d="M18 26c2-10 26-10 28 0c-2-14-26-14-28 0Z" fill="rgba(119,255,154,0.35)" />
      ) : (
        <path d="M18 26c3-9 25-9 28 0c-4-6-24-6-28 0Z" fill="rgba(119,255,154,0.35)" />
      )}
      {/* eyes */}
      <circle cx="26" cy="28" r="2" fill="rgba(119,255,154,0.85)" />
      <circle cx="38" cy="28" r="2" fill="rgba(119,255,154,0.85)" />
      {/* smile */}
      <path d="M26 36c4 4 8 4 12 0" fill="none" stroke="rgba(119,255,154,0.85)" strokeWidth="2" strokeLinecap="round" />
      {/* body */}
      <path d="M18 54c2-10 26-10 28 0" fill="rgba(119,255,154,0.12)" stroke="rgba(119,255,154,0.65)" strokeWidth="2" />
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

  const [tab, setTab] = useState("STATUS"); // STATUS | DATA | LOG | CHARTS

  const [botIntervalSec, setBotIntervalSec] = useState(60);
  const [botMarket, setBotMarket] = useState("BTCUSDT");
  const [ohlc, setOhlc] = useState([]);

  const heartbeat = payload?.heartbeat || {};
  const pet = payload?.pet || {};
  const control = payload?.control || {};
  const equity = payload?.equity || [];
  const trades = payload?.trades || [];
  const stateMode = String(payload?.state || "ACTIVE").toUpperCase();

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

      const m = json?.heartbeat?.markets;
      const first =
        Array.isArray(m) && m.length ? String(m[0]) :
        typeof m === "string" && m ? m :
        botMarket;

      if (first && first !== botMarket) setBotMarket(first);

      const o = await fetchJson(
        `${apiBase}/ohlc?market=${encodeURIComponent(first || botMarket)}&interval=${botIntervalSec}&limit=250`,
        signal
      );

      setOhlc(normalizeCandles(o?.candles || o || []));
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
  }, [dataUrl, botIntervalSec]);

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
    stateMode === "CRYO" ? timeLeft(control?.cryo_until_utc) :
    stateMode === "PAUSED" ? timeLeft(control?.pause_until_utc) : "";

  const sex = String(pet?.sex || "boy").toLowerCase();

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

          <div className="pip-topbar-right">
            <span className="pip-badge">{statusBadge}</span>
            <span className="pip-badge">{pricesOk ? "PRICES OK" : "PRICES FAIL"}</span>
            {countdown ? <span className="pip-badge">THAW: {countdown}</span> : null}
          </div>
        </div>

        {/* NAV (HOME active) */}
        <div className="pip-links">
          <Link className="pip-link active" href="/">HOME</Link>
          <Link className="pip-link" href="/candles">CANDLES</Link>
          <Link className="pip-link" href="/crypto">CRYPTO</Link>
        </div>

        <div className="pip-tabs">
          <button className={`pip-tab ${tab === "STATUS" ? "active" : ""}`} onClick={() => setTab("STATUS")}>STATUS</button>
          <button className={`pip-tab ${tab === "DATA" ? "active" : ""}`} onClick={() => setTab("DATA")}>DATA</button>
          <button className={`pip-tab ${tab === "LOG" ? "active" : ""}`} onClick={() => setTab("LOG")}>LOG</button>
          <button className={`pip-tab ${tab === "CHARTS" ? "active" : ""}`} onClick={() => setTab("CHARTS")}>CHARTS</button>

          <div className="pip-actions">
            <button className="pip-btn" onClick={() => fetchData(new AbortController().signal)}>REFRESH</button>
            <button className="pip-btn" onClick={async () => { try { await postJson("/control/pause", { seconds: 600, reason: "Paused from Pip" }); await fetchData(new AbortController().signal); } catch {} }}>PAUSE</button>
            <button className="pip-btn" onClick={async () => { try { await postJson("/control/cryo", { seconds: 600, reason: "Manual Cryo" }); await fetchData(new AbortController().signal); } catch {} }}>CRYO</button>
            <button className="pip-btn" onClick={async () => { try { await postJson("/control/revive", { reason: "Revive" }); await fetchData(new AbortController().signal); } catch {} }}>REVIVE</button>
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

                <div className="pip-avatarRow">
                  <div className="pip-avatar">
                    <VaultAvatar sex={sex} />
                  </div>
                  <div className="pip-muted wrap">
                    {sex === "girl" ? "VAULT GIRL ONLINE" : "VAULT BOY ONLINE"}
                  </div>
                </div>

                <div className="pip-row"><div className="pip-k">Equity</div><div className="pip-v">{fmtMoney(heartbeat?.equity_usd)}</div></div>
                <div className="pip-row"><div className="pip-k">Markets</div><div className="pip-v wrap">{Array.isArray(heartbeat?.markets) ? heartbeat.markets.join(", ") : heartbeat?.markets || "—"}</div></div>
                <div className="pip-row"><div className="pip-k">Open positions</div><div className="pip-v">{heartbeat?.open_positions ?? "—"}</div></div>
                <div className="pip-row"><div className="pip-k">Survival</div><div className="pip-v">{heartbeat?.survival_mode || "—"}</div></div>
                <div className="pip-row"><div className="pip-k">Last heartbeat</div><div className="pip-v wrap">{heartbeat?.time_utc || "—"}</div></div>
              </div>

              <div className="pip-panel">
                <div className="pip-heading">VAULT COMPANION</div>
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

          {tab === "DATA" && (
            <div className="pip-grid">
              <div className="pip-panel">
                <div className="pip-heading">EQUITY GRAPH</div>
                <div className="pip-chartwrap">
                  <MiniLineChart points={equity} />
                </div>
              </div>

              <div className="pip-panel">
                <div className="pip-heading">BOT PRICE CANDLES ({botMarket})</div>

                <div className="pip-tf">
                  <button className={`pip-tab ${botIntervalSec === 60 ? "active" : ""}`} onClick={() => setBotIntervalSec(60)}>1M</button>
                  <button className={`pip-tab ${botIntervalSec === 300 ? "active" : ""}`} onClick={() => setBotIntervalSec(300)}>5M</button>
                  <button className={`pip-tab ${botIntervalSec === 900 ? "active" : ""}`} onClick={() => setBotIntervalSec(900)}>15M</button>
                </div>

                <div className="pip-chartwrap">
                  <CandleChart candles={ohlc} />
                </div>

                <div className="pip-muted" style={{ marginTop: 10 }}>
                  Green = up candles • Red = down candles • Less zoomed (extra padding)
                </div>
              </div>
            </div>
          )}

          {tab === "LOG" && (
            <div className="pip-panel">
              <div className="pip-heading">TRADE LOG</div>

              <div style={{ overflowX: "auto" }}>
                <table className="pip-table">
                  <thead>
                    <tr>
                      <th>Time</th><th>Market</th><th>Side</th><th>Size</th><th>Price</th><th>PnL</th><th>Conf</th><th>Reason</th>
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

              {!loading && (!trades || trades.length === 0) && (
                <div className="pip-muted" style={{ marginTop: 12 }}>NO TRADES YET</div>
              )}
            </div>
          )}

          {tab === "CHARTS" && (
            <div className="pip-panel">
              <div className="pip-heading">CHARTS</div>
              <div className="pip-muted">
                Use the dedicated pages for bigger charts:
                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="pip-link" href="/candles">OPEN CANDLES PAGE</Link>
                  <Link className="pip-link" href="/crypto">OPEN CRYPTO PAGE</Link>
                </div>
              </div>
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

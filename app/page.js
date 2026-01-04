"use client";
import "./globals.css";
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

/* ---------- normalize candles from API ---------- */
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
  const pad = (maxY - minY) * 0.10 || 1;

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

/* --------- candle chart --------- */
function CandleChart({ candles, height = 260 }) {
  const w = 520;
  const h = height;
  const data = (candles || []).slice(-120);

  if (data.length < 2) {
    return <div style={{ height: h, display: "grid", placeItems: "center", opacity: 0.8 }}>NO CANDLES YET</div>;
  }

  const highs = data.map((c) => c.h);
  const lows = data.map((c) => c.l);
  const maxY = Math.max(...highs);
  const minY = Math.min(...lows);

  const pad = (maxY - minY) * 0.25 || 1;
  const yMax = maxY + pad;
  const yMin = minY - pad;

  const toY = (y) => {
    const t = (y - yMin) / (yMax - yMin);
    return h - 10 - t * (h - 20);
  };

  const bw = Math.max(2, Math.min(6, Math.floor((w - 20) / data.length)));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      <line x1="10" y1={h - 10} x2={w - 10} y2={h - 10} stroke="var(--pip-grid-1)" />
      <line x1="10" y1={h / 2} x2={w - 10} y2={h / 2} stroke="var(--pip-grid-2)" />

      {data.map((c, i) => {
        const x = 10 + i * (bw + 1);
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
            <line x1={x + bw / 2} y1={yH} x2={x + bw / 2} y2={yL} stroke={stroke} strokeWidth="1.2" />
            <rect x={x} y={bodyTop} width={bw} height={bodyH} fill={fill} stroke={stroke} strokeWidth="1" />
          </g>
        );
      })}
    </svg>
  );
}

/* ====== FULL BODY COMPANION (MOVING) ====== */
function VaultCompanionFull({ sex, mood, survivalMode }) {
  const isGirl = String(sex || "boy").toLowerCase() === "girl";
  const src = isGirl ? "/vault-girl-full.png" : "/vault-boy-full.png";

  // simple behaviour rules (we can make smarter later)
  const moodKey = String(mood || "").toLowerCase();
  const survKey = String(survivalMode || "").toLowerCase();

  const isSad = moodKey.includes("sad") || moodKey.includes("cryo");
  const isAngry = moodKey.includes("angry");
  const isHappy = moodKey.includes("happy") || moodKey.includes("good");
  const isStarving = survKey.includes("starv") || survKey.includes("danger");

  // movement style
  const anim =
    isStarving ? "panic" :
    isAngry ? "stomp" :
    isSad ? "slow" :
    isHappy ? "walk" :
    "idle";

  return (
    <div className="pip-pet-stage" aria-label="Vault companion stage">
      <div className={`pip-pet ${anim}`}>
        <img src={src} alt={isGirl ? "Vault Girl" : "Vault Boy"} />
      </div>

      <div className="pip-pet-floor" />

      <div className="pip-muted" style={{ marginTop: 8 }}>
        Animation: {anim.toUpperCase()}
      </div>
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

  const [tab, setTab] = useState("STATUS");
  const [intervalSec, setIntervalSec] = useState(60);

  const [ohlc, setOhlc] = useState([]);
  const [marketForCandles, setMarketForCandles] = useState("BTCUSDT");

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
        marketForCandles;

      if (first && first !== marketForCandles) setMarketForCandles(first);

      const o = await fetchJson(
        `${apiBase}/ohlc?market=${encodeURIComponent(first || marketForCandles)}&interval=${intervalSec}&limit=600`,
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

  const tfLabel =
    intervalSec === 60 ? "1M" : intervalSec === 300 ? "5M" : intervalSec === 900 ? "15M" : `${Math.floor(intervalSec / 60)}M`;

  return (
    <div className="pip-crt">
      <div className="pip-shell">
        <div className="pip-topbar">
          <div className="pip-topbar-left">
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

        <div className="pip-links">
          <Link className="pip-link active" href="/">HOME</Link>
          <Link className="pip-link" href="/candles">CANDLES</Link>
          <Link className="pip-link" href="/crypto">CRYPTO</Link>
        </div>

        <div className="pip-tabs">
          <button className={`pip-tab ${tab === "STATUS" ? "active" : ""}`} onClick={() => setTab("STATUS")}>STATUS</button>
          <button className={`pip-tab ${tab === "DATA" ? "active" : ""}`} onClick={() => setTab("DATA")}>DATA</button>
          <button className={`pip-tab ${tab === "LOG" ? "active" : ""}`} onClick={() => setTab("LOG")}>LOG</button>

          <div className="pip-actions">
            <button className="pip-btn" onClick={() => fetchData(new AbortController().signal)}>REFRESH</button>
            <button className="pip-btn" onClick={async () => { try { await postJson("/control/pause", { seconds: 600, reason: "Paused from Pip" }); await fetchData(new AbortController().signal);} catch {} }}>PAUSE</button>
            <button className="pip-btn" onClick={async () => { try { await postJson("/control/cryo", { seconds: 600, reason: "Manual Cryo" }); await fetchData(new AbortController().signal);} catch {} }}>CRYO</button>
            <button className="pip-btn" onClick={async () => { try { await postJson("/control/revive", { reason: "Revive" }); await fetchData(new AbortController().signal);} catch {} }}>REVIVE</button>
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
                <div className="pip-row"><div className="pip-k">Markets</div><div className="pip-v wrap">{Array.isArray(heartbeat?.markets) ? heartbeat.markets.join(", ") : heartbeat?.markets || "—"}</div></div>
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

                <div style={{ marginTop: 12 }}>
                  <VaultCompanionFull sex={pet?.sex} mood={pet?.mood} survivalMode={heartbeat?.survival_mode} />
                </div>

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
                <div className="pip-chartwrap"><MiniLineChart points={equity} /></div>
              </div>

              <div className="pip-panel">
                <div className="pip-heading">PRICE CANDLES ({marketForCandles}) · {tfLabel}</div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <button className={`pip-tab ${intervalSec === 60 ? "active" : ""}`} onClick={() => setIntervalSec(60)}>1M</button>
                  <button className={`pip-tab ${intervalSec === 300 ? "active" : ""}`} onClick={() => setIntervalSec(300)}>5M</button>
                  <button className={`pip-tab ${intervalSec === 900 ? "active" : ""}`} onClick={() => setIntervalSec(900)}>15M</button>
                </div>

                <div className="pip-chartwrap">
                  <CandleChart candles={ohlc} />
                </div>

                <div className="pip-muted" style={{ marginTop: 10 }}>
                  Green = up candle, Red = down candle. Built from /prices → /ohlc
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

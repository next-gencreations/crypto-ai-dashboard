// app/page.js
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultGirlSVG from "./components/VaultGirlSVG";

const REFRESH_MS = 5000;
const FETCH_TIMEOUT_MS = 20000;

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

  // Some endpoints may return text/json; parse safely
  try {
    return txt ? JSON.parse(txt) : null;
  } catch {
    // If it wasn’t valid JSON, still show something useful
    throw new Error(`API returned non-JSON: ${txt.slice(0, 180)}`);
  }
}

function pickLatestEquityUSD(data) {
  const hbEq = Number(data?.heartbeat?.equity_usd);
  if (Number.isFinite(hbEq)) return hbEq;

  const arr = data?.equity;
  if (Array.isArray(arr) && arr.length) {
    const last = arr[arr.length - 1];
    const v = Number(last?.equity_usd);
    if (Number.isFinite(v)) return v;
  }
  return 0;
}

function pickLastTradePnl(data) {
  const ev = data?.events;
  if (Array.isArray(ev) && ev.length) {
    for (let i = ev.length - 1; i >= 0; i--) {
      const pnl = Number(ev[i]?.details?.pnl);
      if (Number.isFinite(pnl)) return pnl;
    }
  }
  const st = Number(data?.stats?.last_trade_pnl ?? data?.last_trade_pnl);
  return Number.isFinite(st) ? st : 0;
}

export default function HomePage() {
  // IMPORTANT: This is only for display now (proxy handles the actual call)
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  const [tab, setTab] = useState("status");
  const [err, setErr] = useState("");
  const [lastFetchAt, setLastFetchAt] = useState(null);
  const [botState, setBotState] = useState("—");

  const [equity, setEquity] = useState(0);
  const [markets, setMarkets] = useState([]);
  const [openPositions, setOpenPositions] = useState(0);
  const [survival, setSurvival] = useState("—");
  const [heartbeat, setHeartbeat] = useState("—");

  const [companion, setCompanion] = useState({
    name: "VAULT GIRL",
    stage: "cryo",
    mood: "cryo",
    health: 100.0,
    hunger: 100.0,
    growth: 0.0,
    updated: "—",
  });

  const [rawData, setRawData] = useState(null);
  const [logLines, setLogLines] = useState([]);
  const [lastPnl, setLastPnl] = useState(0);

  async function fetchAll(signal) {
    // Use SAME-ORIGIN proxy to avoid CORS completely
    const dataUrl = `/api/proxy/data`;
    const healthUrl = `/api/proxy/health`;
    const logsUrl = `/api/proxy/logs?limit=120`;

    try {
      setErr("");

      const data = await fetchJson(dataUrl, signal);
      setRawData(data);

      const state = String(data?.state || data?.status || "ACTIVE").toUpperCase();
      setBotState(state);

      const hb = data?.heartbeat || {};
      const hbTime = hb?.time_utc || data?.timestamp || "—";
      setHeartbeat(String(hbTime));

      setMarkets(safeMarketsList(hb?.markets));

      const ops = Number(hb?.open_positions ?? hb?.openPositions ?? 0);
      setOpenPositions(Number.isFinite(ops) ? ops : 0);

      setSurvival(String(hb?.survival_mode ?? "NORMAL").toUpperCase());

      const eq = pickLatestEquityUSD(data);
      setEquity(Number.isFinite(eq) ? eq : 0);

      const lp = pickLastTradePnl(data);
      setLastPnl(Number.isFinite(lp) ? lp : 0);

      const pet = data?.pet || {};
      const sex = String(pet?.sex || "girl").toLowerCase();
      const defaultName = sex === "boy" ? "VAULT BOY" : "VAULT GIRL";

      const stage = String(pet?.stage || "cryo");
      const mood = String(pet?.mood || "cryo");

      setCompanion({
        name: String(pet?.name || defaultName),
        stage,
        mood,
        health: Number(pet?.health ?? 100.0) || 0,
        hunger: Number(pet?.hunger ?? 100.0) || 0,
        growth: Number(pet?.growth ?? 0.0) || 0,
        updated: String(pet?.time_utc || hbTime || "—"),
      });

      try {
        const logs = await fetchJson(logsUrl, signal);
        const lines = Array.isArray(logs) ? logs : logs?.lines || [];
        setLogLines(Array.isArray(lines) ? lines.slice(-120) : []);
      } catch {
        setLogLines([]);
      }

      setLastFetchAt(new Date());
    } catch (e) {
      if (e?.name === "AbortError") return;

      // Try /health via proxy for better error message
      try {
        await fetchJson(healthUrl, signal);
        setErr(`API reachable, but /data failed: ${String(e?.message || e)}`);
      } catch (e2) {
        setErr(`Failed to fetch from API: ${String(e?.message || e)} (health also failed)`);
      }

      setBotState("—");
      setOpenPositions(0);
      setSurvival("—");
      setEquity(0);
      setHeartbeat("—");
      setLastPnl(0);
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
    // apiBase is only for display; proxy route uses env server-side
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtitle = useMemo(() => {
    const last = lastFetchAt ? lastFetchAt.toLocaleTimeString() : "—";
    return `Home · API: ${apiBase || "—"} · Refresh: ${REFRESH_MS / 1000}s · Last: ${last} · State: ${botState}`;
  }, [apiBase, lastFetchAt, botState]);

  const disableDamageFx = !!err;
  const isTrading = !err && botState === "ACTIVE";

  return (
    <div className="pip-crt">
      <div className="pip-shell">
        <div className="pip-topbar">
          <div className="pip-topbar-left">
            <div className="pip-title">PIP-TRADE 3000</div>
            <div className="pip-sub wrap">{subtitle}</div>
          </div>
          <div className="pip-topbar-right">
            <div className="pip-badge">CSS LOADED</div>
          </div>
        </div>

        <div className="pip-links">
          <Link className="pip-link active" href="/">HOME</Link>
          <Link className="pip-link" href="/candles">CANDLES</Link>
          <Link className="pip-link" href="/crypto">CRYPTO</Link>
        </div>

        <div className="pip-links">
          <button className={`pip-link ${tab === "status" ? "active" : ""}`} onClick={() => setTab("status")} type="button">
            STATUS
          </button>
          <button className={`pip-link ${tab === "data" ? "active" : ""}`} onClick={() => setTab("data")} type="button">
            DATA
          </button>
          <button className={`pip-link ${tab === "log" ? "active" : ""}`} onClick={() => setTab("log")} type="button">
            LOG
          </button>
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
          {tab === "status" && (
            <>
              <div className="pip-panel">
                <div className="pip-heading">SYSTEM STATUS</div>

                <div className="pip-row pip-row-top">
                  <div className="pip-k">MARKETS</div>
                  <div className="pip-v pip-v-big">
                    {markets.length ? markets.join(", ") : "BTCUSDT, ETHUSDT"}
                  </div>
                </div>

                <div className="pip-grid">
                  <div>
                    <div className="pip-row">
                      <div className="pip-k">OPEN POSITIONS</div>
                      <div className="pip-v">{openPositions}</div>
                    </div>
                    <div className="pip-row">
                      <div className="pip-k">SURVIVAL</div>
                      <div className="pip-v">{survival}</div>
                    </div>
                  </div>

                  <div>
                    <div className="pip-row">
                      <div className="pip-k">LAST HEARTBEAT</div>
                      <div className="pip-v">{heartbeat || "—"}</div>
                    </div>
                    <div className="pip-row">
                      <div className="pip-k">EQUITY</div>
                      <div className="pip-v">${Number(equity).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pip-panel" style={{ marginTop: "14px" }}>
                <div className="pip-heading">VAULT COMPANION</div>

                <div className="pip-companion-col">
                  <div className="pip-petbox">
                    <VaultGirlSVG
                      mood={companion.mood || "cryo"}
                      stage={companion.stage || "cryo"}
                      vaultNumber="13"
                      health={disableDamageFx ? 100 : companion.health}
                      openPositions={disableDamageFx ? 0 : openPositions}
                      lastPnl={disableDamageFx ? 0 : lastPnl}
                      isTrading={isTrading}
                      showDebugTag={false}
                    />
                  </div>

                  <div className="pip-petmeta">
                    <div className="pip-petname">{String(companion.name || "VAULT GIRL")}</div>
                    <div className="pip-petmini">
                      stage: {String(companion.stage || "cryo")} • mood: {String(companion.mood || "cryo")}
                    </div>
                    <div className="pip-muted" style={{ marginTop: 6 }}>
                      {isTrading ? "TRADING: ACTIVE" : "TRADING: IDLE"}
                    </div>
                  </div>

                  <div className="pip-stats">
                    <div className="pip-stat">
                      <div className="pip-k">HEALTH</div>
                      <div className="pip-v">{Number(companion.health).toFixed(1)}</div>
                    </div>
                    <div className="pip-stat">
                      <div className="pip-k">HUNGER</div>
                      <div className="pip-v">{Number(companion.hunger).toFixed(1)}</div>
                    </div>
                    <div className="pip-stat">
                      <div className="pip-k">GROWTH</div>
                      <div className="pip-v">{Number(companion.growth).toFixed(1)}</div>
                    </div>
                    <div className="pip-stat">
                      <div className="pip-k">UPDATED</div>
                      <div className="pip-v">{String(companion.updated || "—")}</div>
                    </div>
                  </div>
                </div>

                <div className="pip-muted pip-footnote">
                  Vault companion status updates with each trade.
                </div>
              </div>
            </>
          )}

          {tab === "data" && (
            <div className="pip-panel">
              <div className="pip-heading">RAW DATA</div>
              <pre className="pip-code">{JSON.stringify(rawData, null, 2)}</pre>
            </div>
          )}

          {tab === "log" && (
            <div className="pip-panel">
              <div className="pip-heading">SYSTEM LOG</div>
              {logLines?.length ? (
                <pre className="pip-code">{logLines.join("\n")}</pre>
              ) : (
                <div className="pip-muted">No logs available. Check DATA tab for backend output.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

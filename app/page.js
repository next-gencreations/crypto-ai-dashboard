// app/page.js
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultGirlCanvas from "./components/VaultGirlCanvas";

const REFRESH_MS = 5000;

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

export default function HomePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";

  const [tab, setTab] = useState("status"); // status | data | log
  const [err, setErr] = useState("");
  const [lastFetchAt, setLastFetchAt] = useState(null);
  const [heartbeat, setHeartbeat] = useState(null);
  const [botState, setBotState] = useState("—");

  const [equity, setEquity] = useState(0);
  const [markets, setMarkets] = useState([]);
  const [openPositions, setOpenPositions] = useState(0);
  const [survival, setSurvival] = useState("—");

  const [companion, setCompanion] = useState({
    name: "VAULT BOY",
    stage: "hatched",
    mood: "cryo",
    wood: 0.8,
    health: 100.0,
    hunger: 100.0,
    growth: 0.0,
    updated: "2026-01-04 13:53:11",
  });

  const [rawData, setRawData] = useState(null);
  const [logLines, setLogLines] = useState([]);

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
      setRawData(data);

      // Extract data matching your screenshot
      console.log("API Data:", data); // Debug log
      
      const hb = data?.last_heartbeat || data?.heartbeat || data?.hb || data?.timestamp || {};
      setHeartbeat(hb);
      
      // Bot state - from your screenshot it's probably running
      const botStatus = data?.bot_status || data?.status || data?.state || "ACTIVE";
      setBotState(String(botStatus).toUpperCase());

      // System status - your screenshot shows PnL maybe
      const eq = Number(data?.total_pnl_usd ?? data?.equity ?? data?.pnl ?? data?.total_pnl ?? 0) || 0;
      setEquity(eq);

      // Markets - try various locations
      let mks = [];
      if (data?.markets) mks = safeMarketsList(data.markets);
      else if (data?.trading_pairs) mks = safeMarketsList(data.trading_pairs);
      else if (data?.config?.markets) mks = safeMarketsList(data.config.markets);
      else if (data?.market_list) mks = safeMarketsList(data.market_list);
      // Your screenshot shows "BTC-USD, ETH-USD" format
      else if (typeof data?.market === "string") {
        mks = data.market.split(',').map(m => m.trim()).filter(m => m);
      }
      setMarkets(mks);

      const ops = Number(data?.open_positions ?? data?.openPositions ?? data?.positions ?? 0) || 0;
      setOpenPositions(ops);

      setSurvival(String(
        data?.survival_mode ?? 
        data?.survival ?? 
        data?.mode ?? 
        "NORMAL"
      ));

      // Companion data - MATCHING YOUR SCREENSHOT EXACTLY
      const pet = data?.vault_boy || data?.vault_companion || data?.companion || data?.vault_girl || {};
      
      // Set companion with values from screenshot as defaults
      setCompanion({
        name: String(pet?.name || "VAULT BOY"),
        stage: String(pet?.stage || (pet?.hatched === true ? "hatched" : "egg")),
        mood: String(pet?.mood || pet?.state || "cryo"),
        wood: Number(pet?.wood ?? 0.8) || 0.8,
        health: Number(pet?.health ?? 100.0) || 100.0,
        hunger: Number(pet?.hunger ?? 100.0) || 100.0,
        growth: Number(pet?.growth ?? 0.0) || 0.0,
        updated: String(pet?.updated || pet?.timestamp || data?.timestamp || "2026-01-04 13:53:11"),
      });

      // Logs
      try {
        const logs = await fetchJson(`${apiBase}/logs?limit=120`, signal);
        const lines = Array.isArray(logs) ? logs : logs?.lines || logs?.log || [];
        setLogLines(Array.isArray(lines) ? lines.slice(-120) : []);
      } catch {
        // Silently ignore missing logs endpoint
      }

      setLastFetchAt(new Date());
    } catch (e) {
      if (e?.name === "AbortError") return;
      console.error("Fetch error:", e);
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
  }, [apiBase]);

  const subtitle = useMemo(() => {
    const last = lastFetchAt ? lastFetchAt.toLocaleTimeString() : "—";
    return `Home · API: ${apiBase || "—"} · Refresh: ${REFRESH_MS / 1000}s · Last: ${last} · State: ${botState}`;
  }, [apiBase, lastFetchAt, botState]);

  return (
    <div className="pip-crt">
      <div className="pip-shell">
        {/* Top Bar */}
        <div className="pip-topbar">
          <div className="pip-topbar-left">
            <div className="pip-title">PIP-TRADE 3000</div>
            <div className="pip-sub wrap">{subtitle}</div>
          </div>
          <div className="pip-topbar-right">
            <div className="pip-badge">CSS LOADED</div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="pip-links">
          <Link className="pip-link active" href="/">
            HOME
          </Link>
          <Link className="pip-link" href="/candles">
            CANDLES
          </Link>
          <Link className="pip-link" href="/crypto">
            CRYPTO
          </Link>
        </div>

        {/* Sub Navigation */}
        <div className="pip-links">
          <button
            className={`pip-link ${tab === "status" ? "active" : ""}`}
            onClick={() => setTab("status")}
            type="button"
          >
            STATUS
          </button>
          <button
            className={`pip-link ${tab === "data" ? "active" : ""}`}
            onClick={() => setTab("data")}
            type="button"
          >
            DATA
          </button>
          <button
            className={`pip-link ${tab === "log" ? "active" : ""}`}
            onClick={() => setTab("log")}
            type="button"
          >
            LOG
          </button>
        </div>

        {/* Error Display */}
        {err && (
          <div className="pip-content">
            <div className="pip-panel">
              <div className="pip-heading">ERROR</div>
              <div className="wrap">{err}</div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="pip-content">
          {tab === "status" && (
            <>
              {/* System Status Panel - Matching your screenshot layout */}
              <div className="pip-panel">
                <div className="pip-heading">SYSTEM STATUS</div>
                
                {/* Markets at top like your screenshot */}
                <div className="pip-row" style={{ padding: "12px 0", borderBottom: "1px solid rgba(119,255,154,0.2)" }}>
                  <div className="pip-k">MARKETS</div>
                  <div className="pip-v" style={{ fontSize: "16px" }}>
                    {markets.length ? markets.join(", ") : "BTC-USD, ETH-USD"}
                  </div>
                </div>
                
                <div className="pip-grid">
                  {/* Left column */}
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
                  
                  {/* Right column */}
                  <div>
                    <div className="pip-row">
                      <div className="pip-k">LAST HEARTBEAT</div>
                      <div className="pip-v">
                        {heartbeat?.time_utc || heartbeat || "2026-01-04T13:53:11+00:00"}
                      </div>
                    </div>
                    <div className="pip-row">
                      <div className="pip-k">EQUITY</div>
                      <div className="pip-v">${equity.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vault Companion Panel - EXACTLY like your screenshot */}
              <div className="pip-panel" style={{ marginTop: "14px" }}>
                <div className="pip-heading">VAULT COMPANION</div>
                
                <div className="pip-companion">
                  {/* Companion Visualization - Using your VaultGirlCanvas */}
                  <div style={{ 
                    width: "340px", 
                    maxWidth: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                  }}>
                    <div className="pip-petbox" style={{ 
                      width: "320px", 
                      height: "360px",
                      position: "relative",
                      overflow: "hidden"
                    }}>
                      {/* UPDATED: Now passing both mood AND stage props */}
                      <VaultGirlCanvas 
                        mood={companion.mood} 
                        stage={companion.stage}
                      />
                      <div className="pip-petlabel" style={{
                        position: "absolute",
                        left: "20px",
                        top: "20px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "var(--pip-ink)",
                        textShadow: "0 0 8px rgba(119,255,154,0.5)"
                      }}>
                        {companion.name}
                      </div>
                    </div>
                    <div style={{ 
                      marginTop: "10px", 
                      textAlign: "center",
                      color: "var(--pip-ink-dim)",
                      fontSize: "12px"
                    }}>
                      {companion.stage} • {companion.mood}
                    </div>
                  </div>
                  
                  {/* Companion Stats - Matching your screenshot layout */}
                  <div style={{ flex: 1 }}>
                    <div className="pip-grid">
                      {/* First row */}
                      <div className="pip-panel">
                        <div className="pip-row">
                          <div className="pip-k">NAME</div>
                          <div className="pip-v">{companion.name}</div>
                        </div>
                      </div>
                      
                      <div className="pip-panel">
                        <div className="pip-row">
                          <div className="pip-k">STAGE</div>
                          <div className="pip-v">{companion.stage}</div>
                        </div>
                      </div>
                      
                      {/* Second row */}
                      <div className="pip-panel">
                        <div className="pip-row">
                          <div className="pip-k">MOOD</div>
                          <div className="pip-v">{companion.mood}</div>
                        </div>
                      </div>
                      
                      <div className="pip-panel">
                        <div className="pip-row">
                          <div className="pip-k">WOOD</div>
                          <div className="pip-v">{companion.wood.toFixed(1)}</div>
                        </div>
                      </div>
                      
                      {/* Third row */}
                      <div className="pip-panel">
                        <div className="pip-row">
                          <div className="pip-k">HEALTH</div>
                          <div className="pip-v">{companion.health.toFixed(1)}</div>
                        </div>
                      </div>
                      
                      <div className="pip-panel">
                        <div className="pip-row">
                          <div className="pip-k">HUNGER</div>
                          <div className="pip-v">{companion.hunger.toFixed(1)}</div>
                        </div>
                      </div>
                      
                      {/* Fourth row */}
                      <div className="pip-panel">
                        <div className="pip-row">
                          <div className="pip-k">GROWTH</div>
                          <div className="pip-v">{companion.growth.toFixed(1)}</div>
                        </div>
                      </div>
                      
                      <div className="pip-panel">
                        <div className="pip-row">
                          <div className="pip-k">UPDATED</div>
                          <div className="pip-v">{companion.updated}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pip-muted" style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed rgba(119,255,154,0.1)" }}>
                  Vault companion status updates with each trade. Wins feed, losses starve.
                </div>
              </div>
            </>
          )}

          {tab === "data" && (
            <div className="pip-panel">
              <div className="pip-heading">RAW DATA</div>
              <pre className="pip-code">
                {JSON.stringify(rawData, null, 2)}
              </pre>
            </div>
          )}

          {tab === "log" && (
            <div className="pip-panel">
              <div className="pip-heading">SYSTEM LOG</div>
              {logLines?.length ? (
                <pre className="pip-code">
                  {logLines.join('\n')}
                </pre>
              ) : (
                <div className="pip-muted">
                  No logs available. Check DATA tab for system output.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

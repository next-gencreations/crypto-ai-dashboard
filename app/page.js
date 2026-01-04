// app/page.js
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultGirlCanvas from "./components/VaultGirlCanvas";

const REFRESH_MS = 5000;

function safeArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    // Try JSON array first, else split by comma
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return val
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function toNum(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function toText(x, fallback = "—") {
  if (x === null || x === undefined) return fallback;
  if (typeof x === "string") return x;
  if (typeof x === "number") return String(x);
  // if object, try common fields
  if (typeof x === "object") {
    return (
      x.time_utc ||
      x.timestamp ||
      x.time ||
      x.last ||
      x.value ||
      fallback
    );
  }
  return fallback;
}

export default function HomePage() {
  const apiBase =
    (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  const [tab, setTab] = useState("status"); // status | data | log
  const [err, setErr] = useState("");
  const [lastFetchAt, setLastFetchAt] = useState(null);
  const [botState, setBotState] = useState("—");

  const [equity, setEquity] = useState(0);
  const [markets, setMarkets] = useState(["BTC-USD", "ETH-USD"]);
  const [openPositions, setOpenPositions] = useState(0);
  const [survival, setSurvival] = useState("NORMAL");
  const [heartbeat, setHeartbeat] = useState("—");

  // Default to VAULT GIRL so it never “falls back” to boy
  const [companion, setCompanion] = useState({
    name: "VAULT GIRL",
    stage: "egg",
    mood: "cryo",
    health: 100.0,
    hunger: 100.0,
    growth: 0.0,
    updated: "—",
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

      // Bot state
      const status = data?.bot_status || data?.status || data?.state || "ACTIVE";
      setBotState(String(status).toUpperCase());

      // System status
      const eq = toNum(
        data?.total_pnl_usd ??
          data?.equity ??
          data?.pnl ??
          data?.total_pnl ??
          0,
        0
      );
      setEquity(eq);

      // Markets
      const mks =
        safeArray(data?.markets) ||
        safeArray(data?.trading_pairs) ||
        safeArray(data?.config?.markets) ||
        safeArray(data?.market_list) ||
        [];
      if (mks.length) setMarkets(mks);

      // Open positions
      const ops = toNum(
        data?.open_positions ?? data?.openPositions ?? data?.positions ?? 0,
        0
      );
      setOpenPositions(ops);

      // Survival
      const surv = data?.survival_mode ?? data?.survival ?? data?.mode ?? "NORMAL";
      setSurvival(String(surv).toUpperCase());

      // Heartbeat (avoid [object Object])
      const hb =
        data?.last_heartbeat ||
        data?.heartbeat ||
        data?.hb ||
        data?.timestamp ||
        "—";
      setHeartbeat(toText(hb, "—"));

      // Companion: prefer vault_girl first, then others
      const pet =
        data?.vault_girl ||
        data?.vault_companion ||
        data?.companion ||
        data?.vault_boy ||
        {};

      setCompanion((prev) => ({
        name: String(pet?.name || prev.name || "VAULT GIRL"),
        stage: String(pet?.stage || (pet?.hatched ? "hatched" : prev.stage || "egg")),
        mood: String(pet?.mood || pet?.state || prev.mood || "neutral"),
        health: toNum(pet?.health, prev.health ?? 100),
        hunger: toNum(pet?.hunger, prev.hunger ?? 100),
        growth: toNum(pet?.growth, prev.growth ?? 0),
        updated: String(
          pet?.updated || pet?.timestamp || data?.timestamp || prev.updated || "—"
        ),
      }));

      // Logs (optional endpoint)
      try {
        const logs = await fetchJson(`${apiBase}/logs?limit=120`, signal);
        const lines = Array.isArray(logs)
          ? logs
          : logs?.lines || logs?.log || [];
        setLogLines(Array.isArray(lines) ? lines.slice(-120) : []);
      } catch {
        // ignore missing logs
      }

      setLastFetchAt(new Date());
    } catch (e) {
      if (e?.name === "AbortError") return;
      setErr(String(e?.message || e));
    }
  }

  useEffect(() => {
    const ac = new AbortController();
    fetchAll(ac.signal);

    const timer = setInterval(() => {
      const ac2 = new AbortController();
      fetchAll(ac2.signal);
      setTimeout(() => ac2.abort(), 8000);
    }, REFRESH_MS);

    return () => {
      ac.abort();
      clearInterval(timer);
    };
  }, [apiBase]);

  const subtitle = useMemo(() => {
    const last = lastFetchAt ? lastFetchAt.toLocaleTimeString() : "—";
    return `Home · API: ${apiBase || "—"} · Refresh: ${REFRESH_MS / 1000}s · Last: ${last} · State: ${botState}`;
  }, [apiBase, lastFetchAt, botState]);

  return (
    <div className="pip-crt">
      <div className="pip-shell">
        {/* Top bar */}
        <div className="pip-topbar">
          <div className="pip-topbar-left">
            <div className="pip-title">PIP-TRADE 3000</div>
            <div className="pip-sub wrap">{subtitle}</div>
          </div>
          <div className="pip-topbar-right">
            <div className="pip-badge">CSS LOADED</div>
          </div>
        </div>

        {/* Main navigation */}
        <div className="pip-links">
          <Link className="pip-link active" href="/">HOME</Link>
          <Link className="pip-link" href="/candles">CANDLES</Link>
          <Link className="pip-link" href="/crypto">CRYPTO</Link>
        </div>

        {/* Sub navigation */}
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
              {/* SYSTEM STATUS */}
              <div className="pip-panel">
                <div className="pip-heading">SYSTEM STATUS</div>

                <div className="pip-row" style={{ padding: "12px 0", borderBottom: "1px solid rgba(119,255,154,0.2)" }}>
                  <div className="pip-k">MARKETS</div>
                  <div className="pip-v" style={{ fontSize: "16px" }}>
                    {markets.length ? markets.join(", ") : "BTC-USD, ETH-USD"}
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
                      <div className="pip-v">{heartbeat}</div>
                    </div>
                    <div className="pip-row">
                      <div className="pip-k">EQUITY</div>
                      <div className="pip-v">${toNum(equity, 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* VAULT COMPANION */}
              <div className="pip-panel" style={{ marginTop: "14px" }}>
                <div className="pip-heading">VAULT COMPANION</div>

                <div className="pip-companion">
                  {/* LEFT: Canvas box */}
                  <div style={{ width: "340px", maxWidth: "100%" }}>
                    <div
                      className="pip-petbox"
                      style={{
                        width: "320px",
                        height: "360px",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <VaultGirlCanvas mood={companion.mood} stage={companion.stage} />

                      {/* Only ONE title — prevents VAULT BOY/GIRL overlap */}
                      <div
                        className="pip-petlabel"
                        style={{
                          position: "absolute",
                          left: "18px",
                          top: "16px",
                          fontSize: "14px",
                          fontWeight: "bold",
                          color: "var(--pip-ink)",
                          textShadow: "0 0 8px rgba(119,255,154,0.5)",
                        }}
                      >
                        {companion.name}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "10px",
                        textAlign: "center",
                        color: "var(--pip-ink-dim)",
                        fontSize: "12px",
                      }}
                    >
                      {companion.stage} • {companion.mood}
                    </div>
                  </div>

                  {/* RIGHT: Stats */}
                  <div style={{ flex: 1 }}>
                    <div className="pip-grid">
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

                      <div className="pip-panel">
                        <div className="pip-row">
                          <div className="pip-k">MOOD</div>
                          <div className="pip-v">{companion.mood}</div>
                        </div>
                      </div>

                      <div className="pip-panel">
                        <div className="pip-row">
                          <div className="pip-k">HEALTH</div>
                          <div className="pip-v">{toNum(companion.health, 0).toFixed(1)}</div>
                        </div>
                      </div>

                      <div className="pip-panel">
                        <div className="pip-row">
                          <div className="pip-k">HUNGER</div>
                          <div className="pip-v">{toNum(companion.hunger, 0).toFixed(1)}</div>
                        </div>
                      </div>

                      <div className="pip-panel">
                        <div className="pip-row">
                          <div className="pip-k">GROWTH</div>
                          <div className="pip-v">{toNum(companion.growth, 0).toFixed(1)}</div>
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

                <div
                  className="pip-muted"
                  style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px dashed rgba(119,255,154,0.1)",
                  }}
                >
                  Vault companion updates with each trade.
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

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
    name: "VAULT GIRL",
    stage: "egg",
    mood: "neutral",
    health: 0,
    hunger: 0,
    growth: 0,
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

      const hb = data?.heartbeat || {};
      setHeartbeat(hb);
      setBotState(String(hb?.state || data?.state || "ACTIVE"));

      // System status
      const eq = Number(data?.equity ?? data?.account?.equity ?? 0) || 0;
      setEquity(eq);

      const mks = safeMarketsList(hb?.markets ?? data?.markets ?? []);
      setMarkets(mks);

      const ops = Number(data?.open_positions ?? data?.openPositions ?? 0) || 0;
      setOpenPositions(ops);

      setSurvival(String(data?.survival ?? data?.status ?? "NORMAL"));

      // Companion
      const pet = data?.vault_companion || data?.companion || {};
      setCompanion({
        name: String(pet?.name || "VAULT GIRL"),
        stage: String(pet?.stage || "egg"),
        mood: String(pet?.mood || "neutral"),
        health: Number(pet?.health ?? 0) || 0,
        hunger: Number(pet?.hunger ?? 0) || 0,
        growth: Number(pet?.growth ?? 0) || 0,
        updated: String(pet?.updated || pet?.time_utc || hb?.time_utc || "—"),
      });

      // Logs (optional endpoint)
      try {
        const logs = await fetchJson(`${apiBase}/logs?limit=120`, signal);
        const lines = Array.isArray(logs) ? logs : logs?.lines || logs?.log || [];
        setLogLines(Array.isArray(lines) ? lines.slice(-120) : []);
      } catch {
        // If /logs doesn't exist, silently ignore
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
  }, [apiBase]);

  const subtitle = useMemo(() => {
    const last = lastFetchAt ? lastFetchAt.toLocaleTimeString() : "—";
    return `Home · API: ${apiBase || "—"} · Refresh: ${REFRESH_MS / 1000}s · Last: ${last} · State: ${botState}`;
  }, [apiBase, lastFetchAt, botState]);

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

        {/* Sub tabs */}
        <div className="pip-links" style={{ marginTop: 10 }}>
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
              <div className="pip-panel">
                <div className="pip-heading">SYSTEM STATUS</div>

                <div className="pip-grid2">
                  <div className="pip-k">EQUITY</div>
                  <div className="pip-v">${Number(equity).toFixed(2)}</div>

                  <div className="pip-k">MARKETS</div>
                  <div className="pip-v">{markets.length ? markets.join(", ") : "—"}</div>

                  <div className="pip-k">OPEN POSITIONS</div>
                  <div className="pip-v">{openPositions}</div>

                  <div className="pip-k">SURVIVAL</div>
                  <div className="pip-v">{survival}</div>

                  <div className="pip-k">LAST HEARTBEAT</div>
                  <div className="pip-v">{heartbeat?.time_utc || "—"}</div>
                </div>
              </div>

              <div className="pip-panel" style={{ marginTop: 14 }}>
                <div className="pip-heading">VAULT COMPANION</div>

                <div className="pip-row" style={{ gap: 14, alignItems: "stretch", flexWrap: "wrap" }}>
                  {/* Mascot */}
                  <div style={{ width: 340, maxWidth: "100%" }}>
                    <VaultGirlCanvas mood={companion.mood} />
                  </div>

                  {/* Stats */}
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div className="pip-grid2">
                      <div className="pip-k">NAME</div>
                      <div className="pip-v">{companion.name}</div>

                      <div className="pip-k">STAGE</div>
                      <div className="pip-v">{companion.stage}</div>

                      <div className="pip-k">MOOD</div>
                      <div className="pip-v">{companion.mood}</div>

                      <div className="pip-k">HEALTH</div>
                      <div className="pip-v">{Number(companion.health).toFixed(1)}</div>

                      <div className="pip-k">HUNGER</div>
                      <div className="pip-v">{Number(companion.hunger).toFixed(1)}</div>

                      <div className="pip-k">GROWTH</div>
                      <div className="pip-v">{Number(companion.growth).toFixed(1)}</div>

                      <div className="pip-k">UPDATED</div>
                      <div className="pip-v">{companion.updated}</div>
                    </div>
                  </div>
                </div>

                <div className="pip-muted" style={{ marginTop: 10 }}>
                  (Vault Girl is drawn on a canvas so we can improve the look + add walking animation next.)
                </div>
              </div>
            </>
          )}

          {tab === "data" && (
            <div className="pip-panel">
              <div className="pip-heading">RAW DATA</div>
              <pre className="pip-pre">{JSON.stringify(rawData, null, 2)}</pre>
            </div>
          )}

          {tab === "log" && (
            <div className="pip-panel">
              <div className="pip-heading">LOG</div>
              {logLines?.length ? (
                <pre className="pip-pre">{logLines.join("\n")}</pre>
              ) : (
                <div className="pip-muted">
                  No /logs endpoint found (or no logs returned). If your API has logs in /data, switch to the DATA tab.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

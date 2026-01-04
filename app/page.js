"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const REFRESH_MS = 5000;

function safeJsonStringify(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
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

function VaultMascot({ mood = "neutral", sex = "girl" }) {
  const label = sex === "boy" ? "VAULT BOY" : "VAULT GIRL";

  const isPanic = mood === "panic";
  const isSick = mood === "sick";
  const isCryo = mood === "cryo";
  const isHappy = mood === "happy" || mood === "neutral";

  const animClass = isPanic ? "pip-shake" : isHappy ? "pip-walk" : "pip-bob";
  const statusText = isPanic ? "PANIC" : isSick ? "SICK" : isCryo ? "CRYO" : "OK";

  const face =
    isPanic
      ? { mouth: "M118 92 Q130 104 142 92", browL: "M112 72 Q120 62 128 72", browR: "M132 72 Q140 62 148 72" }
      : isSick
      ? { mouth: "M118 95 Q130 88 142 95", browL: "M112 70 Q120 68 128 70", browR: "M132 70 Q140 68 148 70" }
      : isCryo
      ? { mouth: "M118 96 Q130 100 142 96", browL: "M112 70 Q120 66 128 70", browR: "M132 70 Q140 66 148 70" }
      : { mouth: "M118 92 Q130 102 142 92", browL: "M112 70 Q120 64 128 70", browR: "M132 70 Q140 64 148 70" };

  const isGirl = sex !== "boy";

  return (
    <div className={`pip-petbox ${animClass}`} aria-label={label} style={{ width: "100%", maxWidth: 320 }}>
      <svg viewBox="0 0 260 260" width="100%" height="100%">
        <rect x="10" y="10" width="240" height="240" rx="18" fill="rgba(0,0,0,0.25)" stroke="var(--pip-border)" />
        <rect x="14" y="14" width="232" height="232" rx="16" fill="rgba(0,0,0,0.12)" />

        <g className="pip-mascot" transform="translate(0,0)">
          {/* head */}
          <circle cx="130" cy="76" r="28" fill="rgba(119,255,154,0.08)" stroke="var(--pip-ink)" strokeWidth="2" />

          {/* hair */}
          {isGirl ? (
            <>
              <path
                d="M104 74
                   Q110 48 130 48
                   Q150 48 156 70
                   Q158 82 152 92
                   Q140 106 130 104
                   Q120 106 108 94
                   Q102 86 104 74 Z"
                fill="rgba(119,255,154,0.14)"
                stroke="var(--pip-ink)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M110 64 Q122 54 136 56 Q146 58 150 66 Q140 62 130 64 Q120 66 110 64 Z"
                fill="rgba(119,255,154,0.10)"
                stroke="var(--pip-ink)"
                strokeWidth="2"
                opacity="0.9"
              />
            </>
          ) : (
            <path
              d="M106 74 Q112 52 130 54 Q150 52 156 72 Q146 62 136 64 Q130 62 124 66 Q114 64 106 74"
              fill="rgba(119,255,154,0.14)"
              stroke="var(--pip-ink)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          )}

          {/* eyes */}
          <circle cx="121" cy="78" r="3" fill="var(--pip-ink)" opacity="0.9" />
          <circle cx="139" cy="78" r="3" fill="var(--pip-ink)" opacity="0.9" />

          {/* brows + mouth */}
          <path d={face.browL} fill="none" stroke="var(--pip-ink)" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          <path d={face.browR} fill="none" stroke="var(--pip-ink)" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          <path d={face.mouth} fill="none" stroke="var(--pip-ink)" strokeWidth="2" strokeLinecap="round" opacity="0.9" />

          {/* body */}
          <path
            d="M108 104
               Q130 94 152 104
               Q166 114 168 134
               L168 156
               Q168 176 152 186
               Q130 196 108 186
               Q92 176 92 156
               L92 134
               Q94 114 108 104 Z"
            fill="rgba(119,255,154,0.08)"
            stroke="var(--pip-ink)"
            strokeWidth="2"
          />

          {/* zipper */}
          <path d="M130 104 L130 192" stroke="var(--pip-ink)" strokeWidth="2" opacity="0.35" />
          <path d="M112 112 Q130 124 148 112" fill="none" stroke="var(--pip-ink)" strokeWidth="2" opacity="0.55" />

          {/* arms */}
          <g className="pip-arm pip-arm-left">
            <path
              d="M94 138 Q76 142 72 156 Q70 164 76 170 Q86 174 98 166"
              fill="rgba(119,255,154,0.08)"
              stroke="var(--pip-ink)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="76" cy="170" r="6" fill="rgba(119,255,154,0.08)" stroke="var(--pip-ink)" strokeWidth="2" />
          </g>

          <g className="pip-arm pip-arm-right">
            <path
              d="M166 140 Q184 146 190 160 Q192 168 186 172 Q176 176 164 168"
              fill="rgba(119,255,154,0.08)"
              stroke="var(--pip-ink)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="186" cy="172" r="6" fill="rgba(119,255,154,0.08)" stroke="var(--pip-ink)" strokeWidth="2" />
          </g>

          {/* legs */}
          <g className="pip-leg pip-leg-left">
            <path
              d="M120 186
                 Q112 204 114 218
                 Q116 234 128 236
                 Q136 236 134 226
                 Q132 216 134 202
                 Q136 192 136 186 Z"
              fill="rgba(119,255,154,0.08)"
              stroke="var(--pip-ink)"
              strokeWidth="2"
            />
            <path d="M114 236 Q128 246 144 236" fill="none" stroke="var(--pip-ink)" strokeWidth="2" opacity="0.85" />
          </g>

          <g className="pip-leg pip-leg-right">
            <path
              d="M140 186
                 Q154 204 154 218
                 Q154 234 142 236
                 Q134 236 136 226
                 Q140 214 136 202
                 Q132 192 132 186 Z"
              fill="rgba(119,255,154,0.08)"
              stroke="var(--pip-ink)"
              strokeWidth="2"
            />
            <path d="M116 236 Q132 246 146 236" fill="none" stroke="var(--pip-ink)" strokeWidth="2" opacity="0.85" />
          </g>

          {/* patch */}
          <circle cx="154" cy="150" r="9" fill="rgba(0,0,0,0.18)" stroke="var(--pip-ink)" strokeWidth="2" opacity="0.9" />
          <text x="154" y="154" textAnchor="middle" fontSize="9" fill="var(--pip-ink)" opacity="0.9">
            3000
          </text>
        </g>

        {/* top label */}
        <text x="24" y="40" fontSize="16" fill="var(--pip-ink)" opacity="0.9">
          {label}
        </text>

        {/* status strip */}
        <g opacity="0.9">
          <rect x="24" y="214" width="212" height="22" rx="10" fill="rgba(0,0,0,0.25)" stroke="var(--pip-border)" />
          <text x="36" y="230" fontSize="12" fill="var(--pip-ink)" opacity="0.9">
            STATUS: {statusText}
          </text>
        </g>
      </svg>
    </div>
  );
}

export default function HomePage() {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  const [tab, setTab] = useState("STATUS"); // STATUS | DATA | LOG
  const [err, setErr] = useState("");
  const [lastFetchAt, setLastFetchAt] = useState(null);

  const [data, setData] = useState(null);
  const [logs, setLogs] = useState("");
  const [stateLabel, setStateLabel] = useState("—");

  // Derived (safe defaults)
  const hb = data?.heartbeat || {};
  const eq = data?.equity_usd ?? data?.equity ?? hb?.equity_usd ?? 0;
  const markets = safeMarketsList(hb?.markets);
  const openPositions = data?.open_positions ?? hb?.open_positions ?? 0;

  const survival =
    data?.survival ||
    hb?.survival ||
    (eq <= 0 ? "STARVING" : "NORMAL");

  const lastHeartbeat = hb?.time_utc || hb?.last_heartbeat || data?.last_heartbeat || "—";

  const companion = data?.vault_companion || data?.companion || {};
  const name = (companion?.name || "VAULT GIRL").toString().toUpperCase();
  const stage = (companion?.stage || "egg").toString();
  const mood = (companion?.mood || survival?.toLowerCase?.() || "neutral").toString().toLowerCase();

  const health = Number(companion?.health ?? 0);
  const hunger = Number(companion?.hunger ?? 0);
  const growth = Number(companion?.growth ?? 0);
  const updated = companion?.updated || companion?.time_utc || "—";

  const headerLine = useMemo(() => {
    return `Home · API: ${apiBase || "—"} · Refresh: ${REFRESH_MS / 1000}s · Last: ${
      lastFetchAt ? lastFetchAt.toLocaleTimeString() : "—"
    } · State: ${stateLabel}`;
  }, [apiBase, lastFetchAt, stateLabel]);

  async function fetchJson(url, signal) {
    const res = await fetch(url, { cache: "no-store", signal });
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    return res.json();
  }

  async function fetchText(url, signal) {
    const res = await fetch(url, { cache: "no-store", signal });
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    return res.text();
  }

  async function fetchAll(signal) {
    if (!apiBase) {
      setErr("Missing NEXT_PUBLIC_API_URL in Vercel environment variables.");
      return;
    }

    try {
      setErr("");

      // Main data
      const d = await fetchJson(`${apiBase}/data`, signal);
      setData(d);

      // Optional log (won’t break if endpoint missing)
      try {
        const txt = await fetchText(`${apiBase}/log?limit=200`, signal);
        setLogs(txt);
      } catch {
        // keep old logs or empty
      }

      // Optional state
      const s = d?.state || d?.status || d?.heartbeat?.state;
      setStateLabel(s ? String(s).toUpperCase() : "ACTIVE");

      setLastFetchAt(new Date());
    } catch (e) {
      if (e?.name === "AbortError") return;
      setErr(String(e?.message || e));
    }
  }

  async function callAction(action) {
    if (!apiBase) return;

    setErr("");
    const url = `${apiBase}/${action}`;
    try {
      // Try POST first
      let res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        // fallback to GET
        res = await fetch(url, { method: "GET" });
      }
      if (!res.ok) throw new Error(`${action.toUpperCase()} failed (${res.status})`);
      // refresh data after action
      const ac = new AbortController();
      await fetchAll(ac.signal);
    } catch (e) {
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

  return (
    <div className="pip-crt">
      <div className="pip-shell">
        <div className="pip-topbar">
          <div className="pip-topbar-left">
            <div className="pip-title">PIP-TRADE 3000</div>
            <div className="pip-sub wrap">{headerLine}</div>
          </div>
          <div className="pip-topbar-right">
            <div className="pip-muted">CSS LOADED</div>
          </div>
        </div>

        <div className="pip-links">
          <Link className="pip-link active" href="/">HOME</Link>
          <Link className="pip-link" href="/candles">CANDLES</Link>
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
          {/* Tabs + Actions */}
          <div className="pip-row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div className="pip-row" style={{ gap: 10, flexWrap: "wrap" }}>
              <button className={`pip-tab ${tab === "STATUS" ? "active" : ""}`} onClick={() => setTab("STATUS")}>
                STATUS
              </button>
              <button className={`pip-tab ${tab === "DATA" ? "active" : ""}`} onClick={() => setTab("DATA")}>
                DATA
              </button>
              <button className={`pip-tab ${tab === "LOG" ? "active" : ""}`} onClick={() => setTab("LOG")}>
                LOG
              </button>
            </div>

            <div className="pip-row" style={{ gap: 10, flexWrap: "wrap" }}>
              <button className="pip-tab" onClick={() => callAction("refresh")}>REFRESH</button>
              <button className="pip-tab" onClick={() => callAction("pause")}>PAUSE</button>
              <button className="pip-tab" onClick={() => callAction("cryo")}>CRYO</button>
              <button className="pip-tab" onClick={() => callAction("revive")}>REVIVE</button>
            </div>
          </div>

          {/* STATUS TAB */}
          {tab === "STATUS" && (
            <>
              <div className="pip-panel" style={{ marginTop: 14 }}>
                <div className="pip-heading">SYSTEM STATUS</div>

                <div className="pip-grid">
                  <div className="pip-k">EQUITY</div>
                  <div className="pip-v">{`US$${Number(eq || 0).toFixed(2)}`}</div>

                  <div className="pip-k">MARKETS</div>
                  <div className="pip-v">{markets?.length ? markets.join(", ") : "—"}</div>

                  <div className="pip-k">OPEN POSITIONS</div>
                  <div className="pip-v">{Number(openPositions || 0)}</div>

                  <div className="pip-k">SURVIVAL</div>
                  <div className="pip-v">{String(survival || "—").toUpperCase()}</div>

                  <div className="pip-k">LAST HEARTBEAT</div>
                  <div className="pip-v">{String(lastHeartbeat || "—")}</div>
                </div>
              </div>

              <div className="pip-panel" style={{ marginTop: 14 }}>
                <div className="pip-heading">VAULT COMPANION</div>

                <div className="pip-row" style={{ gap: 16, alignItems: "stretch", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 260px", minWidth: 240 }}>
                    <VaultMascot mood={mood} sex="girl" />
                  </div>

                  <div className="pip-grid" style={{ flex: "2 1 320px", minWidth: 260 }}>
                    <div className="pip-k">NAME</div>
                    <div className="pip-v">{name}</div>

                    <div className="pip-k">STAGE</div>
                    <div className="pip-v">{stage}</div>

                    <div className="pip-k">MOOD</div>
                    <div className="pip-v">{mood}</div>

                    <div className="pip-k">HEALTH</div>
                    <div className="pip-v">{Number.isFinite(health) ? health.toFixed(1) : "0.0"}</div>

                    <div className="pip-k">HUNGER</div>
                    <div className="pip-v">{Number.isFinite(hunger) ? hunger.toFixed(1) : "0.0"}</div>

                    <div className="pip-k">GROWTH</div>
                    <div className="pip-v">{Number.isFinite(growth) ? growth.toFixed(1) : "0.0"}</div>

                    <div className="pip-k">UPDATED</div>
                    <div className="pip-v">{String(updated || "—")}</div>
                  </div>
                </div>

                <div className="pip-muted" style={{ marginTop: 10 }}>
                  Vault Girl is an original SVG mascot (Fallout-inspired vibe). Mood drives animation: walk/bob/shake.
                </div>
              </div>
            </>
          )}

          {/* DATA TAB */}
          {tab === "DATA" && (
            <div className="pip-panel" style={{ marginTop: 14 }}>
              <div className="pip-heading">RAW DATA</div>
              <pre className="pip-pre">{data ? safeJsonStringify(data) : "No data yet."}</pre>
            </div>
          )}

          {/* LOG TAB */}
          {tab === "LOG" && (
            <div className="pip-panel" style={{ marginTop: 14 }}>
              <div className="pip-heading">LOG</div>
              <pre className="pip-pre">{logs ? logs : "No logs (or /log endpoint not available)."}</pre>
              <div className="pip-muted" style={{ marginTop: 10 }}>
                If you don’t have /log on the API, this panel will stay empty (that’s OK).
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

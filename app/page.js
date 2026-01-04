"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

function clamp01(x) {
  const n = Number(x);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function moodFromState(survival, moodRaw) {
  const s = String(survival || "").toLowerCase();
  const m = String(moodRaw || "").toLowerCase();
  if (m.includes("cryo")) return "cryo";
  if (m.includes("panic")) return "panic";
  if (m.includes("sick")) return "sick";
  if (m.includes("happy")) return "happy";
  if (s.includes("starv") || s.includes("sick")) return "sick";
  return "neutral";
}

function VaultDude({ mood = "neutral", sex = "boy" }) {
  const label = sex === "girl" ? "VAULT GIRL" : "VAULT BOY";

  const isWalk = mood === "happy" || mood === "neutral";
  const isPanic = mood === "panic";
  const isSick = mood === "sick";
  const isCryo = mood === "cryo";

  const animClass = isPanic ? "pip-shake" : isWalk ? "pip-walk" : "pip-bob";

  const face =
    isPanic
      ? { brows: "M70 60 Q110 45 150 60", mouth: "M90 95 Q110 110 130 95" }
      : isSick
      ? { brows: "M70 58 Q110 52 150 58", mouth: "M92 98 Q110 90 128 98" }
      : isCryo
      ? { brows: "M70 58 Q110 50 150 58", mouth: "M95 98 Q110 104 125 98" }
      : { brows: "M70 58 Q110 50 150 58", mouth: "M92 96 Q110 108 128 96" };

  const statusText = isPanic ? "PANIC" : isSick ? "SICK" : isCryo ? "CRYO" : "OK";

  return (
    <div className={`pip-petbox ${animClass}`} aria-label={label}>
      <svg viewBox="0 0 260 260" width="100%" height="100%">
        <rect x="10" y="10" width="240" height="240" rx="18" fill="rgba(0,0,0,0.25)" stroke="var(--pip-border)" />
        <rect x="14" y="14" width="232" height="232" rx="16" fill="rgba(0,0,0,0.12)" />

        <g className="pip-mascot" transform="translate(0,2)">
          <circle cx="130" cy="78" r="34" fill="rgba(119,255,154,0.10)" stroke="var(--pip-ink)" strokeWidth="2" />
          <path
            d="M102 70 Q110 48 130 50 Q150 48 158 66 Q148 58 140 60 Q130 58 122 62 Q112 60 102 70"
            fill="rgba(119,255,154,0.18)"
            stroke="var(--pip-ink)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="118" cy="82" r="3" fill="var(--pip-ink)" opacity="0.9" />
          <circle cx="142" cy="82" r="3" fill="var(--pip-ink)" opacity="0.9" />
          <path d={face.brows} fill="none" stroke="var(--pip-ink)" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          <path d={face.mouth} fill="none" stroke="var(--pip-ink)" strokeWidth="2" strokeLinecap="round" opacity="0.9" />

          <path
            d="M105 112
               Q130 98 155 112
               Q168 120 168 142
               L168 160
               Q168 175 155 182
               L105 182
               Q92 175 92 160
               L92 142
               Q92 120 105 112 Z"
            fill="rgba(119,255,154,0.10)"
            stroke="var(--pip-ink)"
            strokeWidth="2"
          />
          <line x1="130" y1="112" x2="130" y2="182" stroke="var(--pip-ink)" strokeWidth="2" opacity="0.35" />
          <path d="M112 120 Q130 134 148 120" fill="none" stroke="var(--pip-ink)" strokeWidth="2" opacity="0.55" />

          <g className="pip-arm pip-arm-left">
            <path
              d="M92 138 Q74 142 70 156 Q68 164 74 168 Q84 172 96 164"
              fill="rgba(119,255,154,0.10)"
              stroke="var(--pip-ink)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="74" cy="166" r="6" fill="rgba(119,255,154,0.10)" stroke="var(--pip-ink)" strokeWidth="2" />
          </g>

          <g className="pip-arm pip-arm-right">
            <path
              d="M168 138 Q186 142 190 156 Q192 164 186 168 Q176 172 164 164"
              fill="rgba(119,255,154,0.10)"
              stroke="var(--pip-ink)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="186" cy="166" r="6" fill="rgba(119,255,154,0.10)" stroke="var(--pip-ink)" strokeWidth="2" />
          </g>

          <g className="pip-leg pip-leg-left">
            <path
              d="M118 182 Q110 198 112 212 Q114 226 126 232 Q132 234 134 228 Q126 222 126 212 Q126 196 132 182 Z"
              fill="rgba(119,255,154,0.10)"
              stroke="var(--pip-ink)"
              strokeWidth="2"
            />
            <path d="M112 232 Q126 242 140 234" fill="none" stroke="var(--pip-ink)" strokeWidth="2" opacity="0.8" />
          </g>

          <g className="pip-leg pip-leg-right">
            <path
              d="M142 182 Q150 198 148 212 Q146 226 134 232 Q128 234 126 228 Q134 222 134 212 Q134 196 128 182 Z"
              fill="rgba(119,255,154,0.10)"
              stroke="var(--pip-ink)"
              strokeWidth="2"
            />
            <path d="M120 234 Q134 242 148 232" fill="none" stroke="var(--pip-ink)" strokeWidth="2" opacity="0.8" />
          </g>

          <circle cx="154" cy="150" r="10" fill="rgba(0,0,0,0.18)" stroke="var(--pip-ink)" strokeWidth="2" opacity="0.9" />
          <text x="154" y="154" textAnchor="middle" fontSize="10" fill="var(--pip-ink)" opacity="0.9">
            3000
          </text>
        </g>

        <text x="24" y="40" fontSize="16" fill="var(--pip-ink)" opacity="0.9">
          {label}
        </text>

        <g opacity="0.9">
          <rect x="24" y="214" width="212" height="22" rx="10" fill="rgba(0,0,0,0.25)" stroke="var(--pip-border)" />
          <text x="36" y="230" fontSize="12" fill="var(--pip-ink)" opacity="0.9">
            STATUS: {statusText}
          </text>
        </g>
      </svg>

      <div className="pip-petlabel">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";

  const [err, setErr] = useState("");
  const [lastFetchAt, setLastFetchAt] = useState(null);

  const [tab, setTab] = useState("status"); // status | data | log

  const [heartbeat, setHeartbeat] = useState(null);
  const [companion, setCompanion] = useState(null);
  const [events, setEvents] = useState([]);

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

      setHeartbeat(data?.heartbeat || null);
      setCompanion(data?.companion || data?.pet || null);
      setEvents(Array.isArray(data?.events) ? data.events : []);
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

  const equity = heartbeat?.equity_usd ?? heartbeat?.equity ?? 0;
  const markets = safeMarketsList(heartbeat?.markets);
  const openPositions = heartbeat?.open_positions ?? heartbeat?.openPositions ?? 0;
  const survival = heartbeat?.survival ?? heartbeat?.state ?? "—";
  const lastHb = heartbeat?.time_utc || heartbeat?.last_heartbeat || "—";

  const name = companion?.name || "VAULT BOY";
  const stage = companion?.stage || "egg";
  const moodRaw = companion?.mood || "neutral";
  const health = clamp01(companion?.health);
  const hunger = clamp01(companion?.hunger);
  const growth = clamp01(companion?.growth);
  const updated = companion?.time_utc || companion?.updated || "—";

  const mood = moodFromState(survival, moodRaw);

  const subtitle = useMemo(() => {
    const state = heartbeat?.state || "ACTIVE";
    return `Home · API: ${apiBase || "—"} · Refresh: ${REFRESH_MS / 1000}s · Last: ${
      lastFetchAt ? lastFetchAt.toLocaleTimeString() : "—"
    } · State: ${state}`;
  }, [apiBase, lastFetchAt, heartbeat]);

  return (
    <div className="pip-crt">
      <div className="pip-shell">
        <div className="pip-topbar">
          <div className="pip-topbar-left">
            <div className="pip-title">PIP-TRADE 3000</div>
            <div className="pip-sub wrap">{subtitle}</div>
          </div>
          <div className="pip-topbar-right">CSS LOADED</div>
        </div>

        <div className="pip-links">
          <Link className="pip-link active" href="/">HOME</Link>
          <Link className="pip-link" href="/candles">CANDLES</Link>
          <Link className="pip-link" href="/crypto">CRYPTO</Link>
        </div>

        <div className="pip-tabs">
          <button className={`pip-tab ${tab === "status" ? "active" : ""}`} onClick={() => setTab("status")}>
            STATUS
          </button>
          <button className={`pip-tab ${tab === "data" ? "active" : ""}`} onClick={() => setTab("data")}>
            DATA
          </button>
          <button className={`pip-tab ${tab === "log" ? "active" : ""}`} onClick={() => setTab("log")}>
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

                <div className="pip-grid">
                  <div className="pip-k">Equity</div>
                  <div className="pip-v">US${Number(equity).toFixed(2)}</div>

                  <div className="pip-k">Markets</div>
                  <div className="pip-v">{markets.length ? markets.join(", ") : "—"}</div>

                  <div className="pip-k">Open positions</div>
                  <div className="pip-v">{openPositions}</div>

                  <div className="pip-k">Survival</div>
                  <div className="pip-v">{String(survival).toUpperCase()}</div>

                  <div className="pip-k">Last heartbeat</div>
                  <div className="pip-v">{String(lastHb)}</div>
                </div>
              </div>

              <div className="pip-panel" style={{ marginTop: 14 }}>
                <div className="pip-heading">VAULT COMPANION</div>

                <div className="pip-row" style={{ gap: 14, alignItems: "stretch" }}>
                  <div style={{ width: 210, maxWidth: "48vw" }}>
                    <VaultDude mood={mood} sex="boy" />
                  </div>

                  <div className="pip-grid" style={{ flex: 1, alignContent: "start" }}>
                    <div className="pip-k">Name</div>
                    <div className="pip-v">{name}</div>

                    <div className="pip-k">Stage</div>
                    <div className="pip-v">{stage}</div>

                    <div className="pip-k">Mood</div>
                    <div className="pip-v">{mood}</div>

                    <div className="pip-k">Health</div>
                    <div className="pip-v">{health.toFixed(1)}</div>

                    <div className="pip-k">Hunger</div>
                    <div className="pip-v">{hunger.toFixed(1)}</div>

                    <div className="pip-k">Growth</div>
                    <div className="pip-v">{growth.toFixed(1)}</div>

                    <div className="pip-k">Updated</div>
                    <div className="pip-v">{String(updated)}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "data" && (
            <div className="pip-panel">
              <div className="pip-heading">RAW DATA</div>
              <pre className="pip-pre">{JSON.stringify({ heartbeat, companion }, null, 2)}</pre>
            </div>
          )}

          {tab === "log" && (
            <div className="pip-panel">
              <div className="pip-heading">EVENT LOG</div>
              {events?.length ? (
                <div className="pip-log">
                  {events.slice().reverse().slice(0, 30).map((e, i) => (
                    <div key={i} className="pip-logrow">
                      <div className="pip-k">{e?.time_utc || e?.t || "—"}</div>
                      <div className="pip-v">{e?.msg || e?.message || JSON.stringify(e)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pip-muted">No log events returned yet.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

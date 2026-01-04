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

function pct(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return "—";
  return x.toFixed(1);
}

/** Simple full-body “Vault” character (SVG) */
function VaultDude({ mood = "neutral", sex = "boy" }) {
  const label = sex === "girl" ? "VAULT GIRL" : "VAULT BOY";
  const face =
    mood === "panic"
      ? "😱"
      : mood === "happy"
      ? "🙂"
      : mood === "cryo"
      ? "🥶"
      : mood === "angry"
      ? "😠"
      : "😐";

  // tiny idle bob
  const anim = mood === "panic" ? "pip-shake" : "pip-bob";

  return (
    <div className={`pip-petbox ${anim}`} aria-label={label}>
      <svg viewBox="0 0 220 220" width="100%" height="100%">
        {/* glow frame */}
        <rect x="8" y="8" width="204" height="204" rx="18" fill="rgba(0,0,0,0.25)" stroke="var(--pip-border)" />
        {/* body */}
        <g transform="translate(0,5)">
          {/* head */}
          <circle cx="110" cy="72" r="28" fill="rgba(119,255,154,0.18)" stroke="var(--pip-ink)" strokeWidth="2" />
          {/* face */}
          <text x="110" y="80" textAnchor="middle" fontSize="22" fill="var(--pip-ink)">
            {face}
          </text>

          {/* torso */}
          <rect x="82" y="102" width="56" height="58" rx="10" fill="rgba(119,255,154,0.12)" stroke="var(--pip-ink)" strokeWidth="2" />

          {/* arms */}
          <rect x="55" y="112" width="25" height="12" rx="6" fill="rgba(119,255,154,0.12)" stroke="var(--pip-ink)" strokeWidth="2" />
          <rect x="140" y="112" width="25" height="12" rx="6" fill="rgba(119,255,154,0.12)" stroke="var(--pip-ink)" strokeWidth="2" />

          {/* legs */}
          <rect x="92" y="162" width="16" height="28" rx="6" fill="rgba(119,255,154,0.12)" stroke="var(--pip-ink)" strokeWidth="2" />
          <rect x="112" y="162" width="16" height="28" rx="6" fill="rgba(119,255,154,0.12)" stroke="var(--pip-ink)" strokeWidth="2" />
        </g>
      </svg>

      <div className="pip-petlabel">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastFetchAt, setLastFetchAt] = useState(null);
  const [tab, setTab] = useState("STATUS"); // STATUS | DATA | LOG

  const [data, setData] = useState(null);

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    return res.json();
  }

  async function load() {
    if (!apiBase) {
      setErr("Missing NEXT_PUBLIC_API_URL in Vercel environment variables.");
      setLoading(false);
      return;
    }

    try {
      setErr("");
      const d = await fetchJson(`${apiBase}/data`);
      setData(d);
      setLastFetchAt(new Date());
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  const hb = data?.heartbeat || {};
  const pet = data?.pet || {};
  const ctrl = data?.control || {};
  const state = (data?.state || ctrl?.state || "ACTIVE").toString().toUpperCase();

  const markets = useMemo(() => safeMarketsList(hb?.markets), [hb?.markets]);

  const equity = Number(hb?.equity_usd ?? 0);
  const openPositions = Number(hb?.open_positions ?? 0);
  const survival = (hb?.survival_mode || hb?.survival || "NORMAL").toString();
  const lastHb = hb?.time_utc || "—";

  const petSex = (pet?.sex || "boy").toString();
  const petName = petSex === "girl" ? "VAULT GIRL" : "VAULT BOY";
  const petStage = (pet?.stage || "egg").toString();
  const petMood = (pet?.mood || "neutral").toString();
  const petHealth = pct(pet?.health ?? 0);
  const petHunger = pct(pet?.hunger ?? 0);
  const petGrowth = pct(pet?.growth ?? 0);
  const petUpdated = pet?.time_utc || "—";

  const events = Array.isArray(data?.events) ? data.events : [];
  const deaths = Array.isArray(data?.deaths) ? data.deaths : [];

  return (
    <div className="pip-crt">
      <div className="pip-shell">
        <div className="pip-topbar">
          <div className="pip-topbar-left">
            <div className="pip-title">PIP-TRADE 3000</div>
            <div className="pip-sub wrap">
              Home · API: {apiBase || "—"} · Refresh: {REFRESH_MS / 1000}s · Last:{" "}
              {lastFetchAt ? lastFetchAt.toLocaleTimeString() : "—"} · State: {state}
            </div>
          </div>
        </div>

        <div className="pip-links">
          <Link className="pip-link active" href="/">HOME</Link>
          <Link className="pip-link" href="/candles">CANDLES</Link>
          <Link className="pip-link" href="/crypto">CRYPTO</Link>
        </div>

        <div className="pip-content">
          {err && (
            <div className="pip-panel" style={{ marginBottom: 12 }}>
              <div className="pip-heading">ERROR</div>
              <div className="wrap">{err}</div>
            </div>
          )}

          {/* STATUS / DATA / LOG buttons */}
          <div className="pip-row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
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

          {tab === "STATUS" && (
            <>
              <div className="pip-panel" style={{ marginBottom: 12 }}>
                <div className="pip-heading">SYSTEM STATUS</div>

                {loading && !data ? (
                  <div className="pip-muted">Loading…</div>
                ) : (
                  <>
                    <div className="pip-row">
                      <div className="pip-k">Equity</div>
                      <div className="pip-v">US${equity.toFixed(2)}</div>
                    </div>
                    <div className="pip-row">
                      <div className="pip-k">Markets</div>
                      <div className="pip-v">{markets.length ? markets.join(", ") : "—"}</div>
                    </div>
                    <div className="pip-row">
                      <div className="pip-k">Open positions</div>
                      <div className="pip-v">{openPositions}</div>
                    </div>
                    <div className="pip-row">
                      <div className="pip-k">Survival</div>
                      <div className="pip-v">{survival}</div>
                    </div>
                    <div className="pip-row">
                      <div className="pip-k">Last heartbeat</div>
                      <div className="pip-v wrap">{lastHb}</div>
                    </div>
                  </>
                )}
              </div>

              <div className="pip-panel">
                <div className="pip-heading">VAULT COMPANION</div>

                <div className="pip-row" style={{ gap: 12, alignItems: "stretch", flexWrap: "wrap" }}>
                  <div style={{ width: 170, height: 170, flex: "0 0 auto" }}>
                    <VaultDude mood={petMood} sex={petSex} />
                  </div>

                  <div style={{ flex: "1 1 240px" }}>
                    <div className="pip-row">
                      <div className="pip-k">Name</div>
                      <div className="pip-v">{petName}</div>
                    </div>
                    <div className="pip-row">
                      <div className="pip-k">Stage</div>
                      <div className="pip-v">{petStage}</div>
                    </div>
                    <div className="pip-row">
                      <div className="pip-k">Mood</div>
                      <div className="pip-v">{petMood}</div>
                    </div>
                    <div className="pip-row">
                      <div className="pip-k">Health</div>
                      <div className="pip-v">{petHealth}</div>
                    </div>
                    <div className="pip-row">
                      <div className="pip-k">Hunger</div>
                      <div className="pip-v">{petHunger}</div>
                    </div>
                    <div className="pip-row">
                      <div className="pip-k">Growth</div>
                      <div className="pip-v">{petGrowth}</div>
                    </div>
                    <div className="pip-row">
                      <div className="pip-k">Updated</div>
                      <div className="pip-v wrap">{petUpdated}</div>
                    </div>
                  </div>
                </div>

                <div className="pip-muted" style={{ marginTop: 10 }}>
                  Full animated walk/idle next — this is a starter full-body figure so you can see something now.
                </div>
              </div>
            </>
          )}

          {tab === "DATA" && (
            <div className="pip-panel">
              <div className="pip-heading">RAW /DATA SNAPSHOT</div>
              <pre className="pip-code wrap">
                {JSON.stringify(
                  {
                    state,
                    heartbeat: hb,
                    pet,
                    stats: data?.stats,
                    control: ctrl,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}

          {tab === "LOG" && (
            <div className="pip-panel">
              <div className="pip-heading">EVENT LOG</div>
              {events.length === 0 && deaths.length === 0 ? (
                <div className="pip-muted">No events yet.</div>
              ) : (
                <>
                  {events.slice(-80).reverse().map((e, i) => (
                    <div key={`e-${i}`} className="pip-row" style={{ justifyContent: "space-between", gap: 10 }}>
                      <div className="pip-k wrap">{e?.time_utc || "—"}</div>
                      <div className="pip-v wrap" style={{ textAlign: "right" }}>
                        [{e?.type || "info"}] {e?.message || ""}
                      </div>
                    </div>
                  ))}
                  {deaths.slice(-40).reverse().map((d, i) => (
                    <div key={`d-${i}`} className="pip-row" style={{ justifyContent: "space-between", gap: 10 }}>
                      <div className="pip-k wrap">{d?.time_utc || "—"}</div>
                      <div className="pip-v wrap" style={{ textAlign: "right" }}>
                        [death] {d?.reason || ""}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

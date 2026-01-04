"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const REFRESH_MS = 5000;

function safeJson(v) {
  try {
    if (!v) return null;
    if (typeof v === "object") return v;
    return JSON.parse(v);
  } catch {
    return null;
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

function pct(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return "—";
  return x.toFixed(1);
}

export default function HomePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastFetchAt, setLastFetchAt] = useState(null);

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

  const petName = pet?.sex === "girl" ? "VAULT GIRL" : "VAULT BOY";
  const petStage = (pet?.stage || "egg").toString();
  const petMood = (pet?.mood || "neutral").toString();
  const petHealth = pct(pet?.health ?? 0);
  const petHunger = pct(pet?.hunger ?? 0);
  const petGrowth = pct(pet?.growth ?? 0);
  const petUpdated = pet?.time_utc || "—";

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

            <div className="pip-muted" style={{ marginTop: 10 }}>
              (We’ll add the full animated Vault Boy/Girl character next — this is the data panel.)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

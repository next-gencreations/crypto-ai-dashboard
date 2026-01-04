"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const REFRESH_MS = 5000;

function fmtMoney(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}
function fmtNum(n, dp = 1) {
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

function VaultSprite({ sex = "boy", mood = "neutral", stage = "egg" }) {
  // Lightweight placeholder "character" that always shows (no external assets).
  // Later we can swap this for a real animated PitBoy/PitGirl.
  const label = sex === "girl" ? "VAULT GIRL" : "VAULT BOY";
  const moodText = String(mood || "neutral").toUpperCase();
  const stageText = String(stage || "egg").toUpperCase();

  return (
    <div className="pip-avatar">
      <div className="pip-avatar-inner">
        <div className="pip-avatar-title">{label}</div>
        <div className="pip-avatar-sub">{stageText}</div>
        <div className="pip-avatar-sub">{moodText}</div>
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

  const heartbeat = payload?.heartbeat || {};
  const pet = payload?.pet || {};
  const control = payload?.control || {};
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
  }, [dataUrl]);

  const pricesOk = heartbeat?.prices_ok === 1 || heartbeat?.prices_ok === true;
  const countdown =
    stateMode === "CRYO"
      ? timeLeft(control?.cryo_until_utc)
      : stateMode === "PAUSED"
      ? timeLeft(control?.pause_until_utc)
      : "";

  const sex = String(pet?.sex || "boy").toLowerCase();

  const statusBadge = useMemo(() => {
    if (stateMode === "CRYO") return "CRYO";
    if (stateMode === "PAUSED") return "PAUSED";
    return "ACTIVE";
  }, [stateMode]);

  return (
    <>
      <div className="pip-topbar">
        <div className="pip-topbar-left">
          <div className="pip-title">PIP-TRADE 3000</div>
          <div className="pip-sub wrap">
            API: {apiBase || "—"} · Refresh: {REFRESH_MS / 1000}s · Last:{" "}
            {lastFetchAt ? lastFetchAt.toLocaleTimeString() : "—"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

      {err && (
        <div className="pip-content">
          <div className="pip-panel">
            <div className="pip-heading">ERROR</div>
            <div className="wrap">{err}</div>
          </div>
        </div>
      )}

      <div className="pip-content">
        <div className="pip-grid">
          <div className="pip-panel">
            <div className="pip-heading">SYSTEM STATUS</div>
            <div className="pip-row">
              <div className="pip-k">Equity</div>
              <div className="pip-v">{fmtMoney(heartbeat?.equity_usd)}</div>
            </div>
            <div className="pip-row">
              <div className="pip-k">Markets</div>
              <div className="pip-v wrap">
                {Array.isArray(heartbeat?.markets) ? heartbeat.markets.join(", ") : heartbeat?.markets || "—"}
              </div>
            </div>
            <div className="pip-row">
              <div className="pip-k">Open positions</div>
              <div className="pip-v">{heartbeat?.open_positions ?? "—"}</div>
            </div>
            <div className="pip-row">
              <div className="pip-k">Survival</div>
              <div className="pip-v">{heartbeat?.survival_mode || "—"}</div>
            </div>
            <div className="pip-row">
              <div className="pip-k">Last heartbeat</div>
              <div className="pip-v wrap">{heartbeat?.time_utc || "—"}</div>
            </div>
          </div>

          <div className="pip-panel">
            <div className="pip-heading">VAULT COMPANION</div>

            <div className="pip-companion">
              <VaultSprite sex={sex} mood={pet?.mood} stage={pet?.stage} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pip-row">
                  <div className="pip-k">Name</div>
                  <div className="pip-v">{sex === "girl" ? "VAULT GIRL" : "VAULT BOY"}</div>
                </div>
                <div className="pip-row">
                  <div className="pip-k">Stage</div>
                  <div className="pip-v">{pet?.stage || "—"}</div>
                </div>
                <div className="pip-row">
                  <div className="pip-k">Mood</div>
                  <div className="pip-v">{pet?.mood || "—"}</div>
                </div>
                <div className="pip-row">
                  <div className="pip-k">Health</div>
                  <div className="pip-v">{fmtNum(pet?.health, 1)}</div>
                </div>
                <div className="pip-row">
                  <div className="pip-k">Hunger</div>
                  <div className="pip-v">{fmtNum(pet?.hunger, 1)}</div>
                </div>
                <div className="pip-row">
                  <div className="pip-k">Growth</div>
                  <div className="pip-v">{fmtNum(pet?.growth, 1)}</div>
                </div>
                <div className="pip-row">
                  <div className="pip-k">Updated</div>
                  <div className="pip-v wrap">{pet?.time_utc || "—"}</div>
                </div>
              </div>
            </div>

            {loading && !payload && <div className="pip-muted" style={{ marginTop: 10 }}>LOADING…</div>}
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_API = "https://crypto-ai-api-1-7cte.onrender.com";

export default function Page() {
  const [apiBase, setApiBase] = useState(DEFAULT_API);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const dataUrl = useMemo(() => {
    const base = (apiBase || "").replace(/\/$/, "");
    return base ? `${base}/data` : "";
  }, [apiBase]);

  async function refresh() {
    if (!dataUrl) return;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(dataUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl]);

  const stats = data?.stats || {};
  const pet = data?.pet || {};
  const prices = data?.prices || {};
  const trades = data?.trades || [];

  return (
    <main style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <p className="h1">Crypto AI Dashboard</p>
          <p className="small">Auto-refreshing every 5 seconds</p>
        </div>
        <span className="badge">{loading ? "Loading…" : "Live"}</span>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="row">
          <input
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            placeholder="API base URL (e.g. https://...onrender.com)"
          />
          <button onClick={refresh}>Refresh now</button>
          <span className="small">Fetching: {dataUrl}</span>
        </div>
        {err ? (
          <p style={{ color: "#ff8a8a", marginTop: 10 }}>Error: {err}</p>
        ) : null}
      </div>

      <div className="grid" style={{ marginTop: 12 }}>
        <div className="card">
          <p className="small">Status</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            {stats?.status || "unknown"}
          </p>
          <p className="small" style={{ marginTop: 6 }}>
            UTC: {stats?.time_utc || "—"}
          </p>
        </div>

        <div className="card">
          <p className="small">Equity (USD)</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            {stats?.equity_usd ?? "—"}
          </p>
          <p className="small" style={{ marginTop: 6 }}>
            Total trades: {stats?.total_trades ?? 0}
          </p>
        </div>

        <div className="card">
          <p className="small">PnL</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            {stats?.total_pnl_usd ?? 0}
          </p>
          <p className="small" style={{ marginTop: 6 }}>
            Win rate: {stats?.win_rate ?? 0}%
          </p>
        </div>

        <div className="card">
          <p className="small">Pet</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            {pet?.stage || "—"} / {pet?.mood || "—"}
          </p>
          <p className="small" style={{ marginTop: 6 }}>
            Health: {pet?.health ?? "—"} • Hunger: {pet?.hunger ?? "—"}
          </p>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 12 }}>
        <div className="card">
          <p className="small">Prices</p>
          <pre>{JSON.stringify(prices, null, 2)}</pre>
        </div>

        <div className="card">
          <p className="small">Recent Trades</p>
          <pre>{JSON.stringify(trades.slice(-10).reverse(), null, 2)}</pre>
        </div>
      </div>
    </main>
  );
}

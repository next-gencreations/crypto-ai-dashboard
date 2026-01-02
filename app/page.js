"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/data`)
      .then(res => res.json())
      .then(setData)
      .catch(err => setError(err.message));
  }, []);

  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
  if (!data) return <div>Loading AI Pet…</div>;

  const pet = data.pet;
  const stats = data.stats;

  return (
    <main style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>🧠 Crypto AI Pet Dashboard</h1>

      <section>
        <h2>Pet Status</h2>
        <p>Stage: {pet.stage}</p>
        <p>Mood: {pet.mood}</p>
        <p>Health: {pet.health}</p>
        <p>Hunger: {pet.hunger}</p>
        <p>Growth: {pet.growth}</p>
      </section>

      <section>
        <h2>Trading Stats</h2>
        <p>Equity: ${stats.equity_usd.toFixed(2)}</p>
        <p>Total PnL: ${stats.total_pnl_usd.toFixed(2)}</p>
        <p>Trades: {stats.total_trades}</p>
        <p>Wins: {stats.wins}</p>
        <p>Losses: {stats.losses}</p>
        <p>Win Rate: {(stats.win_rate * 100).toFixed(1)}%</p>
      </section>
    </main>
  );
}

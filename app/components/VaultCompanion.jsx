"use client";

function moodFromData(pnl, positions) {
  if (positions > 0) return "thriving";
  if (pnl > 5) return "happy";
  if (pnl > 0) return "idle";
  if (pnl < -10) return "zombie";
  if (pnl < -3) return "sick";
  if (pnl < 0) return "weak";
  return "idle";
}

export default function VaultCompanion({
  pnlToday = 0,
  equity = 0,
  openPositions = 0,
}) {
  const mood = moodFromData(pnlToday, openPositions);

  const img = `/companion/vaultgirl/vaultgirl_${mood}.png`;

  return (
    <div style={{
      border: "2px solid #00ff88",
      padding: 12,
      textAlign: "center",
      background: "#000",
      color: "#00ff88"
    }}>
      <h3>VAULT GIRL</h3>

      <img
        src={img}
        style={{ width: 200 }}
        onError={(e) => {
          e.target.src = "/companion/vaultgirl/vaultgirl_idle.png";
        }}
      />

      <div style={{ marginTop: 10 }}>
        <div>STATE: {mood.toUpperCase()}</div>
        <div>EQUITY: ${equity.toFixed(2)}</div>
        <div>PnL: {pnlToday >= 0 ? "+" : ""}${pnlToday.toFixed(2)}</div>
        <div>POSITIONS: {openPositions}</div>
      </div>
    </div>
  );
}

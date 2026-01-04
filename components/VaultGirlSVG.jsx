// app/components/VaultGirlSVG.jsx
"use client";

export default function VaultGirlSVG({
  mood = "cryo",
  stage = "egg",
  vaultNumber = "13",
}) {
  const glow =
    mood === "happy"
      ? "drop-shadow(0 0 10px rgba(119,255,154,.9))"
      : mood === "cryo"
      ? "drop-shadow(0 0 6px rgba(119,255,154,.5))"
      : "drop-shadow(0 0 8px rgba(119,255,154,.7))";

  return (
    <svg
      viewBox="0 0 260 340"
      width="100%"
      height="100%"
      aria-label="Vault Girl"
      role="img"
      style={{ display: "block", filter: glow }}
    >
      {/* frame */}
      <rect
        x="10"
        y="10"
        width="240"
        height="320"
        rx="18"
        fill="rgba(0,0,0,0.25)"
        stroke="rgba(119,255,154,0.25)"
        strokeWidth="2"
      />

      {/* head */}
      <ellipse
        cx="130"
        cy="80"
        rx="30"
        ry="36"
        fill="rgba(119,255,154,0.18)"
        stroke="#77ff9a"
        strokeWidth="3"
      />

      {/* hair */}
      <path
        d="M95 78 Q130 38 165 78 Q155 65 130 65 Q105 65 95 78Z"
        fill="rgba(119,255,154,0.35)"
      />

      {/* eyes */}
      <circle cx="120" cy="82" r="3" fill="#77ff9a" />
      <circle cx="140" cy="82" r="3" fill="#77ff9a" />

      {/* mouth */}
      {mood === "happy" ? (
        <path
          d="M118 94 Q130 102 142 94"
          stroke="#77ff9a"
          strokeWidth="2"
          fill="none"
        />
      ) : (
        <line
          x1="118"
          y1="96"
          x2="142"
          y2="96"
          stroke="#77ff9a"
          strokeWidth="2"
        />
      )}

      {/* body */}
      <path
        d="M95 120 Q130 105 165 120 V200 Q165 220 145 230 H115 Q95 220 95 200Z"
        fill="rgba(119,255,154,0.15)"
        stroke="#77ff9a"
        strokeWidth="3"
      />

      {/* zipper */}
      <line
        x1="130"
        y1="120"
        x2="130"
        y2="220"
        stroke="#77ff9a"
        strokeWidth="2"
        opacity="0.4"
      />

      {/* vault number (keep this, it's fine) */}
      <text
        x="130"
        y="170"
        textAnchor="middle"
        fontSize="22"
        fill="#77ff9a"
        opacity="0.85"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      >
        {vaultNumber}
      </text>

      {/* arms */}
      <path
        d="M95 140 Q70 155 78 180"
        stroke="#77ff9a"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M165 140 Q190 155 182 180"
        stroke="#77ff9a"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />

      {/* legs */}
      <path
        d="M120 230 Q110 265 120 300"
        stroke="#77ff9a"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M140 230 Q150 265 140 300"
        stroke="#77ff9a"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />

      {/* egg overlay */}
      {stage === "egg" && (
        <ellipse
          cx="130"
          cy="170"
          rx="55"
          ry="75"
          fill="rgba(119,255,154,0.08)"
          stroke="rgba(119,255,154,0.35)"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

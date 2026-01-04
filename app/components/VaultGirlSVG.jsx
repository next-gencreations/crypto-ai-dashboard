// app/components/VaultGirlSVG.jsx
"use client";

export default function VaultGirlSVG({
  mood = "cryo",
  stage = "cryo",
  vaultNumber = "13",
}) {
  const line = "#77ff9a";
  const glow =
    mood === "happy"
      ? "drop-shadow(0 0 14px rgba(119,255,154,.9))"
      : "drop-shadow(0 0 9px rgba(119,255,154,.6))";

  return (
    <svg
      viewBox="0 0 260 340"
      width="100%"
      height="100%"
      role="img"
      aria-label="Vault Girl"
      style={{ display: "block", filter: glow }}
    >
      {/* PANEL FRAME */}
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

      {/* CRYO TUBE */}
      {stage === "cryo" && (
        <>
          <rect
            x="70"
            y="36"
            width="120"
            height="260"
            rx="60"
            fill="rgba(119,255,154,0.05)"
            stroke="rgba(119,255,154,0.28)"
            strokeWidth="2"
          />
          {/* glass shine */}
          <rect
            x="86"
            y="46"
            width="16"
            height="240"
            rx="8"
            fill="rgba(119,255,154,0.12)"
            opacity="0.6"
          />
          {/* base */}
          <rect
            x="82"
            y="292"
            width="96"
            height="12"
            rx="6"
            fill="rgba(119,255,154,0.12)"
          />
        </>
      )}

      {/* ===== VAULT GIRL ===== */}

      {/* Hair (cartoon bob) */}
      <path
        d="M96 74
           Q130 40 164 74
           Q162 64 150 60
           Q130 54 110 60
           Q98 64 96 74 Z"
        fill="rgba(119,255,154,0.35)"
      />
      <path
        d="M98 74
           Q90 110 104 130
           Q102 102 112 82 Z"
        fill="rgba(119,255,154,0.2)"
      />
      <path
        d="M162 74
           Q170 110 156 130
           Q158 102 148 82 Z"
        fill="rgba(119,255,154,0.2)"
      />

      {/* Head */}
      <ellipse
        cx="130"
        cy="90"
        rx="28"
        ry="32"
        fill="rgba(119,255,154,0.18)"
        stroke={line}
        strokeWidth="3"
      />

      {/* Eyes */}
      <circle cx="120" cy="92" r="3.5" fill={line} />
      <circle cx="140" cy="92" r="3.5" fill={line} />

      {/* Smile */}
      {mood === "happy" ? (
        <path
          d="M118 104 Q130 112 142 104"
          stroke={line}
          strokeWidth="2"
          fill="none"
        />
      ) : (
        <path
          d="M120 106 Q130 108 140 106"
          stroke={line}
          strokeWidth="2"
          fill="none"
          opacity="0.8"
        />
      )}

      {/* Neck */}
      <rect
        x="124"
        y="120"
        width="12"
        height="10"
        rx="6"
        fill="rgba(119,255,154,0.25)"
      />

      {/* BODY (female silhouette) */}
      <path
        d="M104 130
           Q130 118 156 130
           Q164 146 158 164
           Q154 176 148 178
           Q136 182 130 182
           Q124 182 112 178
           Q106 176 102 164
           Q96 146 104 130 Z"
        fill="rgba(119,255,154,0.18)"
        stroke={line}
        strokeWidth="3"
      />

      {/* Chest (subtle, cartoon) */}
      <path
        d="M118 144 Q124 150 130 150 Q136 150 142 144"
        stroke={line}
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />

      {/* Zipper */}
      <line
        x1="130"
        y1="130"
        x2="130"
        y2="182"
        stroke={line}
        strokeWidth="2"
        opacity="0.35"
      />

      {/* Vault number */}
      <text
        x="130"
        y="170"
        textAnchor="middle"
        fontSize="20"
        fill={line}
        opacity="0.85"
        fontFamily="ui-monospace, monospace"
      >
        {vaultNumber}
      </text>

      {/* Hips */}
      <path
        d="M112 182
           Q130 192 148 182
           V210
           Q130 224 112 210 Z"
        fill="rgba(119,255,154,0.18)"
        stroke={line}
        strokeWidth="3"
      />

      {/* Arms */}
      <path
        d="M104 146 Q82 166 92 196"
        stroke={line}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M156 146 Q178 166 168 196"
        stroke={line}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />

      {/* Legs */}
      <path
        d="M122 210 Q112 250 120 300"
        stroke={line}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M138 210 Q148 250 140 300"
        stroke={line}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />

      {/* Feet */}
      <ellipse cx="118" cy="304" rx="10" ry="5" fill="rgba(119,255,154,0.25)" />
      <ellipse cx="142" cy="304" rx="10" ry="5" fill="rgba(119,255,154,0.25)" />
    </svg>
  );
}

// app/components/VaultGirlSVG.jsx
"use client";

export default function VaultGirlSVG({
  mood = "cryo",
  stage = "cryo", // default to cryo now
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
        fill="rgba(0,0,0,0.22)"
        stroke="rgba(119,255,154,0.22)"
        strokeWidth="2"
      />

      {/* ===== CRYO TUBE (behind character) ===== */}
      {stage === "cryo" && (
        <>
          {/* outer glass */}
          <rect
            x="58"
            y="36"
            width="144"
            height="272"
            rx="72"
            fill="rgba(119,255,154,0.05)"
            stroke="rgba(119,255,154,0.35)"
            strokeWidth="2"
          />

          {/* inner glow */}
          <rect
            x="72"
            y="52"
            width="116"
            height="240"
            rx="58"
            fill="rgba(119,255,154,0.06)"
            stroke="rgba(119,255,154,0.18)"
            strokeWidth="1"
          />

          {/* top cap */}
          <rect
            x="78"
            y="28"
            width="104"
            height="24"
            rx="12"
            fill="rgba(0,0,0,0.35)"
            stroke="rgba(119,255,154,0.35)"
            strokeWidth="2"
          />

          {/* bottom base */}
          <rect
            x="76"
            y="292"
            width="108"
            height="18"
            rx="9"
            fill="rgba(0,0,0,0.35)"
            stroke="rgba(119,255,154,0.35)"
            strokeWidth="2"
          />

          {/* tiny bubbles */}
          <circle cx="92" cy="120" r="3" fill="rgba(119,255,154,0.18)" />
          <circle cx="170" cy="150" r="2.5" fill="rgba(119,255,154,0.16)" />
          <circle cx="108" cy="190" r="2" fill="rgba(119,255,154,0.14)" />
          <circle cx="160" cy="220" r="3" fill="rgba(119,255,154,0.18)" />

          {/* subtle vertical highlight */}
          <path
            d="M92 54 C86 90 86 256 92 292"
            stroke="rgba(119,255,154,0.16)"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </>
      )}

      {/* ===== HEAD ===== */}
      <ellipse
        cx="130"
        cy="86"
        rx="30"
        ry="36"
        fill="rgba(119,255,154,0.18)"
        stroke="#77ff9a"
        strokeWidth="3"
      />

      {/* ===== HAIR (bob + fringe) ===== */}
      <path
        d="M92 84
           Q95 45 130 48
           Q165 45 168 84
           Q168 122 154 128
           Q140 134 130 134
           Q120 134 106 128
           Q92 122 92 84Z"
        fill="rgba(119,255,154,0.32)"
      />

      {/* fringe line */}
      <path
        d="M106 74 Q130 62 154 74"
        stroke="rgba(119,255,154,0.35)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* ===== EYES ===== */}
      <circle cx="120" cy="88" r="3" fill="#77ff9a" />
      <circle cx="140" cy="88" r="3" fill="#77ff9a" />

      {/* lashes (small but helps femininity) */}
      <path
        d="M116 84 L112 82"
        stroke="#77ff9a"
        strokeWidth="1.5"
        opacity="0.8"
        strokeLinecap="round"
      />
      <path
        d="M124 84 L128 82"
        stroke="#77ff9a"
        strokeWidth="1.5"
        opacity="0.8"
        strokeLinecap="round"
      />
      <path
        d="M136 84 L132 82"
        stroke="#77ff9a"
        strokeWidth="1.5"
        opacity="0.8"
        strokeLinecap="round"
      />
      <path
        d="M144 84 L148 82"
        stroke="#77ff9a"
        strokeWidth="1.5"
        opacity="0.8"
        strokeLinecap="round"
      />

      {/* ===== MOUTH ===== */}
      {mood === "happy" ? (
        <path
          d="M118 102 Q130 110 142 102"
          stroke="#77ff9a"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M118 104 Q130 100 142 104"
          stroke="#77ff9a"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.9"
        />
      )}

      {/* ===== NECK ===== */}
      <path
        d="M124 118 Q130 122 136 118"
        stroke="rgba(119,255,154,0.7)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* ===== BODY (slightly softer shape) ===== */}
      <path
        d="
          M98 132
          Q130 116 162 132
          Q168 160 164 198
          Q160 224 142 236
          Q130 244 118 236
          Q100 224 96 198
          Q92 160 98 132
          Z"
        fill="rgba(119,255,154,0.14)"
        stroke="#77ff9a"
        strokeWidth="3"
      />

      {/* zipper */}
      <line
        x1="130"
        y1="132"
        x2="130"
        y2="226"
        stroke="#77ff9a"
        strokeWidth="2"
        opacity="0.35"
      />

      {/* waist band hint */}
      <path
        d="M106 212 Q130 220 154 212"
        stroke="rgba(119,255,154,0.35)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* vault number */}
      <text
        x="130"
        y="190"
        textAnchor="middle"
        fontSize="22"
        fill="#77ff9a"
        opacity="0.85"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      >
        {vaultNumber}
      </text>

      {/* ===== ARMS ===== */}
      <path
        d="M98 152 Q74 170 82 198"
        stroke="#77ff9a"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M162 152 Q186 170 178 198"
        stroke="#77ff9a"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />

      {/* ===== LEGS ===== */}
      <path
        d="M122 238 Q112 268 122 304"
        stroke="#77ff9a"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M138 238 Q148 268 138 304"
        stroke="#77ff9a"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />

      {/* feet */}
      <ellipse cx="118" cy="312" rx="10" ry="5" fill="rgba(119,255,154,0.85)" />
      <ellipse cx="142" cy="312" rx="10" ry="5" fill="rgba(119,255,154,0.85)" />

      {/* ===== OPTIONAL: keep egg overlay ONLY if stage is egg (backup) ===== */}
      {stage === "egg" && (
        <ellipse
          cx="130"
          cy="180"
          rx="58"
          ry="80"
          fill="rgba(119,255,154,0.06)"
          stroke="rgba(119,255,154,0.30)"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

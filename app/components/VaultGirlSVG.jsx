// app/components/VaultGirlSVG.jsx
"use client";

export default function VaultGirlSVG({
  mood = "cryo",     // cryo | happy | neutral | angry
  stage = "cryo",    // cryo | egg | hatched
  vaultNumber = "13",
  showDebugTag = false,
}) {
  const line = "#77ff9a";

  const glow =
    mood === "happy"
      ? "drop-shadow(0 0 16px rgba(119,255,154,.95))"
      : mood === "cryo"
      ? "drop-shadow(0 0 10px rgba(119,255,154,.6))"
      : "drop-shadow(0 0 12px rgba(119,255,154,.75))";

  // Make cryo feel calm (not angry)
  const faceMode =
    mood === "angry" ? "angry" :
    mood === "happy" ? "happy" :
    "calm"; // default (includes cryo/neutral)

  return (
    <svg
      viewBox="0 0 260 340"
      width="100%"
      height="100%"
      role="img"
      aria-label="Vault Girl"
      style={{ display: "block", filter: glow }}
    >
      {/* Background panel */}
      <rect
        x="10"
        y="10"
        width="240"
        height="320"
        rx="18"
        fill="rgba(0,0,0,0.25)"
        stroke="rgba(119,255,154,0.22)"
        strokeWidth="2"
      />

      {/* ===== CRYO TUBE (stage === "cryo") ===== */}
      {stage === "cryo" && (
        <>
          {/* outer tube */}
          <rect
            x="48"
            y="36"
            width="164"
            height="268"
            rx="82"
            fill="rgba(119,255,154,0.03)"
            stroke="rgba(119,255,154,0.28)"
            strokeWidth="2"
          />
          {/* inner glass */}
          <rect
            x="60"
            y="52"
            width="140"
            height="236"
            rx="70"
            fill="rgba(119,255,154,0.035)"
            stroke="rgba(119,255,154,0.18)"
            strokeWidth="2"
          />
          {/* top cap */}
          <rect
            x="72"
            y="44"
            width="116"
            height="22"
            rx="11"
            fill="rgba(0,0,0,0.25)"
            stroke="rgba(119,255,154,0.22)"
            strokeWidth="2"
          />
          {/* bottom cap */}
          <rect
            x="72"
            y="274"
            width="116"
            height="22"
            rx="11"
            fill="rgba(0,0,0,0.25)"
            stroke="rgba(119,255,154,0.22)"
            strokeWidth="2"
          />

          {/* bubbles */}
          <circle cx="84" cy="120" r="2.2" fill="rgba(119,255,154,0.25)" />
          <circle cx="178" cy="148" r="2.8" fill="rgba(119,255,154,0.20)" />
          <circle cx="96" cy="170" r="3.0" fill="rgba(119,255,154,0.18)" />
          <circle cx="170" cy="205" r="2.2" fill="rgba(119,255,154,0.22)" />
          <circle cx="120" cy="230" r="2.4" fill="rgba(119,255,154,0.18)" />

          {/* subtle vertical pipe */}
          <rect
            x="66"
            y="64"
            width="6"
            height="212"
            rx="3"
            fill="rgba(0,0,0,0.22)"
          />
          <rect
            x="69"
            y="64"
            width="1.5"
            height="212"
            rx="1"
            fill="rgba(119,255,154,0.20)"
          />
        </>
      )}

      {/* ===== CARTOON VAULT GIRL ===== */}

      {/* Hair behind head */}
      <path
        d="M92 92
           Q98 60 130 58
           Q168 60 170 98
           Q168 120 150 128
           Q138 132 130 132
           Q120 132 110 128
           Q92 120 92 92 Z"
        fill="rgba(119,255,154,0.16)"
        stroke="rgba(119,255,154,0.28)"
        strokeWidth="2"
      />

      {/* Head */}
      <ellipse
        cx="130"
        cy="95"
        rx="30"
        ry="34"
        fill="rgba(119,255,154,0.14)"
        stroke={line}
        strokeWidth="3"
      />

      {/* Hair fringe */}
      <path
        d="M105 88 Q122 70 145 78 Q154 82 158 92 Q150 86 136 88 Q122 90 105 88 Z"
        fill="rgba(119,255,154,0.22)"
      />

      {/* Eyes */}
      <circle cx="120" cy="96" r="3.2" fill={line} opacity="0.9" />
      <circle cx="140" cy="96" r="3.2" fill={line} opacity="0.9" />

      {/* Eyebrows (calm/happy vs angry) */}
      {faceMode === "angry" ? (
        <>
          <path d="M112 90 Q120 86 128 90" stroke={line} strokeWidth="2" fill="none" />
          <path d="M148 90 Q140 86 132 90" stroke={line} strokeWidth="2" fill="none" />
        </>
      ) : (
        <>
          <path d="M112 90 Q120 88 128 90" stroke={line} strokeWidth="2" fill="none" opacity="0.7" />
          <path d="M148 90 Q140 88 132 90" stroke={line} strokeWidth="2" fill="none" opacity="0.7" />
        </>
      )}

      {/* Mouth */}
      {faceMode === "happy" ? (
        <path
          d="M116 110 Q130 120 144 110"
          stroke={line}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      ) : faceMode === "angry" ? (
        <path
          d="M116 114 Q130 108 144 114"
          stroke={line}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        // calm (default)
        <path
          d="M118 112 Q130 116 142 112"
          stroke={line}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          opacity="0.9"
        />
      )}

      {/* Neck */}
      <rect
        x="124"
        y="128"
        width="12"
        height="10"
        rx="5"
        fill="rgba(119,255,154,0.16)"
        stroke="rgba(119,255,154,0.25)"
        strokeWidth="1.5"
      />

      {/* Body (slightly more feminine silhouette, still tasteful) */}
      <path
        d="M96 140
           Q130 126 164 140
           Q170 158 165 198
           Q162 222 150 232
           Q140 240 130 240
           Q120 240 110 232
           Q98 222 95 198
           Q90 158 96 140 Z"
        fill="rgba(119,255,154,0.10)"
        stroke={line}
        strokeWidth="3"
      />

      {/* Chest detail (subtle) */}
      <path
        d="M110 158 Q130 150 150 158"
        stroke="rgba(119,255,154,0.35)"
        strokeWidth="2"
        fill="none"
      />

      {/* Zipper */}
      <line
        x1="130"
        y1="140"
        x2="130"
        y2="235"
        stroke={line}
        strokeWidth="2"
        opacity="0.35"
      />

      {/* Vault number */}
      <text
        x="130"
        y="195"
        textAnchor="middle"
        fontSize="22"
        fill={line}
        opacity="0.85"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      >
        {vaultNumber}
      </text>

      {/* Arms */}
      <path
        d="M98 158 Q78 178 88 206"
        stroke={line}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d="M162 158 Q182 178 172 206"
        stroke={line}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        opacity="0.95"
      />

      {/* Legs */}
      <path
        d="M123 240 Q112 270 122 304"
        stroke={line}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M137 240 Q148 270 138 304"
        stroke={line}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />

      {/* Shoes */}
      <ellipse cx="122" cy="308" rx="10" ry="5.5" fill="rgba(119,255,154,0.75)" />
      <ellipse cx="138" cy="308" rx="10" ry="5.5" fill="rgba(119,255,154,0.75)" />

      {/* Egg overlay (if you ever use stage="egg") */}
      {stage === "egg" && (
        <ellipse
          cx="130"
          cy="200"
          rx="58"
          ry="82"
          fill="rgba(119,255,154,0.06)"
          stroke="rgba(119,255,154,0.30)"
          strokeWidth="2"
        />
      )}

      {/* Debug tag to prove deployment */}
      {showDebugTag && (
        <text
          x="130"
          y="332"
          textAnchor="middle"
          fontSize="10"
          fill={line}
          opacity="0.85"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        >
          VG_CARTOON_V3
        </text>
      )}
    </svg>
  );
}

"use client";
<text
  x="130"
  y="332"
  textAnchor="middle"
  fontSize="10"
  fill="#77ff9a"
  opacity="0.85"
  fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
>
  VG_CARTOON_V2
</text>
export default function VaultGirlSVG({
  mood = "cryo", // happy | neutral | cryo | angry
  stage = "cryo", // cryo | egg | hatched (we mainly use cryo now)
  vaultNumber = "13",
}) {
  const line = "#77ff9a";

  const glow =
    mood === "happy"
      ? "drop-shadow(0 0 14px rgba(119,255,154,.9))"
      : mood === "cryo"
      ? "drop-shadow(0 0 10px rgba(119,255,154,.65))"
      : "drop-shadow(0 0 10px rgba(119,255,154,.75))";

  // Face expressions (simple + readable on mobile)
  const brows =
    mood === "angry" ? (
      <>
        <path d="M112 86 Q120 80 128 84" stroke={line} strokeWidth="2" fill="none" opacity="0.9" />
        <path d="M148 86 Q140 80 132 84" stroke={line} strokeWidth="2" fill="none" opacity="0.9" />
      </>
    ) : mood === "happy" ? (
      <>
        <path d="M112 84 Q120 82 128 84" stroke={line} strokeWidth="2" fill="none" opacity="0.7" />
        <path d="M148 84 Q140 82 132 84" stroke={line} strokeWidth="2" fill="none" opacity="0.7" />
      </>
    ) : (
      <>
        <path d="M112 84 Q120 84 128 84" stroke={line} strokeWidth="2" fill="none" opacity="0.55" />
        <path d="M148 84 Q140 84 132 84" stroke={line} strokeWidth="2" fill="none" opacity="0.55" />
      </>
    );

  const mouth =
    mood === "happy" ? (
      <path
        d="M118 104 Q130 114 142 104"
        stroke={line}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    ) : mood === "angry" ? (
      <path
        d="M118 110 Q130 104 142 110"
        stroke={line}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.9"
      />
    ) : (
      <path
        d="M120 110 Q130 112 140 110"
        stroke={line}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
    );

  const cheekGlow = mood === "happy" ? 0.18 : 0.1;

  return (
    <svg
      viewBox="0 0 260 340"
      width="100%"
      height="100%"
      aria-label="Vault Girl"
      role="img"
      style={{ display: "block", filter: glow }}
    >
      {/* ====== BACK PANEL ====== */}
      <rect
        x="10"
        y="10"
        width="240"
        height="320"
        rx="18"
        fill="rgba(0,0,0,0.22)"
        stroke="rgba(119,255,154,0.25)"
        strokeWidth="2"
      />

      {/* ====== CRYO TUBE (stage === cryo) ====== */}
      {stage === "cryo" && (
        <>
          {/* outer glass */}
          <rect
            x="48"
            y="30"
            width="164"
            height="280"
            rx="78"
            fill="rgba(119,255,154,0.04)"
            stroke="rgba(119,255,154,0.22)"
            strokeWidth="2"
          />

          {/* inner rim */}
          <rect
            x="62"
            y="44"
            width="136"
            height="252"
            rx="68"
            fill="rgba(119,255,154,0.03)"
            stroke="rgba(119,255,154,0.12)"
            strokeWidth="2"
          />

          {/* top cap */}
          <rect
            x="82"
            y="34"
            width="96"
            height="28"
            rx="14"
            fill="rgba(0,0,0,0.25)"
            stroke="rgba(119,255,154,0.18)"
            strokeWidth="2"
          />

          {/* bottom cap */}
          <rect
            x="82"
            y="278"
            width="96"
            height="28"
            rx="14"
            fill="rgba(0,0,0,0.25)"
            stroke="rgba(119,255,154,0.18)"
            strokeWidth="2"
          />

          {/* glass highlight */}
          <path
            d="M76 64 Q66 170 76 286"
            stroke="rgba(119,255,154,0.16)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* bubbles */}
          <circle cx="90" cy="160" r="3" fill="rgba(119,255,154,0.18)" />
          <circle cx="105" cy="205" r="2.5" fill="rgba(119,255,154,0.14)" />
          <circle cx="170" cy="190" r="2" fill="rgba(119,255,154,0.12)" />
          <circle cx="155" cy="120" r="2.5" fill="rgba(119,255,154,0.14)" />
        </>
      )}

      {/* ====== VAULT GIRL (cartoon) ====== */}

      {/* hair back */}
      <path
        d="M96 86
           Q98 56 130 52
           Q164 56 166 88
           Q162 120 154 132
           Q150 140 138 136
           Q130 134 122 136
           Q110 140 106 132
           Q96 118 96 86Z"
        fill="rgba(119,255,154,0.28)"
        stroke="rgba(119,255,154,0.22)"
        strokeWidth="2"
      />

      {/* head */}
      <ellipse
        cx="130"
        cy="95"
        rx="34"
        ry="38"
        fill="rgba(119,255,154,0.14)"
        stroke={line}
        strokeWidth="3"
      />

      {/* bangs */}
      <path
        d="M100 88
           Q108 64 130 64
           Q152 64 160 88
           Q150 78 130 78
           Q110 78 100 88Z"
        fill="rgba(119,255,154,0.34)"
        opacity="0.9"
      />

      {/* cheeks */}
      <ellipse cx="113" cy="110" rx="8" ry="5" fill={`rgba(119,255,154,${cheekGlow})`} />
      <ellipse cx="147" cy="110" rx="8" ry="5" fill={`rgba(119,255,154,${cheekGlow})`} />

      {/* eyes */}
      <circle cx="118" cy="98" r="4" fill={line} opacity="0.95" />
      <circle cx="142" cy="98" r="4" fill={line} opacity="0.95" />

      {/* lashes (simple feminine cue, still tasteful) */}
      <path d="M110 95 L114 93" stroke={line} strokeWidth="2" opacity="0.6" />
      <path d="M126 95 L122 93" stroke={line} strokeWidth="2" opacity="0.6" />
      <path d="M134 95 L138 93" stroke={line} strokeWidth="2" opacity="0.6" />
      <path d="M150 95 L146 93" stroke={line} strokeWidth="2" opacity="0.6" />

      {/* brows */}
      {brows}

      {/* mouth */}
      {mouth}

      {/* neck */}
      <rect x="124" y="132" width="12" height="10" rx="5" fill="rgba(119,255,154,0.18)" />

      {/* body (curvier / clearly female, still modest) */}
      <path
        d="M98 150
           Q130 132 162 150
           L162 218
           Q160 242 146 250
           Q130 260 114 250
           Q100 242 98 218Z"
        fill="rgba(119,255,154,0.10)"
        stroke={line}
        strokeWidth="3"
      />

      {/* subtle chest contour (NOT explicit, just cartoon shaping) */}
      <path
        d="M112 172
           Q130 162 148 172"
        stroke="rgba(119,255,154,0.45)"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />

      {/* zipper */}
      <line
        x1="130"
        y1="150"
        x2="130"
        y2="240"
        stroke={line}
        strokeWidth="2"
        opacity="0.35"
      />

      {/* vault number */}
      <text
        x="130"
        y="205"
        textAnchor="middle"
        fontSize="24"
        fill={line}
        opacity="0.85"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      >
        {vaultNumber}
      </text>

      {/* arms (softer curve) */}
      <path
        d="M100 168 Q78 186 86 212"
        stroke={line}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d="M160 168 Q182 186 174 212"
        stroke={line}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        opacity="0.95"
      />

      {/* legs */}
      <path
        d="M120 252 Q112 282 120 302"
        stroke={line}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M140 252 Q148 282 140 302"
        stroke={line}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />

      {/* boots */}
      <ellipse cx="120" cy="306" rx="12" ry="6" fill="rgba(119,255,154,0.65)" />
      <ellipse cx="140" cy="306" rx="12" ry="6" fill="rgba(119,255,154,0.65)" />

      {/* egg overlay (kept for compatibility, but cryo is the main stage now) */}
      {stage === "egg" && (
        <ellipse
          cx="130"
          cy="180"
          rx="58"
          ry="84"
          fill="rgba(119,255,154,0.06)"
          stroke="rgba(119,255,154,0.28)"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

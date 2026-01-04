// app/components/VaultGirlSVG.jsx
"use client";

export default function VaultGirlSVG({
  mood = "cryo",
  stage = "cryo", // default to cryo now
  vaultNumber = "13",
}) {
  const glow =
    mood === "happy"
      ? "drop-shadow(0 0 12px rgba(119,255,154,.95))"
      : mood === "cryo"
      ? "drop-shadow(0 0 8px rgba(119,255,154,.55))"
      : "drop-shadow(0 0 10px rgba(119,255,154,.75))";

  const line = "#77ff9a";
  const fillSoft = "rgba(119,255,154,0.14)";
  const fillMid = "rgba(119,255,154,0.22)";
  const glass = "rgba(119,255,154,0.06)";
  const glassEdge = "rgba(119,255,154,0.30)";
  const frost = "rgba(119,255,154,0.10)";

  return (
    <svg
      viewBox="0 0 260 340"
      width="100%"
      height="100%"
      aria-label="Vault Girl"
      role="img"
      style={{ display: "block", filter: glow }}
    >
      <defs>
        {/* subtle glass sheen */}
        <linearGradient id="glassSheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(119,255,154,0.00)" />
          <stop offset="0.35" stopColor="rgba(119,255,154,0.10)" />
          <stop offset="0.6" stopColor="rgba(119,255,154,0.03)" />
          <stop offset="1" stopColor="rgba(119,255,154,0.00)" />
        </linearGradient>

        {/* inner glow */}
        <radialGradient id="innerGlow" cx="50%" cy="35%" r="70%">
          <stop offset="0" stopColor="rgba(119,255,154,0.18)" />
          <stop offset="1" stopColor="rgba(119,255,154,0.00)" />
        </radialGradient>
      </defs>

      {/* BACKPLATE (keeps your pip-boy framed feel) */}
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

      {/* CRYO TUBE */}
      {stage === "cryo" && (
        <>
          {/* base plate */}
          <rect
            x="62"
            y="290"
            width="136"
            height="22"
            rx="10"
            fill="rgba(0,0,0,0.22)"
            stroke="rgba(119,255,154,0.22)"
            strokeWidth="2"
          />
          <rect
            x="80"
            y="296"
            width="100"
            height="10"
            rx="6"
            fill="rgba(119,255,154,0.08)"
          />

          {/* outer capsule */}
          <path
            d="M80 58
               Q80 40 100 40
               H160
               Q180 40 180 58
               V286
               Q180 304 160 304
               H100
               Q80 304 80 286
               Z"
            fill={glass}
            stroke={glassEdge}
            strokeWidth="2"
          />

          {/* inner glow wash */}
          <ellipse cx="130" cy="165" rx="84" ry="120" fill="url(#innerGlow)" />

          {/* glass sheen strip */}
          <rect
            x="96"
            y="48"
            width="18"
            height="248"
            rx="9"
            fill="url(#glassSheen)"
            opacity="0.9"
          />

          {/* frost patches */}
          <path
            d="M95 78 Q112 70 120 86 Q110 96 96 92 Z"
            fill={frost}
            opacity="0.8"
          />
          <path
            d="M168 110 Q154 104 148 120 Q156 128 170 126 Z"
            fill={frost}
            opacity="0.7"
          />
          <path
            d="M92 210 Q112 198 124 216 Q110 232 94 226 Z"
            fill={frost}
            opacity="0.75"
          />

          {/* bubbles */}
          <circle cx="150" cy="250" r="3" fill="rgba(119,255,154,0.22)" />
          <circle cx="108" cy="238" r="2" fill="rgba(119,255,154,0.18)" />
          <circle cx="165" cy="220" r="2.5" fill="rgba(119,255,154,0.18)" />
          <circle cx="120" cy="200" r="2.2" fill="rgba(119,255,154,0.16)" />
          <circle cx="145" cy="170" r="1.8" fill="rgba(119,255,154,0.14)" />
        </>
      )}

      {/* ===== VAULT GIRL (more feminine silhouette) ===== */}

      {/* hair (longer + side sweep) */}
      <path
        d="M92 84
           Q100 52 130 48
           Q162 52 170 86
           Q162 76 148 74
           Q142 60 130 60
           Q118 60 112 74
           Q98 76 92 84 Z"
        fill="rgba(119,255,154,0.30)"
      />
      {/* long hair behind shoulders */}
      <path
        d="M98 92
           Q90 126 98 150
           Q104 168 118 178
           Q106 150 112 120
           Q115 104 98 92 Z"
        fill="rgba(119,255,154,0.18)"
      />
      <path
        d="M162 92
           Q172 128 164 152
           Q158 170 142 182
           Q156 154 150 122
           Q146 104 162 92 Z"
        fill="rgba(119,255,154,0.18)"
      />

      {/* head */}
      <ellipse
        cx="130"
        cy="86"
        rx="30"
        ry="36"
        fill="rgba(119,255,154,0.16)"
        stroke={line}
        strokeWidth="3"
      />

      {/* eyes + lashes */}
      <circle cx="120" cy="88" r="3" fill={line} />
      <circle cx="140" cy="88" r="3" fill={line} />
      <path
        d="M114 82 L118 80"
        stroke={line}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M146 82 L142 80"
        stroke={line}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.75"
      />

      {/* mouth (slightly softer) */}
      {mood === "happy" ? (
        <path
          d="M118 104 Q130 112 142 104"
          stroke={line}
          strokeWidth="2"
          fill="none"
          opacity="0.95"
        />
      ) : mood === "cryo" ? (
        <path
          d="M118 106 Q130 102 142 106"
          stroke={line}
          strokeWidth="2"
          fill="none"
          opacity="0.75"
        />
      ) : (
        <line x1="118" y1="106" x2="142" y2="106" stroke={line} strokeWidth="2" />
      )}

      {/* neck */}
      <path
        d="M122 120 Q130 126 138 120"
        stroke={line}
        strokeWidth="3"
        fill="none"
        opacity="0.8"
      />

      {/* body (waist + hips) */}
      <path
        d="M102 128
           Q130 112 158 128
           V206
           Q158 224 146 232
           Q130 244 114 232
           Q102 224 102 206
           Z"
        fill={fillSoft}
        stroke={line}
        strokeWidth="3"
      />

      {/* collar / little bow */}
      <path
        d="M118 132 Q130 144 142 132"
        stroke={line}
        strokeWidth="2"
        fill="none"
        opacity="0.65"
      />
      <circle cx="130" cy="140" r="2" fill={line} opacity="0.55" />

      {/* zipper */}
      <line
        x1="130"
        y1="128"
        x2="130"
        y2="226"
        stroke={line}
        strokeWidth="2"
        opacity="0.35"
      />

      {/* vault number */}
      <text
        x="130"
        y="182"
        textAnchor="middle"
        fontSize="22"
        fill={line}
        opacity="0.85"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      >
        {vaultNumber}
      </text>

      {/* arms (slimmer + slight curve) */}
      <path
        d="M104 148 Q82 166 92 196"
        stroke={line}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d="M156 148 Q178 166 168 196"
        stroke={line}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        opacity="0.95"
      />

      {/* legs (slimmer) */}
      <path
        d="M122 232 Q110 270 120 304"
        stroke={line}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M138 232 Q150 270 140 304"
        stroke={line}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />

      {/* shoes */}
      <ellipse cx="118" cy="308" rx="10" ry="5" fill="rgba(119,255,154,0.22)" />
      <ellipse cx="142" cy="308" rx="10" ry="5" fill="rgba(119,255,154,0.22)" />

      {/* EGG overlay (still supported if you ever use it) */}
      {stage === "egg" && (
        <ellipse
          cx="130"
          cy="176"
          rx="60"
          ry="82"
          fill="rgba(119,255,154,0.07)"
          stroke="rgba(119,255,154,0.28)"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

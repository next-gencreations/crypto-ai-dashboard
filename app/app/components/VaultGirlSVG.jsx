// app/components/VaultGirlSVG.jsx
"use client";

export default function VaultGirlSVG({
  mood = "cryo",
  stage = "egg",
  vaultNumber = "13",
}) {
  const glow =
    mood === "happy"
      ? "drop-shadow(0 0 10px rgba(119,255,154,.95))"
      : mood === "cryo"
      ? "drop-shadow(0 0 6px rgba(119,255,154,.55))"
      : "drop-shadow(0 0 8px rgba(119,255,154,.75))";

  const ink = "#77ff9a";
  const fill = "rgba(119,255,154,0.14)";

  // expression
  const mouth =
    mood === "happy"
      ? "M128 92 Q130 96 132 92"
      : mood === "sad"
      ? "M128 96 Q130 92 132 96"
      : "M128 94 L132 94";

  return (
    <svg viewBox="0 0 260 340" width="100%" height="100%" style={{ filter: glow }}>
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

      {/* subtle scanlines */}
      <g opacity="0.08">
        {Array.from({ length: 45 }).map((_, i) => (
          <rect key={i} x="14" y={18 + i * 7} width="232" height="2" fill="#000" />
        ))}
      </g>

      {/* ===== Vault Girl ===== */}
      <g stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* hair (bob cut) */}
        <path
          d="M95 70
             Q110 42 130 44
             Q155 46 170 70
             Q176 82 170 96
             Q165 110 154 120
             Q145 130 130 132
             Q112 130 103 120
             Q92 110 90 96
             Q84 82 95 70Z"
          fill="rgba(119,255,154,0.22)"
          opacity="0.95"
        />
        {/* fringe */}
        <path
          d="M102 74
             Q118 60 130 62
             Q146 64 158 74
             Q145 76 130 78
             Q116 78 102 74Z"
          fill="rgba(119,255,154,0.18)"
          stroke="none"
        />

        {/* head */}
        <ellipse cx="130" cy="86" rx="26" ry="32" fill={fill} />

        {/* eyes */}
        <circle cx="121" cy="86" r="3.5" fill={ink} stroke="none" opacity="0.9" />
        <circle cx="139" cy="86" r="3.5" fill={ink} stroke="none" opacity="0.9" />

        {/* nose */}
        <path d="M130 88 Q128 92 131 94" fill="none" opacity="0.7" />

        {/* mouth */}
        <path d={mouth} fill="none" opacity="0.9" />

        {/* neck */}
        <path d="M122 116 Q130 124 138 116" fill="none" opacity="0.9" />

        {/* torso (more feminine silhouette) */}
        <path
          d="M106 126
             Q130 112 154 126
             Q166 134 166 154
             Q166 176 156 198
             Q149 214 130 214
             Q111 214 104 198
             Q94 176 94 154
             Q94 134 106 126Z"
          fill={fill}
        />

        {/* zipper */}
        <path d="M130 126 L130 214" opacity="0.35" />

        {/* belt line */}
        <path d="M108 188 Q130 198 152 188" opacity="0.35" />

        {/* vault number */}
        <text
          x="130"
          y="172"
          textAnchor="middle"
          fontSize="18"
          fill={ink}
          opacity="0.85"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          stroke="none"
        >
          {vaultNumber}
        </text>

        {/* arms (simple relaxed) */}
        <path d="M96 154 Q76 170 86 196" strokeWidth="7" fill="none" />
        <path d="M164 154 Q184 170 174 196" strokeWidth="7" fill="none" />

        {/* hands */}
        <circle cx="86" cy="198" r="6" fill={fill} />
        <circle cx="174" cy="198" r="6" fill={fill} />

        {/* legs (walking pose like reference) */}
        {/* back leg */}
        <path d="M122 214 Q112 246 120 286" strokeWidth="7" fill="none" />
        {/* front leg stepping forward */}
        <path d="M138 214 Q154 252 144 292" strokeWidth="7" fill="none" />

        {/* shoes */}
        <path d="M114 290 Q122 302 136 294" strokeWidth="6" fill="none" />
        <path d="M136 296 Q150 306 160 296" strokeWidth="6" fill="none" />
      </g>

      {/* egg overlay (if stage egg) */}
      {stage === "egg" && (
        <g>
          <ellipse
            cx="130"
            cy="190"
            rx="62"
            ry="86"
            fill="rgba(119,255,154,0.07)"
            stroke="rgba(119,255,154,0.28)"
            strokeWidth="2"
          />
          <path
            d="M94 198 Q130 178 166 198"
            stroke="rgba(119,255,154,0.22)"
            strokeWidth="2"
            fill="none"
          />
        </g>
      )}

      {/* cryo frost (subtle) */}
      {mood === "cryo" && (
        <g opacity="0.12">
          <circle cx="72" cy="72" r="2" fill="#d8ffe3" />
          <circle cx="190" cy="92" r="2" fill="#d8ffe3" />
          <circle cx="206" cy="170" r="2" fill="#d8ffe3" />
          <circle cx="60" cy="210" r="2" fill="#d8ffe3" />
          <circle cx="176" cy="248" r="2" fill="#d8ffe3" />
        </g>
      )}
    </svg>
  );
}

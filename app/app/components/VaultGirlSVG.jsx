// app/components/VaultGirlSVG.jsx
"use client";

export default function VaultGirlSVG({
  mood = "neutral",
  stage = "hatched",
  vaultNumber = "13",
}) {
  const ink = "#77ff9a";
  const fill = "rgba(119,255,154,0.12)";
  const fill2 = "rgba(119,255,154,0.18)";

  const glow =
    mood === "happy"
      ? "drop-shadow(0 0 12px rgba(119,255,154,.9))"
      : mood === "cryo"
      ? "drop-shadow(0 0 8px rgba(119,255,154,.6))"
      : mood === "panic"
      ? "drop-shadow(0 0 14px rgba(119,255,154,1))"
      : "drop-shadow(0 0 10px rgba(119,255,154,.75))";

  // facial expression
  const mouth =
    mood === "happy"
      ? "M116 98 Q130 110 144 98"
      : mood === "sad"
      ? "M116 108 Q130 96 144 108"
      : mood === "cryo"
      ? "M116 104 L144 104"
      : "M118 104 Q130 110 142 104";

  const browY = mood === "panic" ? 86 : 88;

  // tiny pose shift
  const bodyShiftX = mood === "happy" ? 1.5 : 0;
  const bodyShiftY = mood === "sad" ? 1.5 : 0;

  // egg overlay opacity (keep it subtle so it doesn’t “blob”)
  const eggOpacity = stage === "egg" ? 0.07 : 0;

  return (
    <svg
      viewBox="0 0 260 340"
      width="100%"
      height="100%"
      style={{ filter: glow }}
      aria-label="Vault Girl"
    >
      {/* Screen frame */}
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

      {/* Scanline sheen */}
      <rect
        x="14"
        y="14"
        width="232"
        height="312"
        rx="16"
        fill="rgba(0,0,0,0.08)"
      />

      {/* Character */}
      <g transform={`translate(${bodyShiftX},${bodyShiftY})`}>
        {/* Hair (bob cut like your reference) */}
        <path
          d="M92 78
             Q110 44 130 48
             Q150 44 168 78
             Q170 92 162 106
             Q150 122 130 124
             Q110 122 98 106
             Q90 92 92 78Z"
          fill="rgba(119,255,154,0.30)"
          stroke={ink}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Side hair strands */}
        <path
          d="M104 104 Q98 122 108 132"
          fill="none"
          stroke={ink}
          strokeWidth="2"
          opacity="0.9"
          strokeLinecap="round"
        />
        <path
          d="M156 104 Q162 122 152 132"
          fill="none"
          stroke={ink}
          strokeWidth="2"
          opacity="0.9"
          strokeLinecap="round"
        />

        {/* Face */}
        <ellipse
          cx="130"
          cy="96"
          rx="28"
          ry="34"
          fill={fill2}
          stroke={ink}
          strokeWidth="2.5"
        />

        {/* Eyes */}
        <circle cx="120" cy="98" r="3.2" fill={ink} opacity="0.95" />
        <circle cx="140" cy="98" r="3.2" fill={ink} opacity="0.95" />

        {/* Brows */}
        <path
          d={`M112 ${browY} Q120 ${browY - 6} 128 ${browY}`}
          fill="none"
          stroke={ink}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d={`M132 ${browY} Q140 ${browY - 6} 148 ${browY}`}
          fill="none"
          stroke={ink}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Mouth */}
        <path
          d={mouth}
          fill="none"
          stroke={ink}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.95"
        />

        {/* Neck */}
        <path
          d="M122 126 L138 126 L140 140 Q130 146 120 140 Z"
          fill={fill}
          stroke={ink}
          strokeWidth="2"
          opacity="0.9"
        />

        {/* Body (more like the reference silhouette) */}
        <path
          d="M96 150
             Q130 130 164 150
             Q174 156 174 174
             L174 210
             Q174 232 160 244
             Q150 252 130 252
             Q110 252 100 244
             Q86 232 86 210
             L86 174
             Q86 156 96 150Z"
          fill={fill}
          stroke={ink}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Suit zipper */}
        <line
          x1="130"
          y1="150"
          x2="130"
          y2="246"
          stroke={ink}
          strokeWidth="2"
          opacity="0.35"
        />

        {/* Collar */}
        <path
          d="M110 154 Q130 170 150 154"
          fill="none"
          stroke={ink}
          strokeWidth="2"
          opacity="0.65"
          strokeLinecap="round"
        />

        {/* Vault number */}
        <text
          x="130"
          y="205"
          textAnchor="middle"
          fontSize="22"
          fill={ink}
          opacity="0.85"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        >
          {vaultNumber}
        </text>

        {/* Arms (reference-like relaxed pose) */}
        <path
          d="M86 178 Q62 190 68 214 Q72 230 88 238"
          fill="none"
          stroke={ink}
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.95"
        />
        <path
          d="M174 178 Q198 190 192 214 Q188 230 172 238"
          fill="none"
          stroke={ink}
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.95"
        />

        {/* Legs (walking-ish like your reference) */}
        <path
          d="M120 252 Q108 278 114 306"
          fill="none"
          stroke={ink}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M140 252 Q152 276 146 302"
          fill="none"
          stroke={ink}
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Shoes */}
        <path
          d="M110 308 Q120 316 132 312"
          fill="none"
          stroke={ink}
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.95"
        />
        <path
          d="M144 304 Q154 312 166 308"
          fill="none"
          stroke={ink}
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.95"
        />

        {/* Egg overlay (very light, so it doesn't ruin the shape) */}
        {stage === "egg" && (
          <ellipse
            cx="130"
            cy="198"
            rx="64"
            ry="92"
            fill={`rgba(119,255,154,${eggOpacity})`}
            stroke="rgba(119,255,154,0.22)"
            strokeWidth="2"
          />
        )}
      </g>
    </svg>
  );
}

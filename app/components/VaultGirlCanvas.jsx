// app/components/VaultGirlSVG.jsx
"use client";

import { useMemo } from "react";

export default function VaultGirlSVG({ mood = "neutral", stage = "hatched", vaultNumber = "13" }) {
  const isEgg = String(stage || "").toLowerCase().includes("egg");
  const m = String(mood || "neutral").toLowerCase();

  // mood affects face + tiny animation speed
  const face = useMemo(() => {
    if (m.includes("panic")) return { mouth: "M156 150 Q160 142 164 150", brow: "M142 132 Q160 120 178 132" };
    if (m.includes("sick")) return { mouth: "M150 152 Q160 147 170 152", brow: "M142 128 Q160 136 178 128" };
    if (m.includes("cryo")) return { mouth: "M150 150 L170 150", brow: "M142 130 Q160 126 178 130" };
    if (m.includes("happy")) return { mouth: "M148 148 Q160 160 172 148", brow: "M142 130 Q160 124 178 130" };
    return { mouth: "M148 150 Q160 156 172 150", brow: "M142 130 Q160 126 178 130" };
  }, [m]);

  const animDur = m.includes("happy") ? "0.9s" : m.includes("cryo") ? "1.8s" : "1.2s";

  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      <svg viewBox="0 0 320 360" width="100%" height="100%" aria-label="Vault Girl">
        {/* background tint */}
        <rect x="0" y="0" width="320" height="360" fill="rgba(0,0,0,0.12)" />

        {/* scanlines */}
        <defs>
          <pattern id="scan" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="2" fill="rgba(0,0,0,0.18)" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="8" y="8" width="304" height="344" rx="18" fill="url(#scan)" opacity="0.18" />

        {/* main drawing group with gentle bob */}
        <g className="vg-bob" filter="url(#glow)">
          {/* EGG stage */}
          {isEgg ? (
            <>
              <g className="vg-ink">
                <ellipse cx="160" cy="205" rx="72" ry="96" fill="rgba(119,255,154,0.10)" stroke="var(--pip-ink)" strokeWidth="3" />
                <ellipse cx="160" cy="205" rx="62" ry="86" fill="rgba(0,0,0,0.10)" stroke="var(--pip-border)" strokeWidth="2" />
                {/* tiny face hint */}
                <circle cx="148" cy="200" r="3.5" fill="var(--pip-ink)" opacity="0.75" />
                <circle cx="172" cy="200" r="3.5" fill="var(--pip-ink)" opacity="0.75" />
                <path d="M150 220 Q160 228 170 220" fill="none" stroke="var(--pip-ink)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
              </g>
            </>
          ) : (
            <>
              {/* Walking Vault Girl (simple but closer to reference) */}
              <g className="vg-ink" transform="translate(0,0)">
                {/* hair bob cut */}
                <path
                  d="M110 120
                     Q116 86 160 86
                     Q206 86 210 122
                     Q210 154 190 170
                     Q176 182 160 182
                     Q144 182 130 170
                     Q110 154 110 120 Z"
                  fill="rgba(119,255,154,0.14)"
                  stroke="var(--pip-ink)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                {/* fringe */}
                <path
                  d="M122 120
                     Q140 102 160 104
                     Q182 102 198 120"
                  fill="none"
                  stroke="var(--pip-ink)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.8"
                />

                {/* head */}
                <ellipse cx="160" cy="140" rx="30" ry="36" fill="rgba(0,0,0,0.10)" stroke="var(--pip-ink)" strokeWidth="3" />
                {/* eyes */}
                <circle cx="148" cy="142" r="4" fill="var(--pip-ink)" opacity="0.85" />
                <circle cx="172" cy="142" r="4" fill="var(--pip-ink)" opacity="0.85" />
                {/* brows + mouth */}
                <path d={face.brow} fill="none" stroke="var(--pip-ink)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
                <path d={face.mouth} fill="none" stroke="var(--pip-ink)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />

                {/* torso / suit (hourglass-ish) */}
                <path
                  d="M132 178
                     Q160 162 188 178
                     Q200 188 198 214
                     L194 254
                     Q190 280 176 292
                     Q168 298 160 298
                     Q152 298 144 292
                     Q130 280 126 254
                     L122 214
                     Q120 188 132 178 Z"
                  fill="rgba(119,255,154,0.10)"
                  stroke="var(--pip-ink)"
                  strokeWidth="3"
                />
                {/* zipper */}
                <path d="M160 178 L160 296" stroke="var(--pip-ink)" strokeWidth="3" opacity="0.35" />
                {/* collar */}
                <path d="M140 186 Q160 200 180 186" fill="none" stroke="var(--pip-ink)" strokeWidth="3" opacity="0.7" />

                {/* vault number */}
                <text
                  x="160"
                  y="235"
                  textAnchor="middle"
                  fontSize="30"
                  fontWeight="800"
                  fill="var(--pip-ink)"
                  opacity="0.55"
                  style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
                >
                  {vaultNumber}
                </text>

                {/* arms (one forward, one back-ish) */}
                <path
                  d="M124 212
                     Q98 224 104 252
                     Q112 274 136 266"
                  fill="none"
                  stroke="var(--pip-ink)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <path
                  d="M196 212
                     Q224 228 212 258
                     Q204 276 186 268"
                  fill="none"
                  stroke="var(--pip-ink)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />

                {/* legs walking */}
                {/* back leg */}
                <path
                  d="M150 296
                     Q140 324 150 344"
                  fill="none"
                  stroke="var(--pip-ink)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  opacity="0.85"
                />
                {/* front leg */}
                <path
                  d="M170 296
                     Q186 322 194 336"
                  fill="none"
                  stroke="var(--pip-ink)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />

                {/* shoes */}
                <ellipse cx="150" cy="348" rx="12" ry="6" fill="var(--pip-ink)" opacity="0.75" />
                <ellipse cx="198" cy="342" rx="12" ry="6" fill="var(--pip-ink)" opacity="0.75" />
              </g>
            </>
          )}
        </g>
      </svg>

      {/* Local styles (no globals.css needed) */}
      <style jsx>{`
        .vg-ink {
          color: var(--pip-ink);
        }
        .vg-bob {
          transform-origin: 160px 220px;
          animation: bob ${animDur} ease-in-out infinite;
        }
        @keyframes bob {
          0% { transform: translateY(0px); }
          50% { transform: translateY(4px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}

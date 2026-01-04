// app/components/VaultGirlSVG.jsx
"use client";

import { useMemo } from "react";

export default function VaultGirlSVG({
  mood = "neutral",
  stage = "hatched",
  vaultNumber = "13",
}) {
  const st = String(stage || "").toLowerCase();
  const m = String(mood || "").toLowerCase();

  const isEgg = st.includes("egg");
  const isCryo = m.includes("cryo");
  const isHappy = m.includes("happy");
  const isSick = m.includes("sick");
  const isPanic = m.includes("panic");

  const face = useMemo(() => {
    if (isPanic) return { mouth: "M154 172 Q160 164 166 172", browL: "M140 150 Q148 142 156 150", browR: "M164 150 Q172 142 180 150" };
    if (isSick)  return { mouth: "M152 174 Q160 170 168 174", browL: "M140 148 Q148 154 156 148", browR: "M164 148 Q172 154 180 148" };
    if (isCryo)  return { mouth: "M150 172 L170 172",            browL: "M140 148 Q148 146 156 148", browR: "M164 148 Q172 146 180 148" };
    if (isHappy) return { mouth: "M148 170 Q160 182 172 170",    browL: "M140 148 Q148 144 156 148", browR: "M164 148 Q172 144 180 148" };
    return        { mouth: "M148 172 Q160 178 172 172",          browL: "M140 148 Q148 146 156 148", browR: "M164 148 Q172 146 180 148" };
  }, [isPanic, isSick, isCryo, isHappy]);

  const animDur = isHappy ? "0.9s" : isCryo ? "1.8s" : "1.25s";

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg viewBox="0 0 320 360" width="100%" height="100%" aria-label="Vault Girl">
        {/* soft background tint */}
        <rect x="0" y="0" width="320" height="360" fill="rgba(0,0,0,0.10)" />

        {/* scanlines */}
        <defs>
          <pattern id="scan" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="2" fill="rgba(0,0,0,0.22)" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="10" y="10" width="300" height="340" rx="18" fill="url(#scan)" opacity="0.14" />

        {/* MAIN DRAW GROUP (gentle bob) */}
        <g className="vg-bob" filter="url(#glow)">
          {/* EGG MODE */}
          {isEgg ? (
            <g>
              <ellipse
                cx="160"
                cy="208"
                rx="72"
                ry="96"
                fill="rgba(119,255,154,0.10)"
                stroke="var(--pip-ink)"
                strokeWidth="3"
              />
              <ellipse
                cx="160"
                cy="208"
                rx="60"
                ry="84"
                fill="rgba(0,0,0,0.10)"
                stroke="var(--pip-border)"
                strokeWidth="2"
              />
              {/* simple face hint */}
              <circle cx="148" cy="204" r="3.5" fill="var(--pip-ink)" opacity="0.75" />
              <circle cx="172" cy="204" r="3.5" fill="var(--pip-ink)" opacity="0.75" />
              <path
                d={isCryo ? "M150 226 L170 226" : "M150 226 Q160 234 170 226"}
                fill="none"
                stroke="var(--pip-ink)"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.75"
              />
            </g>
          ) : (
            /* HATCHED / WALKING VAULT GIRL */
            <g>
              {/* HAIR (bob cut) */}
              <path
                d="M114 138
                   Q118 96 160 96
                   Q204 96 208 140
                   Q208 168 190 186
                   Q176 198 160 198
                   Q144 198 130 186
                   Q114 168 114 138 Z"
                fill="rgba(119,255,154,0.12)"
                stroke="var(--pip-ink)"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              {/* fringe */}
              <path
                d="M128 138 Q142 122 160 124 Q180 122 194 138"
                fill="none"
                stroke="var(--pip-ink)"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* HEAD */}
              <ellipse
                cx="160"
                cy="158"
                rx="28"
                ry="34"
                fill="rgba(0,0,0,0.10)"
                stroke="var(--pip-ink)"
                strokeWidth="3"
              />

              {/* EYES */}
              <circle cx="150" cy="160" r="4" fill="var(--pip-ink)" opacity="0.85" />
              <circle cx="170" cy="160" r="4" fill="var(--pip-ink)" opacity="0.85" />
              {/* tiny highlights */}
              <circle cx="151.5" cy="158.5" r="1.2" fill="rgba(255,255,255,0.7)" />
              <circle cx="171.5" cy="158.5" r="1.2" fill="rgba(255,255,255,0.7)" />

              {/* BROWS + MOUTH */}
              <path d={face.browL} fill="none" stroke="var(--pip-ink)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
              <path d={face.browR} fill="none" stroke="var(--pip-ink)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
              <path d={face.mouth} fill="none" stroke="var(--pip-ink)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />

              {/* BODY (vault suit) */}
              <path
                d="M134 206
                   Q160 188 186 206
                   Q198 218 196 244
                   L192 282
                   Q188 304 176 316
                   Q168 324 160 324
                   Q152 324 144 316
                   Q132 304 128 282
                   L124 244
                   Q122 218 134 206 Z"
                fill="rgba(119,255,154,0.10)"
                stroke="var(--pip-ink)"
                strokeWidth="3"
              />

              {/* collar */}
              <path
                d="M142 214 Q160 230 178 214"
                fill="none"
                stroke="var(--pip-ink)"
                strokeWidth="3"
                opacity="0.75"
              />

              {/* zipper */}
              <path d="M160 206 L160 322" stroke="var(--pip-ink)" strokeWidth="3" opacity="0.35" />

              {/* vault number */}
              <text
                x="160"
                y="262"
                textAnchor="middle"
                fontSize="28"
                fontWeight="800"
                fill="var(--pip-ink)"
                opacity="0.55"
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
              >
                {vaultNumber}
              </text>

              {/* ARMS (slimmer, more human-like) */}
              <path
                d="M126 244
                   Q102 258 108 286
                   Q116 308 140 302"
                fill="none"
                stroke="var(--pip-ink)"
                strokeWidth="9"
                strokeLinecap="round"
              />
              <path
                d="M194 244
                   Q220 260 210 292
                   Q202 308 182 302"
                fill="none"
                stroke="var(--pip-ink)"
                strokeWidth="9"
                strokeLinecap="round"
              />

              {/* LEGS (walking pose) */}
              <path
                d="M154 324
                   Q142 350 154 360"
                fill="none"
                stroke="var(--pip-ink)"
                strokeWidth="9"
                strokeLinecap="round"
                opacity="0.85"
              />
              <path
                d="M168 324
                   Q186 346 200 356"
                fill="none"
                stroke="var(--pip-ink)"
                strokeWidth="9"
                strokeLinecap="round"
              />

              {/* shoes */}
              <ellipse cx="154" cy="362" rx="11" ry="5.5" fill="var(--pip-ink)" opacity="0.75" />
              <ellipse cx="204" cy="360" rx="11" ry="5.5" fill="var(--pip-ink)" opacity="0.75" />
            </g>
          )}
        </g>
      </svg>

      {/* Only animation here. NO TEXT. */}
      <style jsx>{`
        .vg-bob {
          transform-origin: 160px 230px;
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

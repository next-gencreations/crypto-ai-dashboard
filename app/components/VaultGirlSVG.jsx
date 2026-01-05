"use client";

import React, { useMemo } from "react";

/**
 * Full-body Vault Girl (female) with:
 * - Health-based damage FX (cracks, flicker)
 * - Win/Loss reaction (pulse/shake + expression)
 * - In-position stance (alert posture + scanline)
 * - Uses currentColor for easy theming
 *
 * Recommended props from your API:
 *   health: 0..100
 *   openPositions: number
 *   lastPnl: number (positive/negative) OR lastTradePnl
 *   stage: "cryo" | "awake"
 *   mood: optional override ("happy" | "sad" | "hurt" | "angry" | "neutral" | "cryo")
 */
export default function VaultGirlSVG({
  mood,
  stage = "cryo",
  vaultNumber = "13",

  health = 100,           // 0..100
  openPositions = 0,      // 0+ (if >0 alert posture)
  lastPnl = 0,            // +/- number, used for win/loss reaction
  isTrading = false,      // optional: if true show subtle "activity" scanline

  className = "",
  style = {},
  showDebugTag = false,
}) {
  const isCryo = String(stage).toLowerCase() === "cryo";
  const alert = Number(openPositions) > 0;

  const h = Math.max(0, Math.min(100, Number(health)));
  const damage = 1 - h / 100; // 0..1
  const pnl = Number(lastPnl) || 0;

  // Decide "reaction" mood if mood isn't forced
  const derivedMood = useMemo(() => {
    if (mood) return String(mood).toLowerCase();
    if (isCryo) return "cryo";
    if (pnl > 0.01) return "happy";
    if (pnl < -0.01) return damage > 0.35 ? "hurt" : "sad";
    return "neutral";
  }, [mood, isCryo, pnl, damage]);

  // Expressions
  const mouthPath =
    derivedMood === "happy"
      ? "M 168 140 C 176 152 192 152 200 140"
      : derivedMood === "sad" || derivedMood === "hurt"
      ? "M 168 148 C 176 136 192 136 200 148"
      : derivedMood === "angry"
      ? "M 170 146 L 198 146"
      : "M 168 146 C 176 149 192 149 200 146";

  const browLeft =
    derivedMood === "angry" ? "M 156 118 L 170 112"
    : derivedMood === "sad" ? "M 156 112 L 170 118"
    : derivedMood === "hurt" ? "M 156 116 L 170 114"
    : "M 156 116 L 170 116";

  const browRight =
    derivedMood === "angry" ? "M 198 112 L 212 118"
    : derivedMood === "sad" ? "M 198 118 L 212 112"
    : derivedMood === "hurt" ? "M 198 114 L 212 116"
    : "M 198 116 L 212 116";

  // FX strengths
  const glassOpacity = isCryo ? 0.22 : 0.0;
  const frostOpacity = isCryo ? 0.18 : 0.0;

  const crackOpacity = Math.min(0.75, Math.max(0, damage * 1.25));      // 0..~0.75
  const glowDim = 0.30 + (1 - damage) * 0.70;                           // 0.30..1.0
  const shakeOnLoss = pnl < -0.01 ? 1 : 0;
  const pulseOnWin = pnl > 0.01 ? 1 : 0;

  // Alert posture offsets
  const bodyTilt = alert ? -2.5 : 0;
  const armTension = alert ? 8 : 0;
  const scanlineOn = alert || isTrading;

  // A unique-ish id scope to avoid clashes if multiple SVGs appear
  const uid = useMemo(() => `vg_${Math.random().toString(16).slice(2)}`, []);

  return (
    <div className={className} style={{ width: "100%", maxWidth: 520, margin: "0 auto", ...style }}>
      <svg viewBox="0 0 360 640" width="100%" height="auto" role="img" aria-label="Vault Girl">
        <defs>
          <filter id={`${uid}_softGlow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id={`${uid}_glassGrad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.08" />
          </linearGradient>

          <linearGradient id={`${uid}_scanGrad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.10" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>

          {/* Animations */}
          <style>{`
            @keyframes ${uid}_pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.02); opacity: 0.98; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes ${uid}_shake {
              0% { transform: translate(0px, 0px) rotate(0deg); }
              15% { transform: translate(-1px, 0px) rotate(-0.4deg); }
              30% { transform: translate(1px, 0px) rotate(0.4deg); }
              45% { transform: translate(-1px, 0px) rotate(-0.3deg); }
              60% { transform: translate(1px, 0px) rotate(0.3deg); }
              75% { transform: translate(-1px, 0px) rotate(-0.2deg); }
              100% { transform: translate(0px, 0px) rotate(0deg); }
            }
            @keyframes ${uid}_scanline {
              0% { transform: translateY(70px); opacity: 0; }
              15% { opacity: 0.12; }
              50% { opacity: 0.08; }
              85% { opacity: 0.12; }
              100% { transform: translateY(520px); opacity: 0; }
            }
            @keyframes ${uid}_flicker {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.92; }
              70% { opacity: 0.98; }
            }
          `}</style>
        </defs>

        {/* Wrap whole scene for win/loss motion */}
        <g
          style={{
            transformOrigin: "180px 320px",
            animation:
              (pulseOnWin ? `${uid}_pulse 1.2s ease-in-out infinite` : "") +
              (shakeOnLoss ? (pulseOnWin ? ", " : "") + `${uid}_shake 0.6s linear infinite` : ""),
            opacity: glowDim,
          }}
        >
          {/* Outer pod */}
          <g
            filter={`url(#${uid}_softGlow)`}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="56" y="40" width="248" height="520" rx="42" opacity="0.35" />
            <rect x="76" y="62" width="208" height="476" rx="34" opacity="0.35" />
          </g>

          {/* Cryo glass overlay */}
          <g>
            <rect
              x="76"
              y="62"
              width="208"
              height="476"
              rx="34"
              fill={`url(#${uid}_glassGrad)`}
              opacity={glassOpacity}
            />
            {/* Frost */}
            <g fill="currentColor" opacity={frostOpacity}>
              <circle cx="110" cy="120" r="2" />
              <circle cx="250" cy="170" r="2" />
              <circle cx="140" cy="220" r="1.8" />
              <circle cx="230" cy="260" r="1.6" />
              <circle cx="120" cy="310" r="1.6" />
              <circle cx="240" cy="360" r="2" />
              <circle cx="150" cy="430" r="1.6" />
              <circle cx="210" cy="480" r="1.8" />
            </g>
          </g>

          {/* Cracks (health-based) */}
          <g
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            opacity={crackOpacity}
            style={{
              animation: damage > 0.55 ? `${uid}_flicker 1.4s ease-in-out infinite` : "none",
            }}
          >
            {/* top-left crack */}
            <path d="M 98 110 L 122 132 L 110 156 L 132 175" opacity={0.9} />
            <path d="M 122 132 L 146 124" opacity={0.7} />
            <path d="M 110 156 L 92 176" opacity={0.6} />

            {/* mid-right crack */}
            <path d="M 258 260 L 234 282 L 246 310 L 224 338" opacity={0.85} />
            <path d="M 234 282 L 214 268" opacity={0.6} />
            <path d="M 246 310 L 266 334" opacity={0.55} />

            {/* lower crack */}
            <path d="M 120 420 L 154 440 L 132 472 L 168 490" opacity={0.75} />
          </g>

          {/* Optional scanline when trading / in position */}
          {scanlineOn && (
            <g
              opacity={0.25}
              style={{
                animation: `${uid}_scanline 2.2s linear infinite`,
              }}
            >
              <rect x="76" y="62" width="208" height="56" fill={`url(#${uid}_scanGrad)`} />
            </g>
          )}

          {/* Vault Girl - full body female */}
          <g
            filter={`url(#${uid}_softGlow)`}
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transformOrigin: "180px 360px",
              transform: `rotate(${bodyTilt}deg)`,
            }}
          >
            {/* Head */}
            <circle cx="180" cy="130" r="54" />

            {/* Hair (bob) */}
            <path d="M 140 112 C 150 82 210 82 220 112" />
            <path d="M 132 128 C 132 96 156 90 168 92" />
            <path d="M 228 128 C 228 96 204 90 192 92" />
            <path d="M 142 172 C 150 182 210 182 218 172" />

            {/* Eyes */}
            <circle cx="162" cy="132" r="4" />
            <circle cx="198" cy="132" r="4" />

            {/* Brows */}
            <path d={browLeft} strokeWidth="7" />
            <path d={browRight} strokeWidth="7" />

            {/* Nose */}
            <path d="M 182 136 L 176 146" strokeWidth="6" opacity="0.9" />

            {/* Mouth */}
            <path d={mouthPath} strokeWidth="7" />

            {/* Neck */}
            <path d="M 166 182 L 166 198" strokeWidth="8" />
            <path d="M 194 182 L 194 198" strokeWidth="8" />

            {/* Torso / suit */}
            <path d="M 132 220 C 145 200 215 200 228 220" />
            <path d="M 132 220 C 112 265 112 335 140 372" />
            <path d="M 228 220 C 248 265 248 335 220 372" />

            {/* Chest seam */}
            <path d="M 180 206 L 180 410" strokeWidth="7" opacity="0.9" />

            {/* Belt */}
            <path d="M 142 372 C 165 390 195 390 218 372" />

            {/* Vault number */}
            <text
              x="180"
              y="350"
              textAnchor="middle"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
              fontSize="48"
              fill="currentColor"
              stroke="none"
              opacity="0.95"
            >
              {String(vaultNumber)}
            </text>

            {/* Arms (more “tension” when alert) */}
            <path d={`M 136 250 C ${108 - armTension} 286 ${100 - armTension} 320 112 350`} />
            <path d={`M 224 250 C ${252 + armTension} 286 ${260 + armTension} 320 248 350`} />

            {/* Hands */}
            <path d="M 112 350 C 120 360 132 360 140 350" strokeWidth="8" />
            <path d="M 248 350 C 240 360 228 360 220 350" strokeWidth="8" />

            {/* Hips */}
            <path d="M 140 372 C 150 420 150 455 165 495" />
            <path d="M 220 372 C 210 420 210 455 195 495" />

            {/* Legs */}
            <path d="M 165 495 C 150 535 150 560 160 586" />
            <path d="M 195 495 C 210 535 210 560 200 586" />

            {/* Feet */}
            <path d="M 148 590 C 160 602 182 602 196 590" strokeWidth="9" />
          </g>

          {/* Damage marks on suit when health low */}
          {damage > 0.35 && (
            <g stroke="currentColor" strokeWidth="6" fill="none" opacity={Math.min(0.7, damage)}>
              <path d="M 150 305 L 162 292" />
              <path d="M 214 322 L 228 310" />
              <path d="M 170 450 L 186 436" />
            </g>
          )}

          {/* Debug */}
          {showDebugTag && (
            <text
              x="180"
              y="610"
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
              fontSize="18"
              fill="currentColor"
              opacity="0.65"
            >
              FULLBODY_VG • mood:{derivedMood} • stage:{stage} • hp:{h} • pos:{openPositions} • pnl:{pnl}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}

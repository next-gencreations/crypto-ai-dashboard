"use client";

import React, { useMemo } from "react";

/**
 * More “Vault Girl” full-body style:
 * - Curvier silhouette, hair + goggles
 * - Thumbs-up pose (left), hand-on-hip (right)
 * - Keeps your FX: cracks/flicker, scanline, win/loss pulse/shake
 */
export default function VaultGirlSVG({
  mood,
  stage = "cryo",
  vaultNumber = "13",

  health = 100,
  openPositions = 0,
  lastPnl = 0,
  isTrading = false,

  className = "",
  style = {},
  showDebugTag = false,
}) {
  const isCryo = String(stage).toLowerCase() === "cryo";
  const alert = Number(openPositions) > 0;

  const h = Math.max(0, Math.min(100, Number(health)));
  const damage = 1 - h / 100;
  const pnl = Number(lastPnl) || 0;

  const derivedMood = useMemo(() => {
    if (mood) return String(mood).toLowerCase();
    if (isCryo) return "cryo";
    if (pnl > 0.01) return "happy";
    if (pnl < -0.01) return damage > 0.35 ? "hurt" : "sad";
    return "neutral";
  }, [mood, isCryo, pnl, damage]);

  // Expressions (simple but readable)
  const mouthPath =
    derivedMood === "happy"
      ? "M 168 148 C 176 158 192 158 200 148"
      : derivedMood === "sad" || derivedMood === "hurt"
      ? "M 168 156 C 176 146 192 146 200 156"
      : derivedMood === "angry"
      ? "M 170 154 L 198 154"
      : "M 168 154 C 176 157 192 157 200 154";

  const browLeft =
    derivedMood === "angry"
      ? "M 154 128 L 171 121"
      : derivedMood === "sad"
      ? "M 154 122 L 171 128"
      : derivedMood === "hurt"
      ? "M 154 126 L 171 124"
      : "M 154 126 L 171 126";

  const browRight =
    derivedMood === "angry"
      ? "M 189 121 L 206 128"
      : derivedMood === "sad"
      ? "M 189 128 L 206 122"
      : derivedMood === "hurt"
      ? "M 189 124 L 206 126"
      : "M 189 126 L 206 126";

  const glassOpacity = isCryo ? 0.22 : 0.0;
  const frostOpacity = isCryo ? 0.18 : 0.0;

  const crackOpacity = Math.min(0.75, Math.max(0, damage * 1.25));
  const glowDim = 0.30 + (1 - damage) * 0.70;
  const shakeOnLoss = pnl < -0.01 ? 1 : 0;
  const pulseOnWin = pnl > 0.01 ? 1 : 0;

  const bodyTilt = alert ? -2.5 : 0;
  const scanlineOn = alert || isTrading;

  const uid = useMemo(() => `vg_${Math.random().toString(16).slice(2)}`, []);

  return (
    <div
      className={className}
      style={{ width: "100%", maxWidth: 520, margin: "0 auto", ...style }}
    >
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

        {/* Whole scene motion */}
        <g
          style={{
            transformOrigin: "180px 320px",
            animation:
              (pulseOnWin ? `${uid}_pulse 1.2s ease-in-out infinite` : "") +
              (shakeOnLoss ? (pulseOnWin ? ", " : "") + `${uid}_shake 0.6s linear infinite` : ""),
            opacity: glowDim,
          }}
        >
          {/* Pod */}
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

          {/* Cryo glass */}
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

          {/* Cracks */}
          <g
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            opacity={crackOpacity}
            style={{ animation: damage > 0.55 ? `${uid}_flicker 1.4s ease-in-out infinite` : "none" }}
          >
            <path d="M 98 110 L 122 132 L 110 156 L 132 175" opacity={0.9} />
            <path d="M 122 132 L 146 124" opacity={0.7} />
            <path d="M 110 156 L 92 176" opacity={0.6} />

            <path d="M 258 260 L 234 282 L 246 310 L 224 338" opacity={0.85} />
            <path d="M 234 282 L 214 268" opacity={0.6} />
            <path d="M 246 310 L 266 334" opacity={0.55} />

            <path d="M 120 420 L 154 440 L 132 472 L 168 490" opacity={0.75} />
          </g>

          {/* Scanline */}
          {scanlineOn && (
            <g opacity={0.25} style={{ animation: `${uid}_scanline 2.2s linear infinite` }}>
              <rect x="76" y="62" width="208" height="56" fill={`url(#${uid}_scanGrad)`} />
            </g>
          )}

          {/* === NEW VAULT GIRL DRAWING (more like your reference) === */}
          <g
            filter={`url(#${uid}_softGlow)`}
            stroke="currentColor"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transformOrigin: "180px 360px",
              transform: `rotate(${bodyTilt}deg)`,
            }}
          >
            {/* Hair silhouette (long swoop) */}
            <path d="M 118 150
                     C 110 105 145 78 180 80
                     C 225 82 252 112 244 154
                     C 238 190 216 206 206 214
                     C 230 210 250 198 258 182
                     C 254 240 202 238 178 226
                     C 154 238 106 228 104 184
                     C 114 200 134 210 150 212
                     C 132 200 122 188 118 150" />

            {/* Head (slightly oval) */}
            <path d="M 136 130
                     C 138 105 158 90 180 90
                     C 202 90 222 105 224 130
                     C 226 158 208 178 180 178
                     C 152 178 134 158 136 130" />

            {/* Goggles on head */}
            <path d="M 145 98 C 156 88 170 86 180 90 C 190 86 204 88 215 98" strokeWidth="8" />
            <rect x="146" y="92" width="44" height="26" rx="10" />
            <rect x="190" y="92" width="44" height="26" rx="10" />
            <path d="M 190 105 L 190 105" />
            <path d="M 190 105 L 190 105" />
            <path d="M 190 105 L 190 105" />
            <path d="M 190 105 L 190 105" />

            {/* Face */}
            <circle cx="166" cy="134" r="4" />
            <circle cx="198" cy="134" r="4" />
            <path d={browLeft} strokeWidth="6" />
            <path d={browRight} strokeWidth="6" />
            <path d="M 184 138 L 178 148" strokeWidth="6" opacity="0.9" />
            <path d={mouthPath} strokeWidth="6" />

            {/* Neck */}
            <path d="M 168 178 L 168 194" strokeWidth="7" />
            <path d="M 192 178 L 192 194" strokeWidth="7" />

            {/* Torso (curvier) */}
            <path d="M 140 212
                     C 154 198 206 198 220 212" />
            <path d="M 140 212
                     C 116 254 124 320 148 354
                     C 162 372 198 372 212 354
                     C 236 320 244 254 220 212" />

            {/* Chest curve + center seam */}
            <path d="M 150 240 C 164 228 176 228 180 236 C 184 228 196 228 210 240" strokeWidth="7" />
            <path d="M 180 212 L 180 394" strokeWidth="7" opacity="0.95" />

            {/* Belt */}
            <path d="M 148 356 C 165 374 195 374 212 356" />

            {/* Vault number */}
            <text
              x="180"
              y="342"
              textAnchor="middle"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
              fontSize="44"
              fill="currentColor"
              stroke="none"
              opacity="0.95"
            >
              {String(vaultNumber)}
            </text>

            {/* LEFT ARM (thumbs up) */}
            <path d="M 150 250 C 118 250 98 238 86 220" />
            <path d="M 86 220 C 78 208 78 198 86 192" />
            {/* thumb + fist */}
            <path d="M 86 192 C 92 176 104 176 106 190" strokeWidth="8" />
            <path d="M 106 190 C 118 198 118 214 108 222" strokeWidth="8" />
            <path d="M 108 222 C 100 228 92 228 86 220" strokeWidth="8" />

            {/* RIGHT ARM (hand on hip) */}
            <path d="M 210 252 C 238 264 244 296 228 318" />
            <path d="M 228 318 C 220 330 210 338 198 342" strokeWidth="8" />
            <path d="M 198 342 C 210 348 222 346 230 336" strokeWidth="8" />

            {/* Hips + legs (curvy stance) */}
            <path d="M 154 360 C 146 410 148 448 160 488" />
            <path d="M 206 360 C 216 410 214 448 202 488" />

            <path d="M 160 488 C 146 530 150 560 160 586" />
            <path d="M 202 488 C 216 530 212 560 202 586" />

            {/* Feet */}
            <path d="M 146 590 C 160 604 182 604 196 590" strokeWidth="9" />
            <path d="M 186 590 C 202 604 224 604 238 590" strokeWidth="9" />
          </g>

          {/* Damage marks on suit */}
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
              VG_CARTOON_V4 • mood:{derivedMood} • stage:{stage} • hp:{h} • pos:{openPositions} • pnl:{pnl}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}

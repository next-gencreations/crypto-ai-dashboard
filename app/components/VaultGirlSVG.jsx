"use client";

import React, { useMemo } from "react";

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

  const mouthPath =
    derivedMood === "happy"
      ? "M 168 152 C 176 162 192 162 200 152"
      : derivedMood === "sad" || derivedMood === "hurt"
      ? "M 168 160 C 176 150 192 150 200 160"
      : derivedMood === "angry"
      ? "M 170 158 L 198 158"
      : "M 168 158 C 176 161 192 161 200 158";

  const browLeft =
    derivedMood === "angry"
      ? "M 154 132 L 171 125"
      : derivedMood === "sad"
      ? "M 154 126 L 171 132"
      : derivedMood === "hurt"
      ? "M 154 130 L 171 128"
      : "M 154 130 L 171 130";

  const browRight =
    derivedMood === "angry"
      ? "M 189 125 L 206 132"
      : derivedMood === "sad"
      ? "M 189 132 L 206 126"
      : derivedMood === "hurt"
      ? "M 189 128 L 206 130"
      : "M 189 130 L 206 130";

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
            <path d="M 120 420 L 154 440 L 132 472 L 168 490" opacity={0.75} />
          </g>

          {/* Scanline */}
          {scanlineOn && (
            <g opacity={0.25} style={{ animation: `${uid}_scanline 2.2s linear infinite` }}>
              <rect x="76" y="62" width="208" height="56" fill={`url(#${uid}_scanGrad)`} />
            </g>
          )}

          {/* Vault Girl – clearly feminine silhouette */}
          <g
            filter={`url(#${uid}_softGlow)`}
            stroke="currentColor"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transformOrigin: "180px 360px", transform: `rotate(${bodyTilt}deg)` }}
          >
            {/* Hair (NOT a hood): side-swept + ends */}
            <path d="M 122 150 C 120 110 146 86 180 86 C 214 86 240 110 238 150" />
            <path d="M 122 150 C 126 188 150 206 166 214" />
            <path d="M 238 150 C 234 188 210 206 194 214" />
            <path d="M 150 214 C 140 226 132 232 126 238" />
            <path d="M 210 214 C 220 226 228 232 234 238" />

            {/* Head */}
            <path d="M 140 132 C 142 108 160 94 180 94 C 200 94 218 108 220 132 C 222 156 206 174 180 174 C 154 174 138 156 140 132" />

            {/* Goggles */}
            <path d="M 146 104 C 158 94 170 92 180 96 C 190 92 202 94 214 104" strokeWidth="8" />
            <rect x="148" y="98" width="40" height="24" rx="10" />
            <rect x="192" y="98" width="40" height="24" rx="10" />
            <path d="M 188 110 L 192 110" />

            {/* Face */}
            <circle cx="166" cy="136" r="4" />
            <circle cx="198" cy="136" r="4" />
            <path d={browLeft} strokeWidth="6" />
            <path d={browRight} strokeWidth="6" />
            <path d="M 184 140 L 178 150" strokeWidth="6" opacity="0.9" />
            <path d={mouthPath} strokeWidth="6" />

            {/* Neck */}
            <path d="M 168 174 L 168 194" strokeWidth="7" />
            <path d="M 192 174 L 192 194" strokeWidth="7" />

            {/* Suit torso: shoulders → waist → hips (hourglass) */}
            <path d="M 140 214 C 154 200 206 200 220 214" />
            <path d="M 140 214
                     C 126 252 134 300 150 328
                     C 160 344 172 352 180 352
                     C 188 352 200 344 210 328
                     C 226 300 234 252 220 214" />

            {/* Bust curve + zipper */}
            <path d="M 150 242 C 164 232 176 232 180 240 C 184 232 196 232 210 242" strokeWidth="7" />
            <path d="M 180 214 L 180 392" strokeWidth="7" opacity="0.95" />

            {/* Belt */}
            <path d="M 150 352 C 166 370 194 370 210 352" />

            {/* Vault number */}
            <text
              x="180"
              y="340"
              textAnchor="middle"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
              fontSize="44"
              fill="currentColor"
              stroke="none"
              opacity="0.95"
            >
              {String(vaultNumber)}
            </text>

            {/* LEFT arm: thumbs-up (clear hand) */}
            <path d="M 152 252 C 118 252 98 240 86 222" />
            <path d="M 86 222 C 78 210 80 198 92 192" />
            <path d="M 92 192 C 96 176 110 176 112 190" strokeWidth="8" />
            <path d="M 112 190 C 124 198 124 214 114 222" strokeWidth="8" />
            <path d="M 114 222 C 104 230 94 230 86 222" strokeWidth="8" />

            {/* RIGHT arm: hand on hip */}
            <path d="M 208 254 C 234 270 238 300 224 320" />
            <path d="M 224 320 C 214 336 202 344 190 348" strokeWidth="8" />
            <path d="M 190 348 C 204 354 220 350 230 336" strokeWidth="8" />

            {/* Hips + legs: thicker + feminine stance */}
            <path d="M 152 358 C 142 404 146 452 162 492" />
            <path d="M 208 358 C 218 404 214 452 198 492" />

            <path d="M 162 492 C 148 530 152 562 164 588" />
            <path d="M 198 492 C 212 530 208 562 196 588" />

            {/* Feet */}
            <path d="M 150 590 C 164 604 186 604 200 590" strokeWidth="9" />
            <path d="M 184 590 C 200 604 222 604 236 590" strokeWidth="9" />
          </g>

          {/* Damage marks */}
          {damage > 0.35 && (
            <g stroke="currentColor" strokeWidth="6" fill="none" opacity={Math.min(0.7, damage)}>
              <path d="M 150 305 L 162 292" />
              <path d="M 214 322 L 228 310" />
              <path d="M 170 450 L 186 436" />
            </g>
          )}

          {showDebugTag && (
            <text x="180" y="610" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="18" fill="currentColor" opacity="0.65">
              VG_CARTOON_V5 • mood:{derivedMood} • stage:{stage} • hp:{h} • pos:{openPositions} • pnl:{pnl}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}

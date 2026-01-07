"use client";

import React, { useMemo } from "react";

/**
 * VaultGirlSVG (Cortana-style hologram, tasteful tech-suit)
 * - More realistic feminine silhouette (no “pregnant” belly)
 * - Rim-glow + volumetric aura + internal contour lines
 * - Hair + face kept minimal (no uncanny)
 * - Reacts to: isTrading, lastPnl, openPositions, health, mood/stage
 */
export default function VaultGirlSVG({
  mood = "cryo",
  stage = "cryo",
  vaultNumber = "13",
  health = 100,
  openPositions = 0,
  lastPnl = 0,
  isTrading = false,
  showDebugTag = false,
}) {
  const safeHealth = Number.isFinite(Number(health))
    ? Math.max(0, Math.min(100, Number(health)))
    : 100;

  const pnl = Number.isFinite(Number(lastPnl)) ? Number(lastPnl) : 0;
  const pos = Number.isFinite(Number(openPositions)) ? Number(openPositions) : 0;

  const trading = !!isTrading;
  const pnlUp = pnl > 0;
  const pnlDown = pnl < 0;

  const pulseSpeed = useMemo(() => {
    const base = trading ? 1.1 : 1.85;
    const posAdj = Math.max(0, Math.min(0.75, pos * 0.08));
    return Math.max(0.75, base - posAdj);
  }, [trading, pos]);

  const glow = useMemo(() => {
    const h = safeHealth / 100;
    const base = 0.55 + h * 0.45;
    const tradeBoost = trading ? 0.22 : 0;
    const posBoost = Math.min(0.18, pos * 0.03);
    return Math.max(0.35, Math.min(1.25, base + tradeBoost + posBoost));
  }, [safeHealth, trading, pos]);

  const damageLevel = useMemo(() => {
    if (safeHealth >= 80) return 0;
    if (safeHealth >= 55) return 1;
    if (safeHealth >= 30) return 2;
    return 3;
  }, [safeHealth]);

  const ringState = useMemo(() => {
    const s = String(stage || "").toLowerCase();
    const m = String(mood || "").toLowerCase();
    if (s.includes("cryo") || m.includes("cryo")) return "CRYO";
    if (m.includes("panic") || m.includes("angry") || m.includes("alert")) return "ALERT";
    return "NOMINAL";
  }, [stage, mood]);

  const statusText = useMemo(() => {
    if (!trading) return "IDLE";
    if (pnlUp) return "TRADING · PROFIT";
    if (pnlDown) return "TRADING · LOSS";
    return "TRADING · ACTIVE";
  }, [trading, pnlUp, pnlDown]);

  const accentStroke = pnlDown
    ? "var(--pip-down, rgba(255,80,80,0.95))"
    : "var(--pip-up, rgba(0,255,160,0.95))";

  const accentFill = pnlDown
    ? "var(--pip-down-fill, rgba(255,80,80,0.18))"
    : "var(--pip-up-fill, rgba(0,255,160,0.18))";

  const rim = "rgba(220,255,245,0.92)";
  const edge = "rgba(185,255,225,0.70)";
  const edgeDim = "rgba(155,255,205,0.46)";
  const inner = "rgba(120,255,170,0.16)";

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <svg viewBox="0 0 520 520" width="100%" height="100%" role="img" aria-label="Vault hologram companion">
        <defs>
          <filter id="pipGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={8 * glow} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="rimGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={3.2 * glow} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="aura" cx="50%" cy="42%" r="82%">
            <stop offset="0%" stopColor="rgba(230,255,248,0.28)" />
            <stop offset="35%" stopColor="rgba(120,255,170,0.14)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          <radialGradient id="core" cx="50%" cy="18%" r="92%">
            <stop offset="0%" stopColor="rgba(230,255,248,0.18)" />
            <stop offset="55%" stopColor="rgba(120,255,170,0.10)" />
            <stop offset="100%" stopColor="rgba(120,255,170,0.06)" />
          </radialGradient>

          <linearGradient id="rimSweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="12%" stopColor="rgba(230,255,245,0.16)" />
            <stop offset="50%" stopColor="rgba(230,255,245,0.04)" />
            <stop offset="88%" stopColor="rgba(230,255,245,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(210,255,238,0.22)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <radialGradient id="vignette" cx="50%" cy="45%" r="72%">
            <stop offset="55%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
          </radialGradient>

          <pattern id="scan" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="6" height="1" fill="rgba(120,255,170,0.06)" />
          </pattern>

          <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="rgba(120,255,170,0.10)" />
          </pattern>

          <clipPath id="portraitClip">
            <rect x="70" y="96" width="380" height="350" rx="22" />
          </clipPath>
        </defs>

        <rect x="0" y="0" width="520" height="520" fill="rgba(0,0,0,0.06)" />
        <rect x="0" y="0" width="520" height="520" fill="url(#dots)" opacity="0.35" />

        <g filter="url(#pipGlow)">
          <rect x="26" y="26" width="468" height="468" rx="28" fill="rgba(0,0,0,0.22)" stroke="rgba(120,255,170,0.30)" strokeWidth="2" />
          <rect x="46" y="46" width="428" height="428" rx="24" fill="rgba(0,0,0,0.16)" stroke="rgba(120,255,170,0.18)" strokeWidth="2" />
        </g>

        <g style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
          <text x="58" y="84" fontSize="16" fill="rgba(170,255,210,0.95)" letterSpacing="3">
            VAULT COMPANION · HOLOGRAM
          </text>
          <text x="58" y="108" fontSize="12" fill="rgba(120,255,170,0.80)" letterSpacing="2">
            VAULT {String(vaultNumber || "13")} · {ringState} · {statusText}
          </text>
        </g>

        <g clipPath="url(#portraitClip)">
          <rect x="70" y="96" width="380" height="350" rx="22" fill="rgba(0,0,0,0.12)" stroke="rgba(120,255,170,0.18)" />
          <circle cx="260" cy="250" r="182" fill="url(#aura)" opacity="0.95" />

          {trading && (
            <rect x="-120" y="96" width="160" height="350" fill="url(#shimmer)" opacity="0.7">
              <animateTransform attributeName="transform" type="translate" from="0 0" to="760 0" dur="2.15s" repeatCount="indefinite" />
            </rect>
          )}

          <g filter="url(#pipGlow)">
            <g>
              <animateTransform attributeName="transform" type="translate" values="0 0; 0 -2.5; 0 0" dur={`${pulseSpeed}s`} repeatCount="indefinite" />

              {/* Hair */}
              <path
                d="M206 212 C198 174 226 146 262 146
                   C304 146 332 176 330 220
                   C328 262 300 282 282 296
                   C304 274 314 246 312 222
                   C310 190 288 172 262 172
                   C238 172 222 188 214 208
                   C208 222 204 226 198 228
                   C200 222 204 218 206 212 Z"
                fill="rgba(180,255,220,0.08)"
                stroke={edgeDim}
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <path d="M314 230 C346 256 346 318 308 350" fill="none" stroke={edgeDim} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
              <path d="M206 232 C176 258 176 318 214 352" fill="none" stroke={edgeDim} strokeWidth="3" strokeLinecap="round" opacity="0.55" />

              {/* Head */}
              <path
                d="M260 142 C292 142 318 168 318 200
                   C318 232 292 258 260 258
                   C228 258 202 232 202 200
                   C202 168 228 142 260 142 Z"
                fill="url(#core)"
                stroke={edge}
                strokeWidth="3.2"
              />

              {/* Face minimal */}
              <path d="M238 208 C248 202 256 202 264 208" fill="none" stroke={rim} strokeWidth="3" strokeLinecap="round" opacity="0.65" />
              <path d="M256 208 C266 202 274 202 282 208" fill="none" stroke={rim} strokeWidth="3" strokeLinecap="round" opacity="0.65" />
              <path d="M244 238 C254 248 266 248 276 238" fill="none" stroke={rim} strokeWidth="3" strokeLinecap="round" opacity="0.55" />

              {/* Neck */}
              <path
                d="M244 258 C246 276 254 286 260 288 C266 286 274 276 276 258"
                fill="rgba(120,255,170,0.06)"
                stroke={edgeDim}
                strokeWidth="3"
              />

              {/* Body (flat abdomen) */}
              <path
                d="M210 318
                   C228 304 246 298 260 298
                   C274 298 292 304 310 318
                   C330 334 338 360 336 386
                   C334 412 322 432 304 448
                   C290 460 276 466 260 468
                   C244 466 230 460 216 448
                   C198 432 186 412 184 386
                   C182 360 190 334 210 318 Z"
                fill="url(#core)"
                stroke={edge}
                strokeWidth="3.2"
                strokeLinejoin="round"
              />

              {/* Arms */}
              <path d="M206 340 C190 362 188 392 198 412 C206 428 218 440 232 444" fill="none" stroke={edgeDim} strokeWidth="3.2" strokeLinecap="round" />
              <path d="M314 340 C332 360 334 390 324 410 C316 428 304 440 290 446" fill="none" stroke={edgeDim} strokeWidth="3.2" strokeLinecap="round" />

              {/* Legs */}
              <path
                d="M244 468 C240 490 234 502 230 514
                   C228 520 232 526 240 528
                   C250 530 258 524 260 518
                   C262 508 260 496 262 468 Z"
                fill="rgba(120,255,170,0.08)"
                stroke={edgeDim}
                strokeWidth="3"
              />
              <path
                d="M276 468 C280 496 278 508 280 518
                   C282 524 290 530 300 528
                   C308 526 312 520 310 514
                   C306 502 300 490 296 468 Z"
                fill="rgba(120,255,170,0.08)"
                stroke={edgeDim}
                strokeWidth="3"
              />

              {/* Contour lines */}
              <path d="M260 298 L260 468" fill="none" stroke="rgba(170,255,210,0.22)" strokeWidth="3" />
              <path d="M224 350 C240 338 250 334 260 334 C270 334 280 338 296 350" fill="none" stroke={inner} strokeWidth="3" opacity="0.85" />
              <path d="M220 384 C242 372 250 370 260 370 C270 370 278 372 300 384" fill="none" stroke={inner} strokeWidth="3" opacity="0.70" />
              <path d="M224 414 C244 426 252 430 260 430 C268 430 276 426 296 414" fill="none" stroke={inner} strokeWidth="3" opacity="0.55" />

              {/* Chest core light */}
              <circle cx="260" cy="340" r="6.5" fill="rgba(230,255,248,0.55)" opacity="0.9" />
              <circle cx="260" cy="340" r="18" fill="rgba(120,255,170,0.12)" opacity="0.7" />

              {/* Rim highlight sweep */}
              <path
                d="M210 318
                   C228 304 246 298 260 298
                   C274 298 292 304 310 318
                   C330 334 338 360 336 386
                   C334 412 322 432 304 448
                   C290 460 276 466 260 468
                   C244 466 230 460 216 448
                   C198 432 186 412 184 386
                   C182 360 190 334 210 318 Z"
                fill="url(#rimSweep)"
                opacity="0.95"
                filter="url(#rimGlow)"
              />
            </g>
          </g>

          {trading && (
            <g opacity="0.88">
              <circle cx="260" cy="260" r="150" fill="none" stroke={accentStroke} strokeWidth="3" opacity="0.30">
                <animate attributeName="opacity" values="0.10;0.55;0.10" dur={`${pulseSpeed}s`} repeatCount="indefinite" />
              </circle>
              <circle cx="260" cy="260" r="120" fill={accentFill} stroke={accentStroke} strokeWidth="2" opacity="0.16">
                <animate attributeName="opacity" values="0.06;0.28;0.06" dur={`${pulseSpeed}s`} repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {damageLevel >= 2 && (
            <>
              <rect x="78" y="160" width="364" height="8" fill="rgba(255,80,80,0.20)" opacity="0.30" />
              <rect x="78" y="268" width="364" height="6" fill="rgba(255,80,80,0.14)" opacity="0.22" />
            </>
          )}
        </g>

        <g style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
          <text x="58" y="468" fontSize="12" fill="rgba(120,255,170,0.78)" letterSpacing="2">
            POS: {pos} · HEALTH: {safeHealth.toFixed(0)}% · PNL: {pnl > 0 ? "+" : ""}{pnl.toFixed(2)}
          </text>
        </g>

        <rect x="46" y="46" width="428" height="428" rx="24" fill="url(#scan)" opacity={damageLevel >= 3 ? 0.95 : 0.55} />
        <rect x="46" y="46" width="428" height="428" rx="24" fill="url(#vignette)" opacity="0.55" />

        {showDebugTag && (
          <text x="58" y="496" fontSize="11" fill="rgba(120,255,170,0.75)" letterSpacing="2">
            mood={String(mood)} stage={String(stage)}
          </text>
        )}
      </svg>
    </div>
  );
}

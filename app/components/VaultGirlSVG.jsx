// app/components/VaultGirlSVG.js
"use client";

import React, { useMemo } from "react";

/**
 * VaultGirlSVG (Full-body Cortana-style hologram)
 * - Adult, feminine silhouette (tasteful, not explicit)
 * - Volumetric hologram shading + rim light + shimmer + scanlines
 * - Reactive accents for trading/pnl/health
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

  const pulseSpeed = useMemo(() => {
    const base = trading ? 1.15 : 1.85;
    const posAdj = Math.max(0, Math.min(0.75, pos * 0.08));
    return Math.max(0.78, base - posAdj);
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

  const accentStroke = pnlDown
    ? "var(--pip-down, rgba(255,80,80,0.95))"
    : "var(--pip-up, rgba(0,255,160,0.95))";

  const accentFill = pnlDown
    ? "var(--pip-down-fill, rgba(255,80,80,0.18))"
    : "var(--pip-up-fill, rgba(0,255,160,0.18))";

  // hologram tones
  const rimHi = "rgba(220,255,245,0.85)";
  const edge = "rgba(195,255,230,0.70)";
  const edgeDim = "rgba(170,255,210,0.48)";
  const inner = "rgba(120,255,170,0.20)";

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <svg viewBox="0 0 520 520" width="100%" height="100%" role="img" aria-label="Hologram companion">
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

          {/* Big aura */}
          <radialGradient id="holoAura" cx="50%" cy="42%" r="80%">
            <stop offset="0%" stopColor="rgba(220,255,245,0.32)" />
            <stop offset="42%" stopColor="rgba(120,255,170,0.16)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* Body volume */}
          <radialGradient id="bodyCore" cx="50%" cy="28%" r="82%">
            <stop offset="0%" stopColor="rgba(225,255,245,0.20)" />
            <stop offset="45%" stopColor="rgba(120,255,170,0.12)" />
            <stop offset="100%" stopColor="rgba(120,255,170,0.06)" />
          </radialGradient>

          {/* Rim light */}
          <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="12%" stopColor="rgba(230,255,245,0.16)" />
            <stop offset="50%" stopColor="rgba(230,255,245,0.05)" />
            <stop offset="88%" stopColor="rgba(230,255,245,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* face soft light */}
          <radialGradient id="faceSoft" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="rgba(235,255,248,0.18)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

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

          {/* shimmer sweep */}
          <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(210,255,238,0.22)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <clipPath id="portraitClip">
            <rect x="70" y="96" width="380" height="350" rx="22" />
          </clipPath>
        </defs>

        {/* Backplate */}
        <rect x="0" y="0" width="520" height="520" fill="rgba(0,0,0,0.06)" />
        <rect x="0" y="0" width="520" height="520" fill="url(#dots)" opacity="0.35" />

        {/* Frame */}
        <g filter="url(#pipGlow)">
          <rect x="26" y="26" width="468" height="468" rx="28" fill="rgba(0,0,0,0.22)" stroke="rgba(120,255,170,0.30)" strokeWidth="2" />
          <rect x="46" y="46" width="428" height="428" rx="24" fill="rgba(0,0,0,0.16)" stroke="rgba(120,255,170,0.18)" strokeWidth="2" />
        </g>

        {/* Header */}
        <g style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
          <text x="58" y="84" fontSize="16" fill="rgba(170,255,210,0.95)" letterSpacing="3">
            VAULT COMPANION · HOLOGRAM
          </text>
          <text x="58" y="108" fontSize="12" fill="rgba(120,255,170,0.80)" letterSpacing="2">
            VAULT {String(vaultNumber || "13")} · {ringState} · {statusText}
          </text>
        </g>

        {/* Portrait */}
        <g clipPath="url(#portraitClip)">
          <rect x="70" y="96" width="380" height="350" rx="22" fill="rgba(0,0,0,0.12)" stroke="rgba(120,255,170,0.18)" />

          {/* aura */}
          <circle cx="260" cy="250" r="178" fill="url(#holoAura)" opacity="0.95" />

          {/* trading shimmer */}
          {trading && (
            <rect x="-120" y="96" width="160" height="350" fill="url(#shimmer)" opacity="0.7">
              <animateTransform attributeName="transform" type="translate" from="0 0" to="760 0" dur="2.2s" repeatCount="indefinite" />
            </rect>
          )}

          {/* Full-body figure */}
          <g filter="url(#pipGlow)">
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 -2.4; 0 0"
                dur={`${pulseSpeed}s`}
                repeatCount="indefinite"
              />

              {/* ===== BODY SILHOUETTE (tasteful, bodysuit-like) ===== */}
              {/* Head */}
              <path
                d="M260 140
                   C292 140 317 166 317 198
                   C317 230 292 255 260 255
                   C228 255 203 230 203 198
                   C203 166 228 140 260 140 Z"
                fill="url(#bodyCore)"
                stroke={edge}
                strokeWidth="3.2"
                strokeLinejoin="round"
              />

              {/* Neck + shoulders */}
              <path
                d="M238 254
                   C242 274 252 284 260 286
                   C268 284 278 274 282 254
                   C300 258 318 272 330 292
                   C340 308 344 324 344 338
                   C340 340 334 342 326 342
                   C312 316 288 304 260 304
                   C232 304 208 316 194 342
                   C186 342 180 340 176 338
                   C176 324 180 308 190 292
                   C202 272 220 258 238 254 Z"
                fill="rgba(120,255,170,0.10)"
                stroke={edgeDim}
                strokeWidth="3"
                strokeLinejoin="round"
              />

              {/* Torso + waist + hips (feminine curves) */}
              <path
                d="M210 308
                   C226 296 244 292 260 292
                   C276 292 294 296 310 308
                   C322 318 330 336 332 356
                   C334 380 326 404 312 420
                   C298 436 280 444 260 446
                   C240 444 222 436 208 420
                   C194 404 186 380 188 356
                   C190 336 198 318 210 308 Z"
                fill="url(#bodyCore)"
                stroke={edge}
                strokeWidth="3.2"
                strokeLinejoin="round"
              />

              {/* Legs (longer, sleek stance) */}
              <path
                d="M238 446
                   C230 462 220 476 214 492
                   C210 502 210 510 214 514
                   C220 520 236 520 246 514
                   C252 510 252 500 250 492
                   C246 474 246 462 250 446 Z"
                fill="rgba(120,255,170,0.10)"
                stroke={edgeDim}
                strokeWidth="3"
              />
              <path
                d="M282 446
                   C286 462 286 474 282 492
                   C280 500 280 510 286 514
                   C296 520 312 520 318 514
                   C322 510 322 502 318 492
                   C312 476 302 462 294 446 Z"
                fill="rgba(120,255,170,0.10)"
                stroke={edgeDim}
                strokeWidth="3"
              />

              {/* Arms (confident pose) */}
              {/* Left arm down */}
              <path
                d="M194 342
                   C182 360 180 382 186 402
                   C190 414 198 422 210 424"
                fill="none"
                stroke={edgeDim}
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Right arm bent (hand near hip) */}
              <path
                d="M326 342
                   C340 356 344 376 338 396
                   C334 410 326 420 314 424"
                fill="none"
                stroke={edgeDim}
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M308 424
                   C318 430 326 436 330 446"
                fill="none"
                stroke={edgeDim}
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.75"
              />

              {/* ===== HAIR (longer, sleek, Cortana-ish) ===== */}
              <path
                d="M206 206
                   C202 168 232 146 260 146
                   C304 146 328 178 326 222
                   C324 258 302 274 286 282
                   C302 268 312 248 312 224
                   C310 190 292 176 270 176
                   C248 176 232 190 224 208
                   C218 222 210 224 206 224 Z"
                fill="rgba(180,255,220,0.10)"
                stroke={edgeDim}
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <path
                d="M312 228
                   C336 252 338 300 312 332"
                fill="none"
                stroke={edgeDim}
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.9"
              />
              <path
                d="M206 230
                   C186 252 186 298 210 332"
                fill="none"
                stroke={edgeDim}
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* ===== FACE (soft, adult, minimal to avoid uncanny) ===== */}
              <circle cx="260" cy="200" r="58" fill="url(#faceSoft)" opacity="0.9" />
              <path d="M238 212 C246 206 254 206 262 212" fill="none" stroke={rimHi} strokeWidth="3" strokeLinecap="round" opacity="0.75" />
              <path d="M258 212 C266 206 274 206 282 212" fill="none" stroke={rimHi} strokeWidth="3" strokeLinecap="round" opacity="0.75" />
              <path d="M260 220 C258 230 258 234 262 238" fill="none" stroke="rgba(220,255,245,0.35)" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M244 244 C254 254 266 254 276 244" fill="none" stroke={rimHi} strokeWidth="3" strokeLinecap="round" opacity="0.70" />

              {/* ===== Suit lines (adds “tech bodysuit” feel) ===== */}
              <path d="M260 292 L260 446" fill="none" stroke="rgba(170,255,210,0.26)" strokeWidth="3" />
              <path d="M214 356 C232 344 288 344 306 356" fill="none" stroke={inner} strokeWidth="3" opacity="0.7" />
              <path d="M220 396 C242 386 278 386 300 396" fill="none" stroke={inner} strokeWidth="3" opacity="0.6" />

              {/* Subtle VAULT tag */}
              <text
                x="260"
                y="434"
                textAnchor="middle"
                fontSize="16"
                fill="rgba(170,255,210,0.22)"
                style={{ letterSpacing: "4px", fontWeight: 900 }}
              >
                VAULT {String(vaultNumber || "13")}
              </text>

              {/* Rim highlight overlay */}
              <path
                d="M260 140
                   C292 140 317 166 317 198
                   C317 230 292 255 260 255
                   C228 255 203 230 203 198
                   C203 166 228 140 260 140 Z
                   M210 308
                   C226 296 244 292 260 292
                   C276 292 294 296 310 308
                   C322 318 330 336 332 356
                   C334 380 326 404 312 420
                   C298 436 280 444 260 446
                   C240 444 222 436 208 420
                   C194 404 186 380 188 356
                   C190 336 198 318 210 308 Z"
                fill="url(#rim)"
                opacity="0.95"
                filter="url(#rimGlow)"
              />
            </g>
          </g>

          {/* trading rings */}
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

          {/* health glitch */}
          {damageLevel >= 2 && (
            <>
              <rect x="78" y="160" width="364" height="8" fill="rgba(255,80,80,0.20)" opacity="0.30" />
              <rect x="78" y="268" width="364" height="6" fill="rgba(255,80,80,0.14)" opacity="0.22" />
            </>
          )}
        </g>

        {/* HUD footer */}
        <g style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
          <text x="58" y="468" fontSize="12" fill="rgba(120,255,170,0.78)" letterSpacing="2">
            POS: {pos} · HEALTH: {safeHealth.toFixed(0)}% · PNL: {pnl > 0 ? "+" : ""}{pnl.toFixed(2)}
          </text>
        </g>

        {/* scanlines + vignette */}
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

// app/components/VaultGirlSVG.js
"use client";

import React, { useMemo } from "react";

/**
 * VaultGirlSVG (Hologram Companion — Cortana-ish)
 * - Human female hologram silhouette (no cartoon stick figure)
 * - Soft gradients + glow + scanlines
 * - Reacts to: isTrading, lastPnl, openPositions, health, mood/stage
 *
 * NOTE: This is stylized vector art, not photorealistic.
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
    // Faster pulse when more positions are open
    const base = trading ? 1.35 : 2.0;
    const posAdj = Math.max(0, Math.min(0.7, pos * 0.08));
    return Math.max(0.85, base - posAdj);
  }, [trading, pos]);

  const glow = useMemo(() => {
    // Glow increases with health + trading
    const h = safeHealth / 100;
    const base = 0.55 + h * 0.45;
    const tradeBoost = trading ? 0.22 : 0;
    const posBoost = Math.min(0.18, pos * 0.03);
    return Math.max(0.35, Math.min(1.15, base + tradeBoost + posBoost));
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

  const holoStroke = "rgba(170,255,210,0.85)";
  const holoStrokeDim = "rgba(170,255,210,0.55)";

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <svg
        viewBox="0 0 520 520"
        width="100%"
        height="100%"
        role="img"
        aria-label="Hologram companion"
      >
        <defs>
          {/* Main glow */}
          <filter id="pipGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={8 * glow} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Softer inner glow */}
          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={4 * glow} result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="holoCore" cx="50%" cy="40%" r="75%">
            <stop offset="0%" stopColor="rgba(190,255,230,0.92)" />
            <stop offset="40%" stopColor="rgba(120,255,170,0.40)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* Fill for the hologram body */}
          <linearGradient id="bodyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(180,255,220,0.22)" />
            <stop offset="55%" stopColor="rgba(120,255,170,0.14)" />
            <stop offset="100%" stopColor="rgba(120,255,170,0.06)" />
          </linearGradient>

          {/* Face highlight */}
          <radialGradient id="faceGlow" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="rgba(210,255,240,0.28)" />
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

          {/* Subtle shimmer sweep */}
          <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(200,255,230,0.22)" />
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
          <rect
            x="26"
            y="26"
            width="468"
            height="468"
            rx="28"
            fill="rgba(0,0,0,0.22)"
            stroke="rgba(120,255,170,0.30)"
            strokeWidth="2"
          />
          <rect
            x="46"
            y="46"
            width="428"
            height="428"
            rx="24"
            fill="rgba(0,0,0,0.16)"
            stroke="rgba(120,255,170,0.18)"
            strokeWidth="2"
          />
        </g>

        {/* Header text */}
        <g style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
          <text x="58" y="84" fontSize="16" fill="rgba(170,255,210,0.95)" letterSpacing="3">
            VAULT COMPANION · HOLOGRAM
          </text>
          <text x="58" y="108" fontSize="12" fill="rgba(120,255,170,0.80)" letterSpacing="2">
            VAULT {String(vaultNumber || "13")} · {ringState} · {statusText}
          </text>
        </g>

        {/* Portrait area */}
        <g clipPath="url(#portraitClip)">
          <rect
            x="70"
            y="96"
            width="380"
            height="350"
            rx="22"
            fill="rgba(0,0,0,0.12)"
            stroke="rgba(120,255,170,0.18)"
          />

          {/* Holo aura */}
          <circle cx="260" cy="250" r="172" fill="url(#holoCore)" opacity="0.95" />

          {/* Trading shimmer sweep */}
          {trading && (
            <rect x="-120" y="96" width="160" height="350" fill="url(#shimmer)" opacity="0.7">
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to="760 0"
                dur="2.4s"
                repeatCount="indefinite"
              />
            </rect>
          )}

          {/* === HOLOGRAM WOMAN (Cortana-ish) === */}
          <g filter="url(#pipGlow)">
            {/* Subtle floating / breathing */}
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 -2; 0 0"
                dur={`${pulseSpeed}s`}
                repeatCount="indefinite"
              />

              {/* BODY SILHOUETTE (filled, human proportions) */}
              <path
                d="
                  M260 140
                  C290 140 312 166 312 194
                  C312 222 290 244 260 244
                  C232 244 208 222 208 194
                  C208 166 230 140 260 140
                  Z

                  M210 278
                  C222 260 242 252 260 252
                  C278 252 298 260 310 278
                  C328 304 332 334 326 362
                  C320 390 300 410 280 418
                  C270 422 250 422 240 418
                  C220 410 200 390 194 362
                  C188 334 192 304 210 278
                  Z
                "
                fill="url(#bodyFill)"
                stroke={holoStroke}
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* NECK + COLLAR LINES */}
              <path d="M244 244 C246 258 252 266 260 268 C268 266 274 258 276 244" fill="none" stroke={holoStrokeDim} strokeWidth="3" />
              <path d="M224 294 C244 282 276 282 296 294" fill="none" stroke={holoStrokeDim} strokeWidth="3" opacity="0.7" />

              {/* SHOULDERS + ARMS (not stick; softened) */}
              <path
                d="M196 318 C176 318 164 338 170 358 C176 378 198 382 210 370"
                fill="none"
                stroke={holoStrokeDim}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M324 318 C344 318 356 338 350 358 C344 378 322 382 310 370"
                fill="none"
                stroke={holoStrokeDim}
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* HEAD DETAILS (minimal, human, not uncanny) */}
              <circle cx="260" cy="190" r="52" fill="url(#faceGlow)" opacity="0.85" />

              {/* Hair cap (sleek) */}
              <path
                d="M214 190
                   C214 162 236 146 260 146
                   C292 146 310 168 310 196
                   C308 176 292 168 274 168
                   C256 168 242 176 236 188
                   C230 200 222 206 214 206
                   Z"
                fill="rgba(170,255,210,0.12)"
                stroke={holoStrokeDim}
                strokeWidth="3"
                strokeLinejoin="round"
              />

              {/* Side hair flow */}
              <path
                d="M312 202 C340 216 344 246 326 266 C318 276 310 282 300 286"
                fill="none"
                stroke={holoStrokeDim}
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* Eyes (soft) */}
              <path d="M238 198 C246 192 254 192 262 198" fill="none" stroke="rgba(210,255,240,0.70)" strokeWidth="3" strokeLinecap="round" />
              <path d="M258 198 C266 192 274 192 282 198" fill="none" stroke="rgba(210,255,240,0.70)" strokeWidth="3" strokeLinecap="round" />

              {/* Small smile */}
              <path d="M246 218 C254 226 266 226 274 218" fill="none" stroke="rgba(210,255,240,0.65)" strokeWidth="3" strokeLinecap="round" />

              {/* Holo “spine” / suit seam */}
              <path d="M260 268 L260 420" fill="none" stroke="rgba(170,255,210,0.35)" strokeWidth="3" opacity="0.8" />

              {/* Vault number (subtle) */}
              <text
                x="260"
                y="405"
                textAnchor="middle"
                fontSize="46"
                fill="rgba(170,255,210,0.22)"
                style={{ letterSpacing: "2px", fontWeight: 900 }}
              >
                {String(vaultNumber || "13")}
              </text>
            </g>
          </g>

          {/* Accent pulse ring when trading */}
          {trading && (
            <g opacity="0.85">
              <circle cx="260" cy="260" r="150" fill="none" stroke={accentStroke} strokeWidth="3" opacity="0.30">
                <animate attributeName="opacity" values="0.10;0.50;0.10" dur={`${pulseSpeed}s`} repeatCount="indefinite" />
              </circle>
              <circle cx="260" cy="260" r="120" fill={accentFill} stroke={accentStroke} strokeWidth="2" opacity="0.16">
                <animate attributeName="opacity" values="0.06;0.26;0.06" dur={`${pulseSpeed}s`} repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* Light glitch when health low */}
          {damageLevel >= 2 && (
            <>
              <rect x="78" y="160" width="364" height="8" fill="rgba(255,80,80,0.20)" opacity="0.32" />
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

// app/components/VaultGirlSVG.js
"use client";

import React, { useMemo } from "react";

/**
 * VaultGirlSVG — realistic hologram silhouette (no external images)
 * - Clean, feminine, Cortana-style outline with human proportions
 * - Looks good in your existing 520×520 frame
 * - Reacts to: isTrading, lastPnl, openPositions, health, mood/stage
 *
 * Props (all optional):
 *  mood, stage, vaultNumber, health, openPositions, lastPnl, isTrading, showDebugTag
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
  // --- Safe numbers
  const H = clampNum(health, 0, 100, 100);
  const POS = num(openPositions, 0);
  const PNL = num(lastPnl, 0);
  const TRADING = !!isTrading;

  // --- Visual tuning derived from state
  const pulseSpeed = useMemo(() => {
    const base = TRADING ? 1.25 : 1.8;      // faster pulse while trading
    const posAdj = Math.min(0.5, POS * 0.06);
    return Math.max(0.8, base - posAdj);
  }, [TRADING, POS]);

  const glowMul = useMemo(() => {
    const h = H / 100;
    const moodBoost =
      /happy|calm|strong/.test(String(mood).toLowerCase()) ? 0.12 : 0;
    const tradeBoost = TRADING ? 0.2 : 0;
    return clampNum(0.5 + 0.5 * h + moodBoost + tradeBoost, 0.45, 1.25, 0.9);
  }, [H, TRADING, mood]);

  const ringState = useMemo(() => {
    const s = String(stage || "").toLowerCase();
    const m = String(mood || "").toLowerCase();
    if (s.includes("cryo") || m.includes("cryo")) return "CRYO";
    if (m.includes("panic") || m.includes("angry") || m.includes("alert"))
      return "ALERT";
    return "ACTIVE";
  }, [stage, mood]);

  const statusText = useMemo(() => {
    if (!TRADING) return "IDLE";
    if (PNL > 0) return "TRADING · PROFIT";
    if (PNL < 0) return "TRADING · LOSS";
    return "TRADING · ACTIVE";
  }, [TRADING, PNL]);

  // Accent colours respect your CSS vars (falls back to neon green / red)
  const accentStroke =
    PNL < 0
      ? "var(--pip-down, rgba(255,80,80,0.95))"
      : "var(--pip-up, rgba(0,255,160,0.95))";
  const accentFill =
    PNL < 0
      ? "var(--pip-down-fill, rgba(255,80,80,0.18))"
      : "var(--pip-up-fill, rgba(0,255,160,0.18))";

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <svg
        viewBox="0 0 520 520"
        width="100%"
        height="100%"
        role="img"
        aria-label="Vault Girl hologram companion"
      >
        {/* ======= DEFINITIONS ======= */}
        <defs>
          {/* soft outer glow */}
          <filter id="pipGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={8 * glowMul} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* central aura */}
          <radialGradient id="holoAura" cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="rgba(160,255,210,0.95)" />
            <stop offset="40%" stopColor="rgba(120,255,170,0.38)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* scanlines */}
          <pattern id="scan" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="6" height="1" fill="rgba(120,255,170,0.06)" />
          </pattern>

          {/* very subtle dot noise */}
          <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.1" fill="rgba(120,255,170,0.10)" />
          </pattern>

          {/* vignette */}
          <radialGradient id="vignette" cx="50%" cy="48%" r="80%">
            <stop offset="60%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
          </radialGradient>

          {/* shimmer bar */}
          <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(200,255,230,0.22)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* viewport for portrait */}
          <clipPath id="portraitClip">
            <rect x="70" y="96" width="380" height="350" rx="22" />
          </clipPath>
        </defs>

        {/* ======= BACKPLATE ======= */}
        <rect x="0" y="0" width="520" height="520" fill="rgba(0,0,0,0.06)" />
        <rect x="0" y="0" width="520" height="520" fill="url(#dots)" opacity="0.35" />

        {/* frame */}
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

        {/* header */}
        <g style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
          <text x="58" y="84" fontSize="16" fill="rgba(170,255,210,0.95)" letterSpacing="3">
            VAULT COMPANION · HOLOGRAM
          </text>
          <text x="58" y="108" fontSize="12" fill="rgba(120,255,170,0.80)" letterSpacing="2">
            VAULT {String(vaultNumber || "13")} · {ringState} · {statusText}
          </text>
        </g>

        {/* ======= PORTRAIT AREA ======= */}
        <g clipPath="url(#portraitClip)">
          {/* panel */}
          <rect x="70" y="96" width="380" height="350" rx="22" fill="rgba(0,0,0,0.12)" stroke="rgba(120,255,170,0.18)" />
          {/* aura + scanlines */}
          <circle cx="260" cy="260" r="170" fill="url(#holoAura)" opacity="0.95" />
          <rect x="70" y="96" width="380" height="350" fill="url(#scan)" opacity="0.45" />

          {/* shimmer sweep (trading) */}
          {TRADING && (
            <rect x="-120" y="96" width="140" height="350" fill="url(#shimmer)" opacity="0.7">
              <animateTransform attributeName="transform" type="translate" from="0 0" to="700 0" dur="2.2s" repeatCount="indefinite" />
            </rect>
          )}

          {/* ======= HUMAN FEMALE SILHOUETTE =======
             Proportions tuned to avoid "pregnant" look:
             - narrower abdomen, visible waist
             - clavicle/shoulder gesture, natural thighs/calves
          */}
          <g
            fill="none"
            stroke="rgba(170,255,210,0.82)"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#pipGlow)"
          >
            {/* Head (oval) */}
            <path d="M230 168 C230 146 248 132 260 132 C282 132 290 146 290 168 C290 188 279 202 260 203 C245 202 230 190 230 168 Z" />

            {/* Facial hint (non-detailed: eyes + smile) */}
            <path d="M246 170 C249 168 253 168 256 170" opacity="0.7" />
            <path d="M264 170 C267 168 271 168 274 170" opacity="0.7" />
            <path d="M248 182 C256 188 264 188 272 182" opacity="0.7" />

            {/* Neck */}
            <path d="M246 204 L246 220" />
            <path d="M274 204 L274 220" />

            {/* Shoulders & collarbone */}
            <path d="M200 230 C220 215 240 210 260 210 C280 210 300 215 320 230" opacity="0.9" />

            {/* Bust outline (soft curves) */}
            <path d="M215 280 C210 248 238 232 260 232 C282 232 310 248 305 280" opacity="0.85" />

            {/* Waist and hips (hourglass, not bulging) */}
            <path d="M205 312 C205 270 225 250 260 248 C295 250 315 270 315 312" />
            <path d="M205 312 C205 370 230 410 260 420 C290 410 315 370 315 312" />

            {/* Navel/center seam (holo line) */}
            <path d="M260 232 L260 420" opacity="0.45" />

            {/* Arms relaxed */}
            <path d="M200 246 C176 260 170 292 188 322 C200 342 214 350 226 352" />
            <path d="M320 246 C344 260 350 292 332 322 C320 342 306 350 294 352" />

            {/* Legs */}
            <path d="M230 420 C230 442 236 462 240 488" />
            <path d="M290 420 C290 442 284 462 280 488" />

            {/* Thigh/leg outer curves */}
            <path d="M205 312 C208 356 228 386 240 416" opacity="0.9" />
            <path d="M315 312 C312 356 292 386 280 416" opacity="0.9" />

            {/* Minimal feet hint (inside frame) */}
            <path d="M238 488 C246 496 254 498 260 498" opacity="0.6" />
            <path d="M282 488 C274 496 266 498 260 498" opacity="0.6" />
          </g>

          {/* Accent pulse rings while trading */}
          {TRADING && (
            <g opacity="0.85">
              <circle cx="260" cy="280" r="150" fill="none" stroke={accentStroke} strokeWidth="3" opacity="0.35">
                <animate attributeName="opacity" values="0.08;0.5;0.08" dur={`${pulseSpeed}s`} repeatCount="indefinite" />
              </circle>
              <circle cx="260" cy="280" r="120" fill={accentFill} stroke={accentStroke} strokeWidth="2" opacity="0.18">
                <animate attributeName="opacity" values="0.06;0.25;0.06" dur={`${pulseSpeed}s`} repeatCount="indefinite" />
              </circle>
            </g>
          )}
        </g>

        {/* ======= HUD FOOTER ======= */}
        <g style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
          <text x="58" y="468" fontSize="12" fill="rgba(120,255,170,0.78)" letterSpacing="2">
            POS: {POS} · HEALTH: {H.toFixed(0)}% · PNL: {PNL > 0 ? "+" : ""}{PNL.toFixed(2)}
          </text>
        </g>

        {/* vignette overlay */}
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

/* ---------- tiny helpers ---------- */
function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function clampNum(v, lo, hi, d = v) {
  const n = num(v, d);
  return Math.max(lo, Math.min(hi, n));
}

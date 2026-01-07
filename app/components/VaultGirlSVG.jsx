// app/components/VaultGirlSVG.js
"use client";

import React, { useMemo, useState } from "react";

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
  const [imgOk, setImgOk] = useState(true);

  const H = clampNum(health, 0, 100, 100);
  const POS = num(openPositions, 0);
  const PNL = num(lastPnl, 0);
  const TRADING = !!isTrading;

  const ringState = useMemo(() => {
    const s = String(stage || "").toLowerCase();
    const m = String(mood || "").toLowerCase();
    if (s.includes("cryo") || m.includes("cryo")) return "CRYO";
    if (m.includes("panic") || m.includes("angry") || m.includes("alert")) return "ALERT";
    return "ACTIVE";
  }, [stage, mood]);

  const statusText = useMemo(() => {
    if (!TRADING) return "IDLE";
    if (PNL > 0) return "TRADING · PROFIT";
    if (PNL < 0) return "TRADING · LOSS";
    return "TRADING · ACTIVE";
  }, [TRADING, PNL]);

  const pulseSpeed = useMemo(() => {
    const base = TRADING ? 1.15 : 1.9;
    const posAdj = Math.min(0.6, POS * 0.06);
    return Math.max(0.8, base - posAdj);
  }, [TRADING, POS]);

  const glowMul = useMemo(() => {
    const h = H / 100;
    const base = 0.55 + h * 0.55;
    const tradeBoost = TRADING ? 0.25 : 0;
    return clampNum(base + tradeBoost, 0.5, 1.35, 0.95);
  }, [H, TRADING]);

  const accentStroke =
    PNL < 0 ? "var(--pip-down, rgba(255,80,80,0.95))" : "var(--pip-up, rgba(0,255,160,0.95))";
  const accentFill =
    PNL < 0 ? "var(--pip-down-fill, rgba(255,80,80,0.18))" : "var(--pip-up-fill, rgba(0,255,160,0.18))";

  // ✅ Use public file directly (NO import => NO build crash)
  // If you switch to JPG, change this to "/vaultgirl.jpg"
  const IMG_SRC = "/vaultgirl.png";

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <svg viewBox="0 0 520 520" width="100%" height="100%" role="img" aria-label="Vault Girl hologram companion">
        <defs>
          <filter id="pipGlow" x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation={8 * glowMul} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="holoAura" cx="50%" cy="42%" r="70%">
            <stop offset="0%" stopColor="rgba(170,255,210,0.70)" />
            <stop offset="45%" stopColor="rgba(120,255,170,0.22)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          <radialGradient id="vignette" cx="50%" cy="48%" r="80%">
            <stop offset="60%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.65)" />
          </radialGradient>

          <pattern id="scan" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="6" height="1" fill="rgba(120,255,170,0.07)" />
          </pattern>

          <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.1" fill="rgba(120,255,170,0.10)" />
          </pattern>

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
          <rect x="26" y="26" width="468" height="468" rx="28" fill="rgba(0,0,0,0.22)" stroke="rgba(120,255,170,0.30)" strokeWidth="2" />
          <rect x="46" y="46" width="428" height="428" rx="24" fill="rgba(0,0,0,0.16)" stroke="rgba(120,255,170,0.18)" strokeWidth="2" />
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
          <rect x="70" y="96" width="380" height="350" rx="22" fill="rgba(0,0,0,0.12)" stroke="rgba(120,255,170,0.18)" />
          <circle cx="260" cy="250" r="170" fill="url(#holoAura)" opacity="0.95" />

          {/* Use foreignObject so we can catch load errors */}
          <foreignObject x="70" y="96" width="380" height="350">
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 22,
                overflow: "hidden",
                background: "rgba(0,0,0,0.06)",
              }}
            >
              {imgOk ? (
                <img
                  src={IMG_SRC}
                  alt="Vault Girl"
                  onError={() => setImgOk(false)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.98,
                    // hologram tint/glow
                    filter:
                      "brightness(1.05) contrast(1.05) saturate(1.3) hue-rotate(85deg) drop-shadow(0 0 14px rgba(120,255,170,0.45))",
                    mixBlendMode: "screen",
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: "rgba(170,255,210,0.9)",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: 12,
                    letterSpacing: 1.5,
                  }}
                >
                  IMAGE FAILED TO LOAD
                  <div style={{ opacity: 0.8, marginTop: 8 }}>
                    Replace <b>/public/vaultgirl.png</b> with a valid PNG/JPG.
                  </div>
                </div>
              )}
            </div>
          </foreignObject>

          {TRADING && (
            <rect x="-120" y="96" width="160" height="350" fill="url(#shimmer)" opacity="0.7">
              <animateTransform attributeName="transform" type="translate" from="0 0" to="760 0" dur="2.2s" repeatCount="indefinite" />
            </rect>
          )}

          <rect x="70" y="96" width="380" height="350" fill="url(#scan)" opacity="0.55" />

          {TRADING && (
            <g opacity="0.85">
              <circle cx="260" cy="260" r="150" fill="none" stroke={accentStroke} strokeWidth="3" opacity="0.35">
                <animate attributeName="opacity" values="0.10;0.55;0.10" dur={`${pulseSpeed}s`} repeatCount="indefinite" />
              </circle>
              <circle cx="260" cy="260" r="120" fill={accentFill} stroke={accentStroke} strokeWidth="2" opacity="0.18">
                <animate attributeName="opacity" values="0.08;0.30;0.08" dur={`${pulseSpeed}s`} repeatCount="indefinite" />
              </circle>
            </g>
          )}
        </g>

        <g style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
          <text x="58" y="468" fontSize="12" fill="rgba(120,255,170,0.78)" letterSpacing="2">
            POS: {POS} · HEALTH: {H.toFixed(0)}% · PNL: {PNL > 0 ? "+" : ""}{PNL.toFixed(2)}
          </text>
        </g>

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

/* helpers */
function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function clampNum(v, lo, hi, d = v) {
  const n = num(v, d);
  return Math.max(lo, Math.min(hi, n));
}

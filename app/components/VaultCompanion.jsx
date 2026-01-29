"use client";

import React, { useMemo, useState } from "react";

/**
 * VaultCompanion.jsx (stable)
 * - Stops "cycling" unless state actually changes.
 * - Mood/stage/health drive the portrait (PNL does NOT).
 * - Robust onError fallback through candidate filenames.
 *
 * NOTE: your filenames really include two dots before .png (..png) so we keep that.
 */

export default function VaultCompanion({
  sex = "girl",
  mood = "cryo",
  stage = "cryo",
  vaultNumber = "13",
  health = 100,
  hunger = 100,
  growth = 0,
  openPositions = 0,
  lastPnl = 0,
  isTrading = false,
  showDebugTag = false,
}) {
  const H = clampNum(health, 0, 100, 100);
  const HU = clampNum(hunger, 0, 100, 100);

  const baseKey = useMemo(() => {
    return String(sex || "girl").toLowerCase().includes("boy") ? "vaultboy" : "vaultgirl";
  }, [sex]);

  const folder = useMemo(() => `/companion/${baseKey}`, [baseKey]);

  // Only mood/stage/health drive the portrait (stable, no PNL flicker).
  const portraitState = useMemo(() => {
    const m = String(mood || "").toLowerCase();
    const s = String(stage || "").toLowerCase();

    // Critical health states (match your filenames)
    if (H <= 5) return "zombie";
    if (H <= 20) return "zomple";

    // Cryo priority
    if (s.includes("cryo") || m.includes("cryo")) return "cryo";

    // Mood priority
    if (m.includes("sick")) return "sick";
    if (m.includes("weak") || m.includes("tired") || m.includes("low")) return "weak";
    if (m.includes("happy")) return "happy";
    if (m.includes("thriv") || m.includes("strong") || m.includes("great")) return "thriving";

    // Hunger can soften the mood a bit (optional)
    if (HU < 35) return "weak";

    // Health fallback
    if (H < 35) return "sick";
    if (H < 60) return "weak";

    return "idle";
  }, [mood, stage, H, HU]);

  const ringState = useMemo(() => {
    const s = String(stage || "").toLowerCase();
    const m = String(mood || "").toLowerCase();
    if (H <= 5) return "DEAD";
    if (H <= 20) return "ZOMBIE";
    if (s.includes("cryo") || m.includes("cryo")) return "CRYO";
    if (m.includes("panic") || m.includes("angry") || m.includes("alert")) return "ALERT";
    return "ACTIVE";
  }, [stage, mood, H]);

  const statusText = useMemo(() => {
    if (H <= 5) return "OFFLINE";
    if (!isTrading) return "IDLE";
    return "TRADING · ACTIVE";
  }, [isTrading, H]);

  // IMPORTANT: keep the "..png" filenames
  const candidates = useMemo(() => {
    const primary = `${folder}/${baseKey}_${portraitState}..png`;
    const idle = `${folder}/${baseKey}_idle..png`;

    // If one "dead" variant missing, try the other
    const altDead =
      portraitState === "zombie"
        ? `${folder}/${baseKey}_zomple..png`
        : portraitState === "zomple"
          ? `${folder}/${baseKey}_zombie..png`
          : "";

    const list = [primary];
    if (altDead) list.push(altDead);
    list.push(idle);

    return Array.from(new Set(list.filter(Boolean)));
  }, [folder, baseKey, portraitState]);

  // Deterministic version string (avoid Date.now() causing constant reloads)
  const ASSET_V = "1";

  // Simple fallback index (no async preloader loops)
  const [idx, setIdx] = useState(0);
  const src = candidates[idx] ? `${candidates[idx]}?v=${ASSET_V}` : "";

  const accentStroke =
    Number(lastPnl) < 0 ? "var(--pip-down, rgba(255,80,80,0.95))" : "var(--pip-up, rgba(0,255,160,0.95))";

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg viewBox="0 0 520 520" width="100%" height="100%" role="img" aria-label="Vault companion hologram">
        <defs>
          <filter id="pipGlow" x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation={8} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="holoTint" x="-40%" y="-40%" width="180%" height="180%">
            <feColorMatrix
              type="matrix"
              values="
                0.10 0.00 0.00 0.00 0.00
                0.00 1.45 0.00 0.00 0.00
                0.00 0.00 0.25 0.00 0.00
                0.00 0.00 0.00 1.00 0.00"
              result="tinted"
            />
            <feGaussianBlur in="tinted" stdDeviation="2.6" result="soft" />
            <feMerge>
              <feMergeNode in="soft" />
              <feMergeNode in="tinted" />
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

          <clipPath id="portraitClip">
            <rect x="70" y="96" width="380" height="350" rx="22" />
          </clipPath>
        </defs>

        <rect x="0" y="0" width="520" height="520" fill="rgba(0,0,0,0.06)" />

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
          <circle cx="260" cy="250" r="170" fill="url(#holoAura)" opacity="0.95" />

          {src ? (
            <image
              href={src}
              x="70"
              y="96"
              width="380"
              height="350"
              preserveAspectRatio="xMidYMid meet"
              filter="url(#holoTint)"
              opacity="0.98"
              onError={() => setIdx((n) => Math.min(n + 1, candidates.length - 1))}
            />
          ) : (
            <text x="260" y="250" textAnchor="middle" fill="rgba(170,255,210,0.75)" fontSize="14">
              IMAGE NOT FOUND
            </text>
          )}

          <rect x="70" y="96" width="380" height="350" fill="url(#scan)" opacity="0.55" />
        </g>

        <rect x="46" y="46" width="428" height="428" rx="24" fill="url(#vignette)" opacity="0.55" />

        {showDebugTag && (
          <text x="58" y="496" fontSize="11" fill="rgba(120,255,170,0.75)" letterSpacing="2">
            sex={baseKey} state={portraitState} src={src ? "OK" : "FAIL"} file={src || "-"} stroke={accentStroke}
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

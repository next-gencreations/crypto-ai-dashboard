"use client";

import React, { useEffect, useMemo, useState } from "react";

export default function VaultCompanion({
  sex = "girl",
  mood = "cryo",
  stage = "cryo",
  vaultNumber = "13",
  health = 100,
  openPositions = 0,
  lastPnl = 0,
  isTrading = false,
  showDebugTag = false,
}) {
  const H = clampNum(health, 0, 100, 100);
  const POS = num(openPositions, 0);
  const PNL = num(lastPnl, 0);
  const TRADING = !!isTrading;

  // "vaultboy" or "vaultgirl"
  const baseKey = useMemo(() => {
    return String(sex || "girl").toLowerCase().includes("boy") ? "vaultboy" : "vaultgirl";
  }, [sex]);

  // ✅ /public/companion/vaultgirl and /public/companion/vaultboy
  const folder = useMemo(() => `/companion/${baseKey}`, [baseKey]);

  // ✅ Map current bot state to one of your 8 images
  const portraitState = useMemo(() => {
    const m = String(mood || "").toLowerCase();
    const s = String(stage || "").toLowerCase();

    // Super low health states (match your filenames)
    if (H <= 5) return "zombie";  // vaultgirl_zombie..png / vaultboy_zombie..png
    if (H <= 20) return "zomple"; // vaultgirl_zomple..png / vaultboy_zomple..png

    // Cryo has priority
    if (s.includes("cryo") || m.includes("cryo")) return "cryo";

    // Mood overrides (if you send these moods from backend)
    if (m.includes("sick")) return "sick";
    if (m.includes("weak") || m.includes("tired") || m.includes("low")) return "weak";
    if (m.includes("happy")) return "happy";
    if (m.includes("thriv") || m.includes("strong") || m.includes("great")) return "thriving";

    // Health-based fallback
    if (H < 35) return "sick";
    if (H < 60) return "weak";

    // Trading reaction fallback
    if (TRADING && PNL > 0) return "thriving";
    if (TRADING && PNL < 0) return "weak";

    return "idle";
  }, [mood, stage, H, TRADING, PNL]);

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
    if (!TRADING) return "IDLE";
    if (PNL > 0) return "TRADING · PROFIT";
    if (PNL < 0) return "TRADING · LOSS";
    return "TRADING · ACTIVE";
  }, [TRADING, PNL, H]);

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
    PNL < 0
      ? "var(--pip-down-fill, rgba(255,80,80,0.18))"
      : "var(--pip-up-fill, rgba(0,255,160,0.18))";

  // ✅ IMPORTANT: your files really are "..png" and we keep them!
  // Also: add extra fallback so it's harder to "IMAGE NOT FOUND"
  const candidates = useMemo(() => {
    const primary = `${folder}/${baseKey}_${portraitState}..png`;
    const idle = `${folder}/${baseKey}_idle..png`;

    // If zombie image missing but zomple exists (or vice versa) try both:
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

  const [resolvedSrc, setResolvedSrc] = useState("");

  useEffect(() => {
    let cancelled = false;
    const bust = `v=${Date.now()}`;

    const tryLoad = async () => {
      for (const raw of candidates) {
        const src = raw.includes("?") ? `${raw}&${bust}` : `${raw}?${bust}`;
        const ok = await new Promise((res) => {
          const im = new Image();
          im.onload = () => res(true);
          im.onerror = () => res(false);
          im.src = src;
        });
        if (cancelled) return;
        if (ok) {
          setResolvedSrc(src);
          return;
        }
      }
      setResolvedSrc("");
    };

    tryLoad();
    return () => {
      cancelled = true;
    };
  }, [candidates]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg viewBox="0 0 520 520" width="100%" height="100%" role="img" aria-label="Vault companion hologram">
        <defs>
          <filter id="pipGlow" x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation={8 * glowMul} result="blur" />
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
          <rect
            x="70"
            y="96"
            width="380"
            height="350"
            rx="22"
            fill="rgba(0,0,0,0.12)"
            stroke="rgba(120,255,170,0.18)"
          />
          <circle cx="260" cy="250" r="170" fill="url(#holoAura)" opacity="0.95" />

          {resolvedSrc ? (
            <image
              href={resolvedSrc}
              x="70"
              y="96"
              width="380"
              height="350"
              preserveAspectRatio="xMidYMid meet"
              filter="url(#holoTint)"
              opacity="0.98"
            />
          ) : (
            <text x="260" y="260" textAnchor="middle" fill="rgba(170,255,210,0.75)" fontSize="14">
              IMAGE NOT FOUND
            </text>
          )}

          <rect x="70" y="96" width="380" height="350" fill="url(#scan)" opacity="0.55" />

          {TRADING && H > 5 && (
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

        {showDebugTag && (
          <text x="58" y="496" fontSize="11" fill="rgba(120,255,170,0.75)" letterSpacing="2">
            sex={baseKey} state={portraitState} src={resolvedSrc ? "OK" : "FAIL"} file={resolvedSrc || "-"}
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

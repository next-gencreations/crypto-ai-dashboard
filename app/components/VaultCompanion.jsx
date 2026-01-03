"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Realistic-ish vault-inspired full-body character (boy/girl)
 * - No external deps
 * - Uses SVG + tiny CSS animations
 * - Driven by API data:
 *    pet.health, pet.hunger, pet.stage, pet.mood, pet.fainted_until_utc
 *    heartbeat.survival_mode, heartbeat.prices_ok, heartbeat.status
 *
 * Modes:
 *  - "cryo" if fainted or paused or prices not ok
 *  - "hurt" if low health
 *  - "walk" if hungry (urgent)
 *  - "analyze" if normal (thinking)
 */

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function isFutureIso(iso) {
  if (!iso) return false;
  try {
    const d = new Date(iso);
    return d.getTime() > Date.now();
  } catch {
    return false;
  }
}

function pickGenderFromStorage() {
  try {
    const v = localStorage.getItem("vault_gender");
    if (v === "boy" || v === "girl") return v;
  } catch {}
  return "boy";
}

function saveGenderToStorage(g) {
  try {
    localStorage.setItem("vault_gender", g);
  } catch {}
}

export default function VaultCompanion({ pet = {}, heartbeat = {} }) {
  const [gender, setGender] = useState("boy");

  useEffect(() => {
    setGender(pickGenderFromStorage());
  }, []);

  const health = Number(pet?.health ?? 100);
  const hunger = Number(pet?.hunger ?? 0);
  const mood = String(pet?.mood ?? "neutral").toLowerCase();
  const stage = String(pet?.stage ?? "egg").toLowerCase();
  const faintedUntil = String(pet?.fainted_until_utc ?? "");

  const survivalMode = String(heartbeat?.survival_mode ?? "NORMAL").toUpperCase();
  const pricesOk = heartbeat?.prices_ok === 1 || heartbeat?.prices_ok === true;
  const status = String(heartbeat?.status ?? "running").toLowerCase();

  const fainted = isFutureIso(faintedUntil);

  // Decide current animation mode
  const mode = useMemo(() => {
    // Cryo if fainted, or bot not getting prices, or status not running
    if (fainted || !pricesOk || status !== "running") return "cryo";
    if (health <= 25) return "hurt";
    if (hunger >= 75 || survivalMode === "HUNGRY" || survivalMode === "STARVING") return "walk";
    // if thinking / focused
    return "analyze";
  }, [fainted, pricesOk, status, health, hunger, survivalMode]);

  // Visual intensity (glow/flicker) based on health/hunger
  const glow = clamp(0.35 + (health / 100) * 0.45 - (hunger / 100) * 0.20, 0.2, 0.8);
  const shake = mode === "hurt" ? 1 : 0;

  // Face expression
  const face = useMemo(() => {
    if (mode === "cryo") return "sleep";
    if (health <= 25) return "pain";
    if (mood.includes("hungry")) return "hungry";
    if (mood.includes("sad")) return "sad";
    if (mood.includes("happy")) return "happy";
    if (mood.includes("focused")) return "focused";
    return "neutral";
  }, [mode, health, mood]);

  const title = useMemo(() => {
    const s = stage.includes("egg") ? "Recruit (Egg)" : "Runner";
    const g = gender === "girl" ? "Scout" : "Runner";
    return `${s} • ${g}`;
  }, [stage, gender]);

  // Simple UI control
  function toggleGender() {
    const next = gender === "boy" ? "girl" : "boy";
    setGender(next);
    saveGenderToStorage(next);
  }

  // SVG colors (green CRT palette)
  const colors = {
    bg: "rgba(0,0,0,0)",
    glow: `rgba(140, 255, 200, ${glow})`,
    line: "rgba(210,255,235,0.85)",
    fillDark: "rgba(30, 80, 60, 0.55)",
    fillMid: "rgba(80, 200, 150, 0.30)",
    fillLight: "rgba(190, 255, 220, 0.18)",
    tube: "rgba(160, 255, 230, 0.10)",
    tubeEdge: "rgba(200, 255, 240, 0.20)",
  };

  // Small helper for face drawing
  function EyesMouth({ x, y }) {
    // eyes positions
    const eyeY = y;
    const leftX = x - 10;
    const rightX = x + 10;

    // blink / sleep
    const isSleep = face === "sleep";
    const isPain = face === "pain";
    const isHappy = face === "happy";
    const isSad = face === "sad";
    const isHungry = face === "hungry";
    const isFocused = face === "focused";

    const mouthY = y + 18;

    return (
      <g>
        {/* Eyes */}
        {isSleep ? (
          <>
            <path d={`M ${leftX - 5} ${eyeY} Q ${leftX} ${eyeY + 3} ${leftX + 5} ${eyeY}`} stroke={colors.line} strokeWidth="2" fill="none" opacity="0.9" />
            <path d={`M ${rightX - 5} ${eyeY} Q ${rightX} ${eyeY + 3} ${rightX + 5} ${eyeY}`} stroke={colors.line} strokeWidth="2" fill="none" opacity="0.9" />
          </>
        ) : isPain ? (
          <>
            <path d={`M ${leftX - 6} ${eyeY - 2} L ${leftX + 6} ${eyeY + 4}`} stroke={colors.line} strokeWidth="2" opacity="0.9" />
            <path d={`M ${rightX - 6} ${eyeY + 4} L ${rightX + 6} ${eyeY - 2}`} stroke={colors.line} strokeWidth="2" opacity="0.9" />
          </>
        ) : (
          <>
            <circle cx={leftX} cy={eyeY} r="3.2" fill={colors.line} opacity="0.9" />
            <circle cx={rightX} cy={eyeY} r="3.2" fill={colors.line} opacity="0.9" />
            {isFocused && (
              <>
                <path d={`M ${leftX - 8} ${eyeY - 8} Q ${leftX} ${eyeY - 12} ${leftX + 8} ${eyeY - 8}`} stroke={colors.line} strokeWidth="2" opacity="0.55" fill="none" />
                <path d={`M ${rightX - 8} ${eyeY - 8} Q ${rightX} ${eyeY - 12} ${rightX + 8} ${eyeY - 8}`} stroke={colors.line} strokeWidth="2" opacity="0.55" fill="none" />
              </>
            )}
          </>
        )}

        {/* Mouth */}
        {isHappy ? (
          <path d={`M ${x - 10} ${mouthY} Q ${x} ${mouthY + 8} ${x + 10} ${mouthY}`} stroke={colors.line} strokeWidth="2.4" fill="none" opacity="0.9" />
        ) : isSad ? (
          <path d={`M ${x - 10} ${mouthY + 6} Q ${x} ${mouthY - 2} ${x + 10} ${mouthY + 6}`} stroke={colors.line} strokeWidth="2.4" fill="none" opacity="0.85" />
        ) : isHungry ? (
          <path d={`M ${x - 9} ${mouthY} Q ${x} ${mouthY + 2} ${x + 9} ${mouthY}`} stroke={colors.line} strokeWidth="2.4" fill="none" opacity="0.85" />
        ) : isPain ? (
          <path d={`M ${x - 8} ${mouthY + 3} L ${x + 8} ${mouthY + 3}`} stroke={colors.line} strokeWidth="2.4" opacity="0.8" />
        ) : (
          <path d={`M ${x - 8} ${mouthY} L ${x + 8} ${mouthY}`} stroke={colors.line} strokeWidth="2.2" opacity="0.8" />
        )}
      </g>
    );
  }

  // Walk/analyze arm/leg offsets
  const walkPhase = mode === "walk" ? "walk" : "";
  const breathePhase = mode === "analyze" ? "breathe" : "";
  const hurtPhase = mode === "hurt" ? "hurt" : "";
  const cryoPhase = mode === "cryo" ? "cryo" : "";

  return (
    <div style={{ position: "relative" }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.9 }}>{title}</div>

        <button
          onClick={toggleGender}
          style={{
            padding: "7px 10px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.92)",
            cursor: "pointer",
            fontSize: 12,
          }}
          title="Toggle boy/girl (cosmetic)"
        >
          {gender === "boy" ? "Boy" : "Girl"} ▾
        </button>
      </div>

      {/* Character stage */}
      <div
        style={{
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "radial-gradient(700px 300px at 50% 20%, rgba(140,255,200,0.08), rgba(255,255,255,0.02))",
          padding: 10,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Scanlines */}
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            opacity: 0.16,
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 1px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)",
            mixBlendMode: "overlay",
          }}
        />

        {/* SVG Character */}
        <svg
          viewBox="0 0 260 360"
          width="100%"
          height="320"
          style={{
            display: "block",
            filter: `drop-shadow(0 0 18px ${colors.glow})`,
          }}
        >
          <defs>
            <filter id="flicker">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" stitchTiles="stitch" />
              <feColorMatrix type="matrix" values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.06 0" />
              <feComposite operator="in" in2="SourceGraphic" />
            </filter>
          </defs>

          {/* Cryo tube overlay */}
          {mode === "cryo" && (
            <g>
              <rect x="40" y="20" width="180" height="320" rx="80" fill={colors.tube} stroke={colors.tubeEdge} strokeWidth="2" />
              <path d="M 60 40 Q 130 10 200 40" stroke={colors.tubeEdge} strokeWidth="2" fill="none" opacity="0.7" />
              <path d="M 60 320 Q 130 350 200 320" stroke={colors.tubeEdge} strokeWidth="2" fill="none" opacity="0.7" />
              {/* fog */}
              <path d="M 55 90 C 90 70, 120 120, 150 95 C 180 70, 205 110, 220 90" fill="rgba(200,255,240,0.08)" />
              <path d="M 55 250 C 90 230, 120 280, 150 255 C 180 230, 205 270, 220 250" fill="rgba(200,255,240,0.06)" />
            </g>
          )}

          {/* Body group (animated) */}
          <g
            className={`vault-body ${walkPhase} ${breathePhase} ${hurtPhase} ${cryoPhase}`}
            style={{ transformOrigin: "130px 200px" }}
          >
            {/* Head */}
            <g>
              <path
                d="M 95 65
                   Q 130 35 165 65
                   Q 178 85 170 110
                   Q 158 140 130 142
                   Q 102 140 90 110
                   Q 82 85 95 65 Z"
                fill={colors.fillMid}
                stroke={colors.line}
                strokeWidth="2.2"
              />

              {/* Hair */}
              {gender === "boy" ? (
                <path
                  d="M 95 70
                     Q 120 45 150 55
                     Q 165 60 170 78
                     Q 150 70 138 78
                     Q 120 90 102 80
                     Q 96 76 95 70 Z"
                  fill={colors.fillDark}
                  stroke={colors.line}
                  strokeWidth="1.8"
                  opacity="0.9"
                />
              ) : (
                <path
                  d="M 95 72
                     Q 125 40 165 62
                     Q 175 76 170 90
                     Q 155 86 146 92
                     Q 132 102 112 92
                     Q 98 84 95 72 Z"
                  fill={colors.fillDark}
                  stroke={colors.line}
                  strokeWidth="1.8"
                  opacity="0.9"
                />
              )}

              {/* Ponytail for girl */}
              {gender === "girl" && (
                <path
                  d="M 165 88
                     Q 190 105 176 135
                     Q 160 155 150 132
                     Q 160 112 165 88 Z"
                  fill={colors.fillDark}
                  stroke={colors.line}
                  strokeWidth="1.6"
                  opacity="0.85"
                />
              )}

              {/* Face */}
              <EyesMouth x={130} y={98} />

              {/* Neck */}
              <path d="M 118 142 L 118 158 Q 130 166 142 158 L 142 142" fill={colors.fillMid} stroke={colors.line} strokeWidth="2" />
            </g>

            {/* Torso (jumpsuit) */}
            <g>
              <path
                d="M 92 160
                   Q 130 140 168 160
                   Q 184 188 176 232
                   Q 168 270 130 278
                   Q 92 270 84 232
                   Q 76 188 92 160 Z"
                fill={colors.fillDark}
                stroke={colors.line}
                strokeWidth="2.2"
              />

              {/* Chest panel */}
              <path
                d="M 105 175
                   Q 130 162 155 175
                   Q 164 196 160 215
                   Q 146 224 130 224
                   Q 114 224 100 215
                   Q 96 196 105 175 Z"
                fill={colors.fillMid}
                stroke={colors.line}
                strokeWidth="1.7"
                opacity="0.9"
              />

              {/* Diagonal strap (unique, not Fallout) */}
              <path
                d="M 98 185 L 160 230"
                stroke={colors.line}
                strokeWidth="3"
                opacity="0.65"
              />
              <circle cx="125" cy="210" r="5" fill={colors.fillLight} stroke={colors.line} strokeWidth="1.5" opacity="0.8" />

              {/* Wrist device hint (analyze) */}
              {mode === "analyze" && (
                <g opacity="0.9">
                  <rect x="170" y="215" width="26" height="16" rx="4" fill="rgba(200,255,240,0.08)" stroke={colors.line} strokeWidth="1.4" />
                  <path d="M 172 223 L 194 223" stroke={colors.line} strokeWidth="1.2" opacity="0.8" />
                  <path d="M 172 227 L 190 227" stroke={colors.line} strokeWidth="1.2" opacity="0.6" />
                </g>
              )}
            </g>

            {/* Arms */}
            <g className="arm-left" style={{ transformOrigin: "92px 185px" }}>
              <path d="M 92 176 Q 70 196 72 222 Q 74 246 92 256" fill="none" stroke={colors.line} strokeWidth="5" opacity="0.7" />
              <path d="M 92 256 Q 98 268 110 262" fill="none" stroke={colors.line} strokeWidth="5" opacity="0.7" />
            </g>

            <g className="arm-right" style={{ transformOrigin: "168px 185px" }}>
              <path d="M 168 176 Q 190 196 188 222 Q 186 246 168 256" fill="none" stroke={colors.line} strokeWidth="5" opacity="0.7" />
              <path d="M 168 256 Q 162 268 150 262" fill="none" stroke={colors.line} strokeWidth="5" opacity="0.7" />
            </g>

            {/* Legs */}
            <g className="leg-left" style={{ transformOrigin: "115px 278px" }}>
              <path d="M 115 278 Q 105 304 110 332" fill="none" stroke={colors.line} strokeWidth="6" opacity="0.75" />
              <path d="M 106 332 Q 120 340 132 332" fill="none" stroke={colors.line} strokeWidth="6" opacity="0.75" />
            </g>

            <g className="leg-right" style={{ transformOrigin: "145px 278px" }}>
              <path d="M 145 278 Q 155 304 150 332" fill="none" stroke={colors.line} strokeWidth="6" opacity="0.75" />
              <path d="M 128 332 Q 140 340 154 332" fill="none" stroke={colors.line} strokeWidth="6" opacity="0.75" />
            </g>
          </g>

          {/* CRT flicker overlay */}
          <rect x="0" y="0" width="260" height="360" fill="rgba(255,255,255,0.02)" filter="url(#flicker)" opacity="0.35" />

        </svg>

        {/* Status strip */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          <span style={badge(mode, colors)}>
            Mode: <strong style={{ opacity: 0.95 }}>{mode.toUpperCase()}</strong>
          </span>
          <span style={badge(face, colors)}>
            Mood: <strong style={{ opacity: 0.95 }}>{face.toUpperCase()}</strong>
          </span>
        </div>

        {/* Hint text */}
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.72, lineHeight: 1.35 }}>
          {mode === "cryo" ? (
            <>❄️ Cryo stabilisation active. Bot will recover and hunt again when conditions improve.</>
          ) : mode === "hurt" ? (
            <>⚠️ Damage taken. The bot should protect itself and regain edge.</>
          ) : mode === "walk" ? (
            <>🍽️ Hungry — scanning harder for the next winning “meal”.</>
          ) : (
            <>🧠 Analyzing markets — patience until a good edge appears.</>
          )}
        </div>
      </div>

      {/* Local CSS animations */}
      <style>{`
        .vault-body.breathe { animation: breathe 2.8s ease-in-out infinite; }
        @keyframes breathe {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(1.6px); }
        }

        .vault-body.walk .leg-left { animation: legL 0.6s ease-in-out infinite; }
        .vault-body.walk .leg-right { animation: legR 0.6s ease-in-out infinite; }
        .vault-body.walk .arm-left { animation: armL 0.6s ease-in-out infinite; }
        .vault-body.walk .arm-right { animation: armR 0.6s ease-in-out infinite; }

        @keyframes legL { 0%,100%{ transform: rotate(10deg);} 50%{ transform: rotate(-10deg);} }
        @keyframes legR { 0%,100%{ transform: rotate(-10deg);} 50%{ transform: rotate(10deg);} }
        @keyframes armL { 0%,100%{ transform: rotate(-12deg);} 50%{ transform: rotate(12deg);} }
        @keyframes armR { 0%,100%{ transform: rotate(12deg);} 50%{ transform: rotate(-12deg);} }

        .vault-body.hurt { animation: hurt 0.35s ease-in-out infinite; }
        @keyframes hurt {
          0%,100%{ transform: translateX(0px) rotate(0deg); }
          25%{ transform: translateX(-1.5px) rotate(-0.6deg); }
          50%{ transform: translateX(1.5px) rotate(0.6deg); }
          75%{ transform: translateX(-1px) rotate(-0.4deg); }
        }

        .vault-body.cryo { animation: cryo 3.4s ease-in-out infinite; opacity: 0.85; }
        @keyframes cryo {
          0%,100%{ transform: translateY(0px); opacity: 0.85; }
          50%{ transform: translateY(1px); opacity: 0.75; }
        }
      `}</style>
    </div>
  );
}

function badge(label, colors) {
  const t = String(label || "").toLowerCase();
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    fontSize: 12,
    opacity: 0.95,
  };
  if (t.includes("cryo")) return { ...base, background: "rgba(120,200,255,0.10)", borderColor: "rgba(120,200,255,0.20)" };
  if (t.includes("hurt") || t.includes("pain")) return { ...base, background: "rgba(255,80,80,0.10)", borderColor: "rgba(255,80,80,0.20)" };
  if (t.includes("walk") || t.includes("hungry")) return { ...base, background: "rgba(255,200,80,0.10)", borderColor: "rgba(255,200,80,0.20)" };
  if (t.includes("analyze") || t.includes("focused")) return { ...base, background: "rgba(80,255,170,0.08)", borderColor: "rgba(80,255,170,0.18)" };
  return base;
}

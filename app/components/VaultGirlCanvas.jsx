// app/components/VaultGirlCanvas.jsx
"use client";

import { useEffect, useRef } from "react";

export default function VaultGirlCanvas({ mood = "neutral", stage = "egg" }) {
  const ref = useRef(null);
  const raf = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const cssW = 320;
    const cssH = 360;
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Read pip colors ONCE
    const rootStyle = getComputedStyle(document.documentElement);
    const ink = rootStyle.getPropertyValue("--pip-ink")?.trim() || "#77ff9a";
    const border = rootStyle.getPropertyValue("--pip-border")?.trim() || "rgba(119,255,154,0.2)";
    const bg = "rgba(0,0,0,0.25)";
    const fill = "rgba(119,255,154,0.10)";

    let frame = 0;

    function draw() {
      frame++;
      ctx.clearRect(0, 0, cssW, cssH);

      // frame
      roundRect(ctx, 10, 10, cssW - 20, cssH - 20, 18, bg, border, 2);

      // scanlines
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = "#000";
      for (let y = 18; y < cssH - 18; y += 6) {
        ctx.fillRect(14, y, cssW - 28, 2);
      }
      ctx.globalAlpha = 1;

      // animation controls
      const isCryo = mood === "cryo";
      const isHappy = mood === "happy";
      const isPanic = mood === "panic";

      const bob = isCryo ? Math.sin(frame * 0.04) * 1.5
               : isPanic ? Math.sin(frame * 0.5) * 2.5
               : isHappy ? Math.sin(frame * 0.10) * 3.5
               : Math.sin(frame * 0.06) * 2;

      const sway = isPanic ? Math.sin(frame * 0.7) * 2.5
                : Math.sin(frame * 0.04) * 1.2;

      // walk cycle
      const walk = Math.sin(frame * 0.10);
      const legA = walk * 14;
      const legB = -walk * 14;
      const armA = -walk * 10;
      const armB = walk * 10;

      // center
      const cx = cssW / 2;
      const cy = cssH / 2 + 30;

      ctx.save();
      ctx.translate(sway, bob);

      // STYLE
      ctx.strokeStyle = ink;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // --- HAIR (outline, closer to reference look) ---
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      // bob haircut-ish outline
      ctx.moveTo(cx - 38, cy - 125);
      ctx.quadraticCurveTo(cx, cy - 160, cx + 38, cy - 125);
      ctx.quadraticCurveTo(cx + 48, cy - 95, cx + 26, cy - 75);
      ctx.quadraticCurveTo(cx + 14, cy - 65, cx, cy - 65);
      ctx.quadraticCurveTo(cx - 14, cy - 65, cx - 26, cy - 75);
      ctx.quadraticCurveTo(cx - 48, cy - 95, cx - 38, cy - 125);
      ctx.stroke();

      // small side ponytail if hatched
      if (String(stage).toLowerCase() === "hatched") {
        ctx.beginPath();
        ctx.moveTo(cx + 26, cy - 98);
        ctx.quadraticCurveTo(cx + 62, cy - 80, cx + 64, cy - 50);
        ctx.quadraticCurveTo(cx + 62, cy - 22, cx + 42, cy - 20);
        ctx.stroke();
      }

      // --- HEAD ---
      ctx.globalAlpha = 1;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 100, 24, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // eyes
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(cx - 8, cy - 104, 2.6, 0, Math.PI * 2);
      ctx.arc(cx + 8, cy - 104, 2.6, 0, Math.PI * 2);
      ctx.fill();

      // mouth (mood)
      ctx.beginPath();
      if (isCryo) {
        ctx.moveTo(cx - 10, cy - 86);
        ctx.lineTo(cx + 10, cy - 86);
      } else if (isHappy) {
        ctx.moveTo(cx - 10, cy - 88);
        ctx.quadraticCurveTo(cx, cy - 80, cx + 10, cy - 88);
      } else if (isPanic) {
        ctx.moveTo(cx - 8, cy - 88);
        ctx.quadraticCurveTo(cx, cy - 76, cx + 8, cy - 88);
      } else {
        ctx.moveTo(cx - 9, cy - 88);
        ctx.quadraticCurveTo(cx, cy - 84, cx + 9, cy - 88);
      }
      ctx.stroke();

      // --- BODY (slightly side pose) ---
      ctx.fillStyle = fill;
      ctx.beginPath();
      // torso outline (slight lean)
      ctx.moveTo(cx - 26, cy - 60);
      ctx.quadraticCurveTo(cx - 36, cy - 20, cx - 22, cy + 10);
      ctx.lineTo(cx - 18, cy + 70);
      ctx.quadraticCurveTo(cx, cy + 80, cx + 18, cy + 70);
      ctx.lineTo(cx + 22, cy + 10);
      ctx.quadraticCurveTo(cx + 36, cy - 20, cx + 26, cy - 60);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // zipper
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 58);
      ctx.lineTo(cx, cy + 68);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // vault number
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.85;
      ctx.font = "bold 18px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.fillText("13", cx + 2, cy + 8);
      ctx.globalAlpha = 1;

      // --- ARMS (swing) ---
      // left arm
      ctx.beginPath();
      ctx.moveTo(cx - 26, cy - 30);
      ctx.quadraticCurveTo(cx - 54, cy - 8 + armA, cx - 46, cy + 30 + armA);
      ctx.stroke();

      // right arm
      ctx.beginPath();
      ctx.moveTo(cx + 26, cy - 30);
      ctx.quadraticCurveTo(cx + 54, cy - 8 + armB, cx + 46, cy + 30 + armB);
      ctx.stroke();

      // --- LEGS (walk swing) ---
      // left leg forward
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 70);
      ctx.quadraticCurveTo(cx - 28, cy + 110, cx - 14, cy + 140 + legA * 0.2);
      ctx.stroke();

      // right leg back
      ctx.beginPath();
      ctx.moveTo(cx + 8, cy + 70);
      ctx.quadraticCurveTo(cx + 22, cy + 112, cx + 12, cy + 140 + legB * 0.2);
      ctx.stroke();

      // shoes
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.ellipse(cx - 14, cy + 146, 8, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 12, cy + 146, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.restore();

      raf.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(raf.current);
    };
  }, [mood, stage]);

  return <canvas ref={ref} style={{ display: "block" }} />;
}

function roundRect(ctx, x, y, w, h, r, fill, stroke, strokeW = 2) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeW;
    ctx.stroke();
  }
}

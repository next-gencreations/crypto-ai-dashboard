"use client";
import { useEffect, useRef } from "react";

export default function VaultGirlCanvas({ mood = "neutral" }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    // HiDPI crispness
    const cssW = 320;
    const cssH = 360;
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    function draw() {
      ctx.clearRect(0, 0, cssW, cssH);

      // pip colors
      const ink = getComputedStyle(document.documentElement).getPropertyValue("--pip-ink")?.trim() || "#77ff9a";
      const border = getComputedStyle(document.documentElement).getPropertyValue("--pip-border")?.trim() || "rgba(119,255,154,0.2)";
      const bg = "rgba(0,0,0,0.25)";
      const fill = "rgba(119,255,154,0.10)";

      // frame
      roundRect(ctx, 10, 10, cssW - 20, cssH - 20, 18, bg, border);

      // scanlines
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#000";
      for (let y = 18; y < cssH - 18; y += 6) ctx.fillRect(14, y, cssW - 28, 2);
      ctx.globalAlpha = 1;

      // title
      ctx.fillStyle = ink;
      ctx.font = "700 16px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.fillText("VAULT GIRL", 22, 36);

      // mood text
      ctx.globalAlpha = 0.85;
      ctx.font = "700 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.fillText(`MOOD: ${String(mood).toUpperCase()}`, 22, 56);
      ctx.globalAlpha = 1;

      // character center
      const cx = 160;
      const cy = 190;

      // hair (big pip silhouette)
      ctx.fillStyle = fill;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.ellipse(cx, cy - 95, 56, 46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // hair outline / bob
      ctx.beginPath();
      ctx.moveTo(cx - 62, cy - 95);
      ctx.quadraticCurveTo(cx - 54, cy - 150, cx, cy - 150);
      ctx.quadraticCurveTo(cx + 54, cy - 150, cx + 62, cy - 95);
      ctx.quadraticCurveTo(cx + 64, cy - 58, cx + 24, cy - 46);
      ctx.quadraticCurveTo(cx + 8, cy - 38, cx, cy - 38);
      ctx.quadraticCurveTo(cx - 8, cy - 38, cx - 24, cy - 46);
      ctx.quadraticCurveTo(cx - 64, cy - 58, cx - 62, cy - 95);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // goggles
      ctx.globalAlpha = 0.9;
      roundRect(ctx, cx - 54, cy - 125, 44, 24, 7, "rgba(0,0,0,0.20)", ink, 3);
      roundRect(ctx, cx + 10, cy - 125, 44, 24, 7, "rgba(0,0,0,0.20)", ink, 3);
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 113);
      ctx.lineTo(cx + 10, cy - 113);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // face
      ctx.beginPath();
      ctx.ellipse(cx, cy - 85, 34, 40, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(119,255,154,0.06)";
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.stroke();

      // eyes
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(cx - 10, cy - 90, 3, 0, Math.PI * 2);
      ctx.arc(cx + 10, cy - 90, 3, 0, Math.PI * 2);
      ctx.fill();

      // mouth (mood)
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (String(mood).toLowerCase() === "panic") {
        ctx.moveTo(cx - 10, cy - 70);
        ctx.quadraticCurveTo(cx, cy - 58, cx + 10, cy - 70);
      } else if (String(mood).toLowerCase() === "sick") {
        ctx.moveTo(cx - 12, cy - 70);
        ctx.quadraticCurveTo(cx, cy - 78, cx + 12, cy - 70);
      } else {
        ctx.moveTo(cx - 12, cy - 72);
        ctx.quadraticCurveTo(cx, cy - 62, cx + 12, cy - 72);
      }
      ctx.stroke();

      // body (vault suit)
      roundRect(ctx, cx - 46, cy - 35, 92, 120, 18, fill, ink, 3);

      // center stripe
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 35);
      ctx.lineTo(cx, cy + 85);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // arms (thumb up + hip)
      ctx.lineWidth = 4;

      // left arm on hip
      ctx.beginPath();
      ctx.moveTo(cx - 46, cy + 10);
      ctx.quadraticCurveTo(cx - 78, cy + 30, cx - 58, cy + 58);
      ctx.stroke();

      // right arm thumbs up
      ctx.beginPath();
      ctx.moveTo(cx + 46, cy + 10);
      ctx.quadraticCurveTo(cx + 86, cy + 12, cx + 88, cy - 8);
      ctx.stroke();

      // thumb
      ctx.beginPath();
      ctx.moveTo(cx + 86, cy - 12);
      ctx.quadraticCurveTo(cx + 100, cy - 22, cx + 100, cy - 6);
      ctx.stroke();

      // legs
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy + 85);
      ctx.quadraticCurveTo(cx - 30, cy + 120, cx - 14, cy + 140);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 18, cy + 85);
      ctx.quadraticCurveTo(cx + 30, cy + 120, cx + 14, cy + 140);
      ctx.stroke();

      // vault number
      ctx.globalAlpha = 0.9;
      ctx.font = "900 22px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.fillText("76", cx, cy + 35);
      ctx.globalAlpha = 1;
    }

    draw();
  }, [mood]);

  return <canvas ref={ref} />;
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

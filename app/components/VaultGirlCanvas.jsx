// app/components/VaultGirlCanvas.jsx
"use client";
import { useEffect, useRef } from "react";

export default function VaultGirlCanvas({ mood = "neutral", stage = "hatched" }) {
  const ref = useRef(null);
  const animationRef = useRef(0);

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

    let frame = 0;

    function draw() {
      frame++;
      ctx.clearRect(0, 0, cssW, cssH);

      // pip colors from your CSS
      const ink = getComputedStyle(document.documentElement).getPropertyValue("--pip-ink")?.trim() || "#77ff9a";
      const border = getComputedStyle(document.documentElement).getPropertyValue("--pip-border")?.trim() || "rgba(119,255,154,0.2)";
      const bg = "rgba(0,0,0,0.25)";
      const fill = "rgba(119,255,154,0.15)";

      // frame background
      roundRect(ctx, 10, 10, cssW - 20, cssH - 20, 18, bg, border, 2);

      // subtle scanlines
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = "#000";
      for (let y = 18; y < cssH - 18; y += 5) {
        ctx.fillRect(14, y, cssW - 28, 2);
      }
      ctx.globalAlpha = 1;

      // vault girl drawing area
      const centerX = cssW / 2;
      const centerY = cssH / 2 + 30;

      // Animation based on mood
      let bobOffset = 0;
      let swayOffset = 0;
      
      if (mood === "cryo") {
        // Gentle floating animation for cryo
        bobOffset = Math.sin(frame * 0.05) * 2;
      } else if (mood === "happy") {
        // More energetic bobbing
        bobOffset = Math.sin(frame * 0.1) * 4;
        swayOffset = Math.sin(frame * 0.07) * 3;
      } else if (mood === "sad") {
        // Slower, depressed movement
        bobOffset = Math.sin(frame * 0.03) * 1;
      } else {
        // Default neutral animation
        bobOffset = Math.sin(frame * 0.06) * 2;
      }

      // Draw Vault Girl (feminine version of Vault Boy)
      ctx.save();
      ctx.translate(swayOffset, bobOffset);

      // HAIR - Long, feminine hairstyle
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.8;
      
      // Main hair shape
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - 120, 40, 50, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Hair bangs/fringe
      ctx.beginPath();
      ctx.moveTo(centerX - 45, centerY - 115);
      ctx.quadraticCurveTo(centerX - 30, centerY - 140, centerX, centerY - 140);
      ctx.quadraticCurveTo(centerX + 30, centerY - 140, centerX + 45, centerY - 115);
      ctx.quadraticCurveTo(centerX + 40, centerY - 85, centerX + 20, centerY - 70);
      ctx.quadraticCurveTo(centerX + 10, centerY - 65, centerX, centerY - 65);
      ctx.quadraticCurveTo(centerX - 10, centerY - 65, centerX - 20, centerY - 70);
      ctx.quadraticCurveTo(centerX - 40, centerY - 85, centerX - 45, centerY - 115);
      ctx.closePath();
      ctx.fill();
      
      // Ponytail if stage is hatched
      if (stage === "hatched") {
        ctx.beginPath();
        ctx.moveTo(centerX + 10, centerY - 90);
        ctx.quadraticCurveTo(centerX + 30, centerY - 70, centerX + 60, centerY - 60);
        ctx.quadraticCurveTo(centerX + 70, centerY - 40, centerX + 50, centerY - 20);
        ctx.quadraticCurveTo(centerX + 40, centerY - 10, centerX + 20, centerY - 10);
        ctx.quadraticCurveTo(centerX, centerY - 20, centerX - 10, centerY - 30);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 12;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // FACE - Rounder, feminine face
      ctx.fillStyle = "rgba(119,255,154,0.12)";
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      
      // Face shape
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - 100, 28, 35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // EYES - Larger, more feminine
      ctx.fillStyle = ink;
      
      // Left eye
      ctx.beginPath();
      ctx.ellipse(centerX - 10, centerY - 105, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Right eye
      ctx.beginPath();
      ctx.ellipse(centerX + 10, centerY - 105, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye sparkles
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(centerX - 8, centerY - 107, 1, 0, Math.PI * 2);
      ctx.arc(centerX + 12, centerY - 107, 1, 0, Math.PI * 2);
      ctx.fill();

      // EYELASHES - Feminine touch
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
      
      // Left eyelashes
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX - 14 - i * 2, centerY - 110);
        ctx.lineTo(centerX - 16 - i * 2, centerY - 115);
        ctx.stroke();
      }
      
      // Right eyelashes
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX + 14 + i * 2, centerY - 110);
        ctx.lineTo(centerX + 16 + i * 2, centerY - 115);
        ctx.stroke();
      }

      // MOUTH - Based on mood
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      
      if (mood === "cryo") {
        // Sleeping/neutral line for cryo
        ctx.beginPath();
        ctx.moveTo(centerX - 12, centerY - 85);
        ctx.lineTo(centerX + 12, centerY - 85);
        ctx.stroke();
      } else if (mood === "happy") {
        // Smile
        ctx.beginPath();
        ctx.moveTo(centerX - 12, centerY - 85);
        ctx.quadraticCurveTo(centerX, centerY - 75, centerX + 12, centerY - 85);
        ctx.stroke();
      } else if (mood === "sad") {
        // Frown
        ctx.beginPath();
        ctx.moveTo(centerX - 12, centerY - 90);
        ctx.quadraticCurveTo(centerX, centerY - 80, centerX + 12, centerY - 90);
        ctx.stroke();
      } else {
        // Default slight smile
        ctx.beginPath();
        ctx.moveTo(centerX - 10, centerY - 85);
        ctx.quadraticCurveTo(centerX, centerY - 80, centerX + 10, centerY - 85);
        ctx.stroke();
      }

      // BODY - Vault jumpsuit (feminine cut)
      ctx.fillStyle = fill;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      
      // Torso (more hourglass shape)
      ctx.beginPath();
      ctx.moveTo(centerX - 40, centerY - 60);
      ctx.quadraticCurveTo(centerX - 45, centerY - 20, centerX - 30, centerY);
      ctx.lineTo(centerX - 30, centerY + 60);
      ctx.quadraticCurveTo(centerX - 20, centerY + 70, centerX - 10, centerY + 70);
      ctx.lineTo(centerX + 10, centerY + 70);
      ctx.quadraticCurveTo(centerX + 20, centerY + 70, centerX + 30, centerY + 60);
      ctx.lineTo(centerX + 30, centerY);
      ctx.quadraticCurveTo(centerX + 45, centerY - 20, centerX + 40, centerY - 60);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Collar/neckline
      ctx.beginPath();
      ctx.moveTo(centerX - 25, centerY - 55);
      ctx.quadraticCurveTo(centerX, centerY - 70, centerX + 25, centerY - 55);
      ctx.stroke();

      // Vault number on chest
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.9;
      ctx.font = "bold 24px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("13", centerX, centerY + 10);
      ctx.globalAlpha = 1;

      // Center zip line
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 55);
      ctx.lineTo(centerX, centerY + 55);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // ARMS - More slender
      ctx.strokeStyle = ink;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      
      // Left arm (on hip or relaxed)
      ctx.beginPath();
      ctx.moveTo(centerX - 40, centerY - 20);
      if (mood === "happy") {
        // Waving
        ctx.quadraticCurveTo(centerX - 70, centerY - 50, centerX - 60, centerY - 80);
      } else {
        // On hip
        ctx.quadraticCurveTo(centerX - 60, centerY + 10, centerX - 50, centerY + 40);
      }
      ctx.stroke();
      
      // Right arm (thumbs up or relaxed)
      ctx.beginPath();
      ctx.moveTo(centerX + 40, centerY - 20);
      if (mood === "happy") {
        // Thumbs up!
        ctx.quadraticCurveTo(centerX + 80, centerY - 30, centerX + 85, centerY - 5);
        ctx.stroke();
        
        // Thumb
        ctx.beginPath();
        ctx.moveTo(centerX + 83, centerY - 10);
        ctx.quadraticCurveTo(centerX + 95, centerY - 20, centerX + 95, centerY);
        ctx.stroke();
      } else {
        // Relaxed at side
        ctx.quadraticCurveTo(centerX + 70, centerY + 20, centerX + 50, centerY + 50);
        ctx.stroke();
      }

      // LEGS - More slender, feminine
      ctx.lineWidth = 8;
      
      // Left leg
      ctx.beginPath();
      ctx.moveTo(centerX - 15, centerY + 60);
      ctx.quadraticCurveTo(centerX - 25, centerY + 100, centerX - 10, centerY + 130);
      ctx.stroke();
      
      // Right leg
      ctx.beginPath();
      ctx.moveTo(centerX + 15, centerY + 60);
      ctx.quadraticCurveTo(centerX + 25, centerY + 100, centerX + 10, centerY + 130);
      ctx.stroke();

      // SHOES
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.8;
      
      // Left shoe
      ctx.beginPath();
      ctx.ellipse(centerX - 12, centerY + 140, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Right shoe
      ctx.beginPath();
      ctx.ellipse(centerX + 12, centerY + 140, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.restore();

      // VAULT GIRL text
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.9;
      ctx.font = "700 16px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.textAlign = "left";
      ctx.fillText("VAULT GIRL", 22, 36);

      // Mood and stage text
      ctx.globalAlpha = 0.7;
      ctx.font = "700 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.fillText(`STAGE: ${stage.toUpperCase()}`, 22, 56);
      ctx.fillText(`MOOD: ${String(mood).toUpperCase()}`, 22, 74);
      ctx.globalAlpha = 1;

      // Continue animation
      animationRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [mood, stage]);

  return <canvas ref={ref} style={{ display: 'block' }} />;
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

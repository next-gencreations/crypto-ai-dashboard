import { useEffect, useState } from 'react';

interface Props {
  introStep: number;
}

export function CryoTube({ introStep }: Props) {
  const [steamParticles, setSteamParticles] = useState<Array<{id:number;x:number;y:number;opacity:number}>>([]);

  useEffect(() => {
    if (introStep < 1) return;
    let id = 0;
    const interval = setInterval(() => {
      const newParticle = { id: id++, x: Math.random() * 40 - 20, y: 0, opacity: 0.8 };
      setSteamParticles(prev => [...prev.slice(-12), newParticle]);
    }, 120);
    const timeout = setTimeout(() => clearInterval(interval), 4000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [introStep]);

  const doorOpen = introStep >= 2;
  const glowIntensity = introStep === 0 ? '0 0 20px #0088ff, 0 0 40px #0044ff' : introStep === 1 ? '0 0 30px #00aaff, 0 0 60px #0066ff' : '0 0 8px #0055aa';

  return (
    <div style={{ position: 'relative', width: 80, height: 160 }}>
      {/* Main tube body */}
      <div style={{
        position: 'absolute',
        left: 0, top: 20, width: 80, height: 140,
        background: 'linear-gradient(180deg, #0a1a2a 0%, #0d2040 40%, #0a1a2a 100%)',
        border: '3px solid #1a4a7a',
        borderRadius: '8px 8px 4px 4px',
        boxShadow: glowIntensity,
        overflow: 'hidden',
        transition: 'box-shadow 0.5s',
      }}>
        {/* Inner cryo glow */}
        <div style={{
          position: 'absolute', inset: 4,
          background: introStep < 2 ? 'rgba(0,150,255,0.3)' : 'rgba(0,50,100,0.1)',
          borderRadius: 4,
          transition: 'background 1s',
        }} />
        {/* Frost patterns */}
        {introStep < 2 && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(100,200,255,0.05) 8px, rgba(100,200,255,0.05) 9px)',
          }} />
        )}
        {/* Vault Girl silhouette inside (only during intro) */}
        {introStep < 2 && (
          <div style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            width: 24, height: 60,
            background: 'rgba(0,100,200,0.4)',
            borderRadius: '8px 8px 4px 4px',
            opacity: introStep === 0 ? 0.6 : 0.3,
          }} />
        )}
      </div>

      {/* Tube dome top */}
      <div style={{
        position: 'absolute', left: 4, top: 0, width: 72, height: 28,
        background: 'linear-gradient(180deg, #1a3a6a 0%, #0a1a3a 100%)',
        border: '3px solid #1a4a7a',
        borderRadius: '50% 50% 0 0',
        boxShadow: introStep < 2 ? '0 0 15px #0088ff' : 'none',
        transition: 'box-shadow 0.5s',
      }} />

      {/* Left door */}
      <div style={{
        position: 'absolute', left: doorOpen ? -52 : 3, top: 22,
        width: 37, height: 136,
        background: 'linear-gradient(180deg, #1a2a3a 0%, #0d1a28 100%)',
        border: '2px solid #2a4a6a',
        borderRadius: '4px 0 0 4px',
        transition: 'left 0.8s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 2,
        boxShadow: 'inset -4px 0 8px rgba(0,0,0,0.5)',
      }}>
        <div style={{ position: 'absolute', left: 6, top: 20, width: 4, height: 90, background: '#2a4a6a', borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: 14, top: 20, width: 4, height: 90, background: '#2a4a6a', borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: 22, top: 20, width: 4, height: 90, background: '#2a4a6a', borderRadius: 2 }} />
      </div>

      {/* Right door */}
      <div style={{
        position: 'absolute', left: doorOpen ? 93 : 42, top: 22,
        width: 37, height: 136,
        background: 'linear-gradient(180deg, #1a2a3a 0%, #0d1a28 100%)',
        border: '2px solid #2a4a6a',
        borderRadius: '0 4px 4px 0',
        transition: 'left 0.8s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 2,
        boxShadow: 'inset 4px 0 8px rgba(0,0,0,0.5)',
      }}>
        <div style={{ position: 'absolute', right: 6, top: 20, width: 4, height: 90, background: '#2a4a6a', borderRadius: 2 }} />
        <div style={{ position: 'absolute', right: 14, top: 20, width: 4, height: 90, background: '#2a4a6a', borderRadius: 2 }} />
        <div style={{ position: 'absolute', right: 22, top: 20, width: 4, height: 90, background: '#2a4a6a', borderRadius: 2 }} />
      </div>

      {/* Steam particles */}
      <div style={{ position: 'absolute', left: '50%', top: -10, pointerEvents: 'none', zIndex: 10 }}>
        {steamParticles.map((p, i) => (
          <div key={p.id} style={{
            position: 'absolute',
            left: p.x, top: -i * 5,
            width: 8, height: 8,
            borderRadius: '50%',
            background: 'rgba(200,230,255,0.7)',
            animation: 'steamRise 1.5s ease-out forwards',
            opacity: p.opacity,
          }} />
        ))}
      </div>

      {/* Status light */}
      <div style={{
        position: 'absolute', right: -4, top: 40,
        width: 8, height: 8, borderRadius: '50%',
        background: introStep < 1 ? '#0088ff' : introStep < 2 ? '#ffaa00' : '#00ff44',
        boxShadow: `0 0 8px ${introStep < 1 ? '#0088ff' : introStep < 2 ? '#ffaa00' : '#00ff44'}`,
        transition: 'background 0.5s, box-shadow 0.5s',
      }} />

      {/* Label */}
      <div style={{
        position: 'absolute', left: '50%', bottom: -20, transform: 'translateX(-50%)',
        color: '#4a8adb', fontSize: 8, fontFamily: 'monospace', whiteSpace: 'nowrap',
        letterSpacing: 1,
      }}>
        CRYO-POD 01
      </div>
    </div>
  );
}

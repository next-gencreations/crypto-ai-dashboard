import { useEffect, useState } from 'react';

interface Props {
  visible: boolean;
}

export function DayCounter({ visible }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  const days = Math.floor(elapsed / 86400);
  const hours = Math.floor((elapsed % 86400) / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div style={{
      position: 'fixed', top: 16, left: 16,
      background: 'rgba(0,10,0,0.8)',
      border: '1px solid #1a4a1a',
      borderRadius: 3,
      padding: '6px 12px',
      fontFamily: "'Courier New', monospace",
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      <div style={{ color: '#006611', fontSize: 8, letterSpacing: 2, marginBottom: 2 }}>
        TIME SINCE EMERGENCE
      </div>
      <div style={{ color: '#00ff44', fontSize: 13, letterSpacing: 2, fontWeight: 'bold' }}>
        DAY {String(days + 1).padStart(3, '0')} &nbsp; {pad(hours)}:{pad(mins)}:{pad(secs)}
      </div>
      <div style={{ color: '#004a00', fontSize: 8, letterSpacing: 1, marginTop: 2 }}>
        {elapsed < 10 ? '▶ DISORIENTATION EXPECTED' : elapsed < 60 ? '▶ GETTING BEARINGS' : '▶ STABILIZING'}
      </div>
    </div>
  );
}

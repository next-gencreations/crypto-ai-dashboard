import { MutableRefObject, useEffect, useState } from 'react';
import { RAD_ZONES } from './constants';

interface Props {
  playerPosRef: MutableRefObject<{ x: number; z: number }>;
  visible: boolean;
}

function calcRads(x: number, z: number): { rads: number; zone: string | null } {
  let totalRads = 0;
  let nearestZone: string | null = null;
  let nearestRads = 0;

  for (const zone of RAD_ZONES) {
    const dx = zone.x - x;
    const dz = zone.z - z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < zone.radius) {
      const factor = (1 - dist / zone.radius) ** 2;
      const contribution = zone.maxRads * factor;
      totalRads += contribution;
      if (contribution > nearestRads) {
        nearestRads = contribution;
        nearestZone = zone.label;
      }
    }
  }

  return { rads: Math.round(totalRads * 10) / 10, zone: nearestZone };
}

function radColor(rads: number): string {
  if (rads <= 0) return '#00ff44';
  if (rads < 2) return '#aaff00';
  if (rads < 4) return '#ffaa00';
  if (rads < 6) return '#ff6600';
  return '#ff2200';
}

function radLabel(rads: number): string {
  if (rads <= 0) return 'SAFE';
  if (rads < 2) return 'TRACE';
  if (rads < 4) return 'LOW';
  if (rads < 6) return 'ELEVATED';
  if (rads < 8) return 'HIGH';
  return 'DANGER';
}

const BAR_SEGMENTS = 12;
const MAX_RADS = 10;

export function RadiationScanner({ playerPosRef, visible }: Props) {
  const [data, setData] = useState<{ rads: number; zone: string | null }>({ rads: 0, zone: null });
  const [tick, setTick] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const { x, z } = playerPosRef.current;
      setData(calcRads(x, z));
      setTick(t => !t);
    }, 400);
    return () => clearInterval(interval);
  }, [playerPosRef]);

  if (!visible) return null;

  const { rads, zone } = data;
  const color = radColor(rads);
  const label = radLabel(rads);
  const filled = Math.round((rads / MAX_RADS) * BAR_SEGMENTS);
  const isElevated = rads > 1;

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16,
      background: 'rgba(0,10,0,0.82)',
      border: `1px solid ${color}44`,
      borderRadius: 3,
      padding: '7px 12px',
      fontFamily: "'Courier New', monospace",
      zIndex: 100,
      pointerEvents: 'none',
      minWidth: 170,
      boxShadow: isElevated ? `0 0 12px ${color}22` : 'none',
      transition: 'box-shadow 0.5s, border-color 0.5s',
    }}>
      <div style={{ color: '#006611', fontSize: 8, letterSpacing: 2, marginBottom: 3 }}>
        RAD-AWAY SCANNER
      </div>

      {/* Radiation bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
        {Array.from({ length: BAR_SEGMENTS }).map((_, i) => (
          <div key={i} style={{
            width: 9, height: 10,
            background: i < filled ? color : '#0a1a0a',
            border: `1px solid ${i < filled ? color + '88' : '#1a2a1a'}`,
            borderRadius: 1,
            transition: 'background 0.3s, border-color 0.3s',
          }} />
        ))}
      </div>

      {/* Rads value */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color, fontSize: 13, fontWeight: 'bold', letterSpacing: 1 }}>
          {rads.toFixed(1)} RAD
        </div>
        <div style={{
          color: isElevated && tick ? color : color + '88',
          fontSize: 9, letterSpacing: 2,
          transition: 'color 0.2s',
        }}>
          {label}
        </div>
      </div>

      {/* Zone label */}
      {zone && isElevated && (
        <div style={{
          color: color + 'bb', fontSize: 8, letterSpacing: 1, marginTop: 3,
          borderTop: `1px solid ${color}22`, paddingTop: 3,
        }}>
          ▶ {zone}
        </div>
      )}

      {/* Geiger text when elevated */}
      {isElevated && (
        <div style={{
          color: color + (tick ? 'ff' : '44'),
          fontSize: 7, letterSpacing: 1, marginTop: 2,
          transition: 'color 0.2s',
        }}>
          {Array.from({ length: Math.ceil(rads) }).map(() => '●').join(' ')} RADS DETECTED
        </div>
      )}
    </div>
  );
}

import { TerminalDef } from './constants';

interface Props {
  terminal: TerminalDef;
  isNearby: boolean;
  playerDir: string;
}

export function LabTerminal({ terminal, isNearby }: Props) {
  return (
    <div style={{ position: 'relative', width: 48, height: 52 }}>
      {/* Stand */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: 6, height: 20, background: '#2a3a2a',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: 28, height: 4, background: '#2a3a2a', borderRadius: 2,
      }} />

      {/* Monitor body */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 38,
        background: '#1a2a1a',
        border: `2px solid ${terminal.color}`,
        borderRadius: 4,
        boxShadow: isNearby
          ? `0 0 16px ${terminal.color}, 0 0 30px ${terminal.color}44`
          : `0 0 6px ${terminal.color}66`,
        transition: 'box-shadow 0.3s',
        overflow: 'hidden',
      }}>
        {/* Screen */}
        <div style={{
          position: 'absolute', inset: 3,
          background: '#001200',
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          gap: 2,
        }}>
          {/* Scanlines */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 3px)',
            pointerEvents: 'none',
          }} />
          <div style={{ color: terminal.color, fontSize: 5, fontFamily: 'monospace', textAlign: 'center', lineHeight: 1.3, padding: '0 2px' }}>
            <div>VAULT-TEC</div>
            <div style={{ fontSize: 4, opacity: 0.7 }}>{terminal.label.slice(0, 12)}</div>
          </div>
          <div style={{
            width: 20, height: 1,
            background: terminal.color, opacity: 0.5,
            animation: 'scanline 2s linear infinite',
          }} />
        </div>

        {/* Keyboard row */}
        <div style={{
          position: 'absolute', bottom: 1, left: 2, right: 2, height: 3,
          background: '#0d1a0d', borderRadius: 1,
          display: 'flex', gap: 1, padding: '0 1px',
          alignItems: 'center',
        }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2, background: '#1a2a1a', borderRadius: 0.5 }} />
          ))}
        </div>
      </div>

      {/* Interaction hint */}
      {isNearby && (
        <div style={{
          position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,20,0,0.92)',
          border: `1px solid ${terminal.color}`,
          borderRadius: 3,
          padding: '2px 6px',
          color: terminal.color,
          fontSize: 8,
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          boxShadow: `0 0 8px ${terminal.color}44`,
          animation: 'floatBob 1.5s ease-in-out infinite',
          zIndex: 100,
        }}>
          [E] ACCESS
        </div>
      )}
    </div>
  );
}

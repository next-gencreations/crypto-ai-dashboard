interface Props {
  phase: string;
  pipBoyOpen: boolean;
  nearbyTerminal: string | null;
}

export function HUD({ phase, pipBoyOpen, nearbyTerminal }: Props) {
  if (phase !== 'playing' || pipBoyOpen) return null;

  return (
    <>
      {/* Controls hint - bottom left */}
      <div style={{
        position: 'fixed', bottom: 20, left: 20,
        background: 'rgba(0,10,0,0.8)',
        border: '1px solid #1a4a1a',
        borderRadius: 4,
        padding: '8px 12px',
        color: '#00aa33',
        fontFamily: "'Courier New', monospace",
        fontSize: 10,
        lineHeight: 1.8,
        letterSpacing: 1,
        zIndex: 100,
      }}>
        <div style={{ color: '#00ff44', marginBottom: 2, letterSpacing: 2 }}>CONTROLS</div>
        <div>WASD / ARROWS — MOVE</div>
        <div>E — INTERACT WITH TERMINAL</div>
        <div>TAB — OPEN PIP-BOY</div>
      </div>

      {/* Vault 63 badge - top right */}
      <div style={{
        position: 'fixed', top: 16, right: 20,
        background: 'rgba(0,10,0,0.85)',
        border: '1px solid #1a4a1a',
        borderRadius: 4,
        padding: '4px 12px',
        fontFamily: "'Courier New', monospace",
        zIndex: 100,
        textAlign: 'center',
      }}>
        <div style={{ color: '#00ff44', fontSize: 11, fontWeight: 'bold', letterSpacing: 3 }}>VAULT 63</div>
        <div style={{ color: '#00aa33', fontSize: 9, letterSpacing: 2 }}>CRYO LEVEL — LEVEL 1</div>
      </div>

      {/* Proximity hint - center bottom */}
      {nearbyTerminal && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,10,0,0.9)',
          border: '1px solid #00aa33',
          borderRadius: 4,
          padding: '6px 16px',
          color: '#00ff44',
          fontFamily: "'Courier New', monospace",
          fontSize: 11,
          letterSpacing: 2,
          animation: 'floatBob 1.5s ease-in-out infinite',
          zIndex: 100,
        }}>
          TERMINAL IN RANGE — PRESS [E] TO ACCESS
        </div>
      )}
    </>
  );
}

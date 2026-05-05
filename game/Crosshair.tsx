interface Props {
  nearbyTerminal: string | null;
}

export function Crosshair({ nearbyTerminal }: Props) {
  const color = nearbyTerminal ? '#00ff44' : 'rgba(255,255,255,0.6)';
  const size = nearbyTerminal ? 12 : 8;

  return (
    <div style={{
      position: 'fixed',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: 50,
    }}>
      {/* Horizontal line */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: size * 2,
        height: 1.5,
        background: color,
        boxShadow: nearbyTerminal ? `0 0 6px ${color}` : 'none',
        transition: 'all 0.15s',
      }} />
      {/* Vertical line */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 1.5,
        height: size * 2,
        background: color,
        boxShadow: nearbyTerminal ? `0 0 6px ${color}` : 'none',
        transition: 'all 0.15s',
      }} />
      {/* Corner brackets when near terminal */}
      {nearbyTerminal && (
        <>
          {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx, sy], i) => (
            <div key={i} style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: 8, height: 8,
              borderTop: sy < 0 ? `2px solid ${color}` : 'none',
              borderBottom: sy > 0 ? `2px solid ${color}` : 'none',
              borderLeft: sx < 0 ? `2px solid ${color}` : 'none',
              borderRight: sx > 0 ? `2px solid ${color}` : 'none',
              transform: `translate(${sx * 14}px, ${sy * 14}px) translate(-50%, -50%)`,
              boxShadow: `0 0 4px ${color}`,
              transition: 'all 0.15s',
            }} />
          ))}
        </>
      )}
    </div>
  );
}

import { Direction } from './types';

interface Props {
  direction: Direction;
  walking: boolean;
  introStep: number;
}

export function VaultGirl({ direction, walking, introStep }: Props) {
  const frame = walking ? Math.floor(Date.now() / 180) % 2 : 0;
  const legOffset = walking ? (frame === 0 ? 4 : -4) : 0;

  const headPos = {
    up:    { hx: 0, hy: -14 },
    down:  { hx: 0, hy: -14 },
    left:  { hx: 0, hy: -14 },
    right: { hx: 0, hy: -14 },
  }[direction];

  const faceDir = direction === 'left' ? -1 : 1;
  const showFront = direction === 'down' || direction === 'left' || direction === 'right';

  const opacity = introStep < 2 ? 0 : introStep < 3 ? 0.6 : 1;

  return (
    <div style={{ opacity, transition: 'opacity 0.5s', width: 40, height: 60, position: 'relative' }}>
      <svg
        width="40"
        height="60"
        viewBox="-20 -30 40 60"
        style={{ overflow: 'visible', filter: 'drop-shadow(0 0 6px rgba(0,200,255,0.5))' }}
      >
        {/* Shadow */}
        <ellipse cx="0" cy="26" rx="14" ry="4" fill="rgba(0,0,0,0.4)" />

        {/* Legs */}
        <rect
          x={-7 + legOffset}
          y={10}
          width={6}
          height={16}
          rx={2}
          fill="#1a3a7a"
          stroke="#2a5aaa"
          strokeWidth={0.5}
        />
        <rect
          x={1 - legOffset}
          y={10}
          width={6}
          height={16}
          rx={2}
          fill="#1a3a7a"
          stroke="#2a5aaa"
          strokeWidth={0.5}
        />

        {/* Body - Vault Jumpsuit */}
        <rect x={-10} y={-8} width={20} height={20} rx={4} fill="#1e4a8a" stroke="#3a6aaa" strokeWidth={1} />
        {/* Vault 63 number */}
        <text x="0" y="7" textAnchor="middle" fontSize="5" fill="#4a8adb" fontFamily="monospace" fontWeight="bold">
          111
        </text>

        {/* Arms */}
        <rect x={-16} y={-8} width={6} height={14} rx={2} fill="#1e4a8a" stroke="#3a6aaa" strokeWidth={0.5} />
        {/* Pip-Boy arm (right) */}
        <rect x={10} y={-8} width={6} height={14} rx={2} fill="#1e4a8a" stroke="#3a6aaa" strokeWidth={0.5} />
        {/* Pip-Boy device */}
        <rect x={10} y={-2} width={8} height={7} rx={1.5} fill="#1a2a1a" stroke="#00ff44" strokeWidth={1.2} />
        <circle cx="14" cy="1.5" r="2" fill="#003300" stroke="#00ff44" strokeWidth={0.8} />
        <circle cx="14" cy="1.5" r="0.8" fill="#00ff44" opacity="0.9" />
        {/* Pip-Boy glow */}
        <circle cx="14" cy="1.5" r="4" fill="none" stroke="#00ff44" strokeWidth={0.5} opacity="0.4" />

        {/* Neck */}
        <rect x={-3} y={-14} width={6} height={7} rx={2} fill="#f4c89a" />

        {/* Head */}
        <circle cx={headPos.hx} cy={headPos.hy} r={9} fill="#f4c89a" stroke="#d4a87a" strokeWidth={0.8} />

        {/* Hair */}
        <ellipse cx={headPos.hx} cy={headPos.hy - 5} rx={9} ry={5.5} fill="#d4a017" />
        {/* Hair side strands */}
        <ellipse cx={headPos.hx - 7} cy={headPos.hy - 2} rx={3} ry={5} fill="#d4a017" />
        {showFront && (
          <>
            {/* Eyes */}
            <circle cx={headPos.hx - 3 * faceDir} cy={headPos.hy - 1} r={1.2} fill="#2a4a8a" />
            <circle cx={headPos.hx + 3 * faceDir} cy={headPos.hy - 1} r={1.2} fill="#2a4a8a" />
            {/* Mouth */}
            <path
              d={`M ${headPos.hx - 2} ${headPos.hy + 3} Q ${headPos.hx} ${headPos.hy + 5} ${headPos.hx + 2} ${headPos.hy + 3}`}
              stroke="#c08060"
              strokeWidth={0.8}
              fill="none"
            />
          </>
        )}
        {direction === 'up' && (
          <ellipse cx={headPos.hx + 7} cy={headPos.hy - 2} rx={2.5} ry={5} fill="#d4a017" />
        )}
      </svg>
    </div>
  );
}

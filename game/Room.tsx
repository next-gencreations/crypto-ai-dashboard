import * as THREE from 'three';
import { useMemo } from 'react';
import { Text } from '@react-three/drei';

// Vault-Tec colour palette
const WALL_COLOR    = new THREE.Color('#1c2530');  // institutional blue-grey
const FLOOR_COLOR   = new THREE.Color('#161e1a');
const CEILING_COLOR = new THREE.Color('#111820');
const PANEL_COLOR   = new THREE.Color('#202e3a');
const VT_YELLOW     = '#c8a000';
const VT_YELLOW_EM  = '#ffd040';
const VT_BLUE_EM    = '#0088ff';

const LIGHT_POSITIONS: [number, number, number][] = [
  [-7, 5.92, -8], [0, 5.92, -8], [7, 5.92, -8],
  [-7, 5.92, 0],  [0, 5.92, 0],  [7, 5.92, 0],
  [-7, 5.92, 8],  [0, 5.92, 8],  [7, 5.92, 8],
];

const WALL_PANELS: { pos: [number, number, number]; rot: [number, number, number]; w: number; h: number }[] = [
  { pos: [-8, 3, -13.95], rot: [0, 0, 0],           w: 5, h: 5.8 },
  { pos: [8,  3, -13.95], rot: [0, 0, 0],           w: 5, h: 5.8 },
  { pos: [-8, 3, 13.95],  rot: [0, Math.PI, 0],     w: 5, h: 5.8 },
  { pos: [0,  3, 13.95],  rot: [0, Math.PI, 0],     w: 5, h: 5.8 },
  { pos: [8,  3, 13.95],  rot: [0, Math.PI, 0],     w: 5, h: 5.8 },
  { pos: [13.95, 3, -8],  rot: [0, -Math.PI/2, 0],  w: 5, h: 5.8 },
  { pos: [13.95, 3, 0],   rot: [0, -Math.PI/2, 0],  w: 5, h: 5.8 },
  { pos: [13.95, 3, 8],   rot: [0, -Math.PI/2, 0],  w: 5, h: 5.8 },
  { pos: [-13.95, 3, -8], rot: [0, Math.PI/2, 0],   w: 5, h: 5.8 },
  { pos: [-13.95, 3, 0],  rot: [0, Math.PI/2, 0],   w: 5, h: 5.8 },
  { pos: [-13.95, 3, 8],  rot: [0, Math.PI/2, 0],   w: 5, h: 5.8 },
];

const PIPE_SEGS: { pos: [number, number, number]; rot: [number, number, number]; len: number }[] = [
  { pos: [0, 5.6, -13.95], rot: [0, 0, 0],          len: 28 },
  { pos: [0, 5.6, 13.95],  rot: [0, Math.PI, 0],    len: 28 },
  { pos: [-13.95, 5.6, 0], rot: [0, Math.PI/2, 0],  len: 28 },
  { pos: [13.95,  5.6, 0], rot: [0, -Math.PI/2, 0], len: 28 },
  { pos: [0, 5.45, 0],     rot: [0, 0, Math.PI/2],  len: 28 },
  { pos: [0, 5.45, 0],     rot: [Math.PI/2, 0, 0],  len: 28 },
];

const DECO_PODS_W: [number, number, number][] = [
  [-13, 1.8, -10], [-13, 1.8, -5], [-13, 1.8, 0], [-13, 1.8, 5], [-13, 1.8, 10],
];
const DECO_PODS_E: [number, number, number][] = [
  [13, 1.8, -10], [13, 1.8, -5], [13, 1.8, 0], [13, 1.8, 5], [13, 1.8, 10],
];

// Black & yellow alternating hazard chevron strip helper
function HazardStrip({ pos, rot, w }: { pos: [number,number,number]; rot: [number,number,number]; w: number }) {
  const count = Math.floor(w / 1.2);
  return (
    <group position={pos} rotation={rot}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[(i - count / 2 + 0.5) * 1.2, 0, 0]}>
          <boxGeometry args={[0.6, 0.03, 0.7]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#c8a000' : '#111111'}
            emissive={i % 2 === 0 ? '#ffd040' : '#000000'}
            emissiveIntensity={i % 2 === 0 ? 0.4 : 0}
            roughness={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

// Vault-Tec gear-cog logo
function VaultGear({ position, rotation }: { position: [number,number,number]; rotation: [number,number,number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Outer gear ring */}
      <mesh>
        <torusGeometry args={[1.4, 0.12, 8, 32]} />
        <meshStandardMaterial color={VT_YELLOW} emissive={VT_YELLOW_EM} emissiveIntensity={0.5} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Gear teeth (8 teeth) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.55, Math.sin(a) * 1.55, 0]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.32, 0.22, 0.14]} />
            <meshStandardMaterial color={VT_YELLOW} emissive={VT_YELLOW_EM} emissiveIntensity={0.4} metalness={0.7} roughness={0.3} />
          </mesh>
        );
      })}
      {/* Inner circle */}
      <mesh>
        <cylinderGeometry args={[1.1, 1.1, 0.08, 32]} />
        <meshStandardMaterial color="#0d1a28" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Inner ring */}
      <mesh>
        <torusGeometry args={[0.85, 0.07, 8, 32]} />
        <meshStandardMaterial color={VT_YELLOW} emissive={VT_YELLOW_EM} emissiveIntensity={0.3} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* "63" text in the gear */}
      <Text
        position={[0, 0, 0.06]}
        fontSize={0.52}
        color={VT_YELLOW_EM}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.08}
      >
        63
      </Text>
    </group>
  );
}

// Direction arrow sign
function DirSign({
  position, rotation, label, arrow = '→',
}: { position: [number,number,number]; rotation: [number,number,number]; label: string; arrow?: string }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[2.4, 0.42, 0.06]} />
        <meshStandardMaterial color="#0d1a10" emissive="#001a00" emissiveIntensity={0.3} metalness={0.5} />
      </mesh>
      <Text position={[0.1, 0, 0.04]} fontSize={0.18} color="#00ff88" anchorX="center" anchorY="middle" letterSpacing={0.05}>
        {`${arrow}  ${label}`}
      </Text>
    </group>
  );
}

export function Room() {
  const floorMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, roughness: 0.8, metalness: 0.15 }), []);
  const wallMat    = useMemo(() => new THREE.MeshStandardMaterial({ color: WALL_COLOR,  roughness: 0.7, metalness: 0.25 }), []);
  const ceilMat    = useMemo(() => new THREE.MeshStandardMaterial({ color: CEILING_COLOR, roughness: 0.85, metalness: 0.2 }), []);
  const panelMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: PANEL_COLOR,  roughness: 0.55, metalness: 0.55 }), []);
  const lightPanelMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#e8f4ff', emissive: '#aaddff', emissiveIntensity: 1.6, roughness: 0.3,
  }), []);
  const pipeMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a3545', roughness: 0.45, metalness: 0.9 }), []);
  const podMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#162030', roughness: 0.45, metalness: 0.7, transparent: true, opacity: 0.92 }), []);
  const podFailMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#330000', roughness: 0.8, emissive: '#cc0000', emissiveIntensity: 1.0 }), []);
  const podGlassMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#203040', transparent: true, opacity: 0.35, roughness: 0.1 }), []);
  const vtYellowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: VT_YELLOW, emissive: VT_YELLOW_EM, emissiveIntensity: 0.45, metalness: 0.6, roughness: 0.35 }), []);
  const vtBlueMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#003366', emissive: VT_BLUE_EM, emissiveIntensity: 0.5, metalness: 0.5, roughness: 0.4 }), []);
  const floorLineMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#000', emissive: '#00ff44', emissiveIntensity: 0.3, transparent: true, opacity: 0.8 }), []);

  return (
    <group>
      {/* ── FLOOR ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={floorMat}>
        <planeGeometry args={[28, 28]} />
      </mesh>
      <gridHelper args={[28, 14, '#1a3050', '#111820']} position={[0, 0.01, 0]} />

      {/* Centre aisle guide lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} material={floorLineMat}>
        <planeGeometry args={[0.18, 26]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, Math.PI / 2, 0]} position={[0, 0.015, 0]} material={floorLineMat}>
        <planeGeometry args={[0.18, 26]} />
      </mesh>

      {/* Vault-Tec hazard chevrons on perimeter */}
      <HazardStrip pos={[0, 0.02, -12.5]} rot={[-Math.PI/2, 0, 0]}        w={26} />
      <HazardStrip pos={[0, 0.02, 12.5]}  rot={[-Math.PI/2, 0, Math.PI]}  w={26} />
      <HazardStrip pos={[-12.5, 0.02, 0]} rot={[-Math.PI/2, 0, Math.PI/2]} w={26} />
      <HazardStrip pos={[12.5, 0.02, 0]}  rot={[-Math.PI/2, 0, -Math.PI/2]} w={26} />

      {/* ── CEILING ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6, 0]} material={ceilMat}>
        <planeGeometry args={[28, 28]} />
      </mesh>
      {LIGHT_POSITIONS.map((pos, i) => (
        <mesh key={`lp-${i}`} position={pos} material={lightPanelMat}>
          <boxGeometry args={[3.4, 0.06, 1.4]} />
        </mesh>
      ))}

      {/* ── WALLS ── */}
      <mesh position={[0, 3, -14]} material={wallMat}>
        <planeGeometry args={[28, 6]} />
      </mesh>
      <mesh position={[0, 3, 14]} rotation={[0, Math.PI, 0]} material={wallMat}>
        <planeGeometry args={[28, 6]} />
      </mesh>
      <mesh position={[14, 3, 0]} rotation={[0, -Math.PI / 2, 0]} material={wallMat}>
        <planeGeometry args={[28, 6]} />
      </mesh>
      <mesh position={[-14, 3, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMat}>
        <planeGeometry args={[28, 6]} />
      </mesh>

      {WALL_PANELS.map((p, i) => (
        <mesh key={`wp-${i}`} position={p.pos} rotation={p.rot} material={panelMat}>
          <planeGeometry args={[p.w, p.h]} />
        </mesh>
      ))}

      {/* ── VAULT-TEC IDENTITY SIGNAGE ── */}

      {/* North wall above cryo tube: large VAULT 63 sign board */}
      <mesh position={[0, 5.1, -13.85]}>
        <boxGeometry args={[10, 0.85, 0.12]} />
        <meshStandardMaterial color="#0a1520" emissive="#001030" emissiveIntensity={0.4} metalness={0.7} />
      </mesh>
      {/* Yellow border strips on sign */}
      <mesh position={[0, 5.53, -13.84]} material={vtYellowMat}>
        <boxGeometry args={[10.1, 0.07, 0.08]} />
      </mesh>
      <mesh position={[0, 4.68, -13.84]} material={vtYellowMat}>
        <boxGeometry args={[10.1, 0.07, 0.08]} />
      </mesh>
      <Text
        position={[0, 5.1, -13.78]}
        fontSize={0.52}
        color="#00ff88"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.22}
        outlineWidth={0.015}
        outlineColor="#003311"
      >
        VAULT 63  ·  CRYOGENIC LABORATORY  ·  LEVEL 1
      </Text>

      {/* North wall: "VAULT-TEC" above sign */}
      <Text
        position={[0, 5.72, -13.82]}
        fontSize={0.2}
        color={VT_YELLOW_EM}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.3}
      >
        VAULT-TEC CORPORATION  ·  ESTABLISHED 2076
      </Text>

      {/* North wall centre panel: cryo notice below sign */}
      <mesh position={[0, 3.7, -13.88]}>
        <boxGeometry args={[5.2, 0.36, 0.07]} />
        <meshStandardMaterial color="#0a1520" emissive="#001030" emissiveIntensity={0.3} />
      </mesh>
      <Text
        position={[0, 3.7, -13.84]}
        fontSize={0.16}
        color="#00ccff"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.08}
      >
        CRYOGENIC STASIS ACTIVE  ·  AUTHORISED PERSONNEL ONLY
      </Text>

      {/* South wall: large "111" gear emblem */}
      <VaultGear position={[0, 3.0, 13.78]} rotation={[0, Math.PI, 0]} />

      {/* South wall: vault name below gear */}
      <Text
        position={[0, 1.2, 13.78]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.38}
        color={VT_YELLOW_EM}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.2}
      >
        VAULT 63
      </Text>
      <Text
        position={[0, 0.82, 13.78]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.15}
        color="#aaaaaa"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.1}
      >
        SANCTUARY HILLS  ·  MASSACHUSETTS
      </Text>

      {/* East wall: directional signs */}
      <DirSign position={[13.85, 4.6, -4]}  rotation={[0, -Math.PI/2, 0]} label="RESEARCH LAB"    arrow="→" />
      <DirSign position={[13.85, 4.6, 4]}   rotation={[0, -Math.PI/2, 0]} label="MAINFRAME"       arrow="→" />
      <DirSign position={[13.85, 2.8, 0]}   rotation={[0, -Math.PI/2, 0]} label="EMERGENCY EXIT ↑" arrow="⬆" />

      {/* West wall: directional signs */}
      <DirSign position={[-13.85, 4.6, -4]} rotation={[0, Math.PI/2, 0]} label="SECURITY"        arrow="←" />
      <DirSign position={[-13.85, 4.6, 4]}  rotation={[0, Math.PI/2, 0]} label="MEDICAL"         arrow="←" />

      {/* North wall side panels: numbered cryo sectors */}
      {[-8, 8].map((x, i) => (
        <group key={`sector-${i}`}>
          <mesh position={[x, 4.1, -13.88]}>
            <boxGeometry args={[3.8, 1.1, 0.07]} />
            <meshStandardMaterial color="#081018" emissive="#000a18" emissiveIntensity={0.4} metalness={0.6} />
          </mesh>
          <mesh position={[x, 4.65, -13.87]} material={vtYellowMat}>
            <boxGeometry args={[3.82, 0.055, 0.06]} />
          </mesh>
          <mesh position={[x, 3.55, -13.87]} material={vtYellowMat}>
            <boxGeometry args={[3.82, 0.055, 0.06]} />
          </mesh>
          <Text
            position={[x, 4.1, -13.83]}
            fontSize={0.24}
            color="#00aaff"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.1}
          >
            {i === 0 ? 'SECTOR A  ·  PODS 1–6' : 'SECTOR B  ·  PODS 7–12'}
          </Text>
        </group>
      ))}

      {/* Yellow accent rail at eye height on all walls */}
      <mesh position={[0, 1.0, -13.94]} material={vtYellowMat}>
        <boxGeometry args={[28, 0.06, 0.06]} />
      </mesh>
      <mesh position={[0, 1.0, 13.94]} material={vtYellowMat}>
        <boxGeometry args={[28, 0.06, 0.06]} />
      </mesh>
      <mesh position={[-13.94, 1.0, 0]} material={vtYellowMat}>
        <boxGeometry args={[0.06, 0.06, 28]} />
      </mesh>
      <mesh position={[13.94, 1.0, 0]} material={vtYellowMat}>
        <boxGeometry args={[0.06, 0.06, 28]} />
      </mesh>

      {/* Blue accent rail at ceiling junction */}
      {[[-13.94], [13.94]].map(([x], i) => (
        <mesh key={`br-${i}`} position={[x, 5.7, 0]} material={vtBlueMat}>
          <boxGeometry args={[0.05, 0.05, 28]} />
        </mesh>
      ))}
      <mesh position={[0, 5.7, -13.94]} material={vtBlueMat}>
        <boxGeometry args={[28, 0.05, 0.05]} />
      </mesh>
      <mesh position={[0, 5.7, 13.94]} material={vtBlueMat}>
        <boxGeometry args={[28, 0.05, 0.05]} />
      </mesh>

      {/* ── CEILING PIPES ── */}
      {PIPE_SEGS.map((p, i) => (
        <mesh key={`pipe-${i}`} position={p.pos} rotation={p.rot} material={pipeMat}>
          <cylinderGeometry args={[0.08, 0.08, p.len, 6]} />
        </mesh>
      ))}

      {/* ── CRYO PODS (side walls) ── */}
      {DECO_PODS_W.map((pos, i) => (
        <group key={`podW-${i}`} position={pos} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={podMat}>
            <cylinderGeometry args={[0.45, 0.5, 3.5, 12]} />
          </mesh>
          <mesh position={[0, 1.9, 0]} material={podMat}>
            <sphereGeometry args={[0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh position={[0, 0.6, 0.44]}>
            <planeGeometry args={[0.72, 1.8]} />
            <primitive object={podGlassMat} />
          </mesh>
          <mesh position={[0, 1.5, 0.47]} material={podFailMat}>
            <boxGeometry args={[0.08, 0.08, 0.05]} />
          </mesh>
          {/* Pod number plate */}
          <mesh position={[0, -0.9, 0.46]}>
            <boxGeometry args={[0.55, 0.2, 0.04]} />
            <meshStandardMaterial color="#000" emissive="#c8a000" emissiveIntensity={0.6} />
          </mesh>
          <Text position={[0, -0.9, 0.49]} fontSize={0.12} color={VT_YELLOW_EM} anchorX="center" anchorY="middle">
            {`POD-${String(i + 1).padStart(2, '0')}`}
          </Text>
          <mesh position={[0, 0, 0]} material={pipeMat}>
            <torusGeometry args={[0.5, 0.04, 6, 16]} />
          </mesh>
        </group>
      ))}

      {DECO_PODS_E.map((pos, i) => (
        <group key={`podE-${i}`} position={pos} rotation={[0, -Math.PI / 2, 0]}>
          <mesh material={podMat}>
            <cylinderGeometry args={[0.45, 0.5, 3.5, 12]} />
          </mesh>
          <mesh position={[0, 1.9, 0]} material={podMat}>
            <sphereGeometry args={[0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh position={[0, 0.6, 0.44]}>
            <planeGeometry args={[0.72, 1.8]} />
            <primitive object={podGlassMat} />
          </mesh>
          <mesh position={[0, 1.5, 0.47]} material={podFailMat}>
            <boxGeometry args={[0.08, 0.08, 0.05]} />
          </mesh>
          <mesh position={[0, -0.9, 0.46]}>
            <boxGeometry args={[0.55, 0.2, 0.04]} />
            <meshStandardMaterial color="#000" emissive="#c8a000" emissiveIntensity={0.6} />
          </mesh>
          <Text position={[0, -0.9, 0.49]} fontSize={0.12} color={VT_YELLOW_EM} anchorX="center" anchorY="middle">
            {`POD-${String(i + 6).padStart(2, '0')}`}
          </Text>
          <mesh position={[0, 0, 0]} material={pipeMat}>
            <torusGeometry args={[0.5, 0.04, 6, 16]} />
          </mesh>
        </group>
      ))}

      {/* ── WALL BASE TRIM ── */}
      <mesh position={[0, 0.15, -13.95]} material={pipeMat}>
        <boxGeometry args={[28, 0.3, 0.18]} />
      </mesh>
      <mesh position={[0, 0.15, 13.95]} material={pipeMat}>
        <boxGeometry args={[28, 0.3, 0.18]} />
      </mesh>
      <mesh position={[-13.95, 0.15, 0]} material={pipeMat}>
        <boxGeometry args={[0.18, 0.3, 28]} />
      </mesh>
      <mesh position={[13.95, 0.15, 0]} material={pipeMat}>
        <boxGeometry args={[0.18, 0.3, 28]} />
      </mesh>

      {/* Yellow base trim accent line */}
      <mesh position={[0, 0.31, -13.93]} material={vtYellowMat}>
        <boxGeometry args={[28, 0.04, 0.05]} />
      </mesh>
      <mesh position={[0, 0.31, 13.93]} material={vtYellowMat}>
        <boxGeometry args={[28, 0.04, 0.05]} />
      </mesh>
      <mesh position={[-13.93, 0.31, 0]} material={vtYellowMat}>
        <boxGeometry args={[0.05, 0.04, 28]} />
      </mesh>
      <mesh position={[13.93, 0.31, 0]} material={vtYellowMat}>
        <boxGeometry args={[0.05, 0.04, 28]} />
      </mesh>
    </group>
  );
}

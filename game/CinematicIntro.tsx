import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState, useMemo, MutableRefObject } from 'react';
import * as THREE from 'three';

// ─── helpers ─────────────────────────────────────────────────────────────────
function v3(x: number, y: number, z: number) { return new THREE.Vector3(x, y, z); }
function eio(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

// ─── Camera keyframes ─────────────────────────────────────────────────────────
// Phase A: Exterior   0 – 7 s   camera at z+, approaches vault door at z=0
// Phase B: Shaft      7 – 13 s  camera descends inside vertical shaft at x=0 z=-2
// Phase C: Cryo      13 – 23 s  camera enters cryo room and closes on pod
const KFS: { t: number; pos: THREE.Vector3; look: THREE.Vector3 }[] = [
  { t:  0,  pos: v3(0, 12, 80),    look: v3(0, 5,  0) },
  { t:  3,  pos: v3(0,  7, 42),    look: v3(0, 4,  0) },
  { t:  5,  pos: v3(0,  4, 18),    look: v3(0, 3,  0) },
  { t:  6,  pos: v3(0,  3,  6),    look: v3(0, 2.5, 0) },
  // ── cut (fade black t=6.5–7.5) ──
  { t:  7,  pos: v3(0,  3, -2),    look: v3(0, 2,  -2.5) },
  { t:  8,  pos: v3(0,  1, -2),    look: v3(0, -8,  -2) },
  { t: 12,  pos: v3(0,-40, -2),    look: v3(0,-50,  -2) },
  // ── cut (fade black t=12.5–13.5) ──
  { t: 13,  pos: v3(0,  3, 14),    look: v3(0, 2,   0) },
  { t: 16,  pos: v3(1.5, 2, -1),   look: v3(0, 1.8,-13) },
  { t: 19,  pos: v3(0.4, 1.7, -8), look: v3(0, 2,  -14) },
  { t: 23,  pos: v3(0.4, 1.7, -8), look: v3(0, 2,  -14) },
];
const TOTAL = 23;

function getCam(elapsed: number) {
  const kf = KFS;
  if (elapsed <= kf[0].t) return { pos: kf[0].pos.clone(), look: kf[0].look.clone() };
  for (let i = 1; i < kf.length; i++) {
    if (elapsed <= kf[i].t) {
      const e = eio((elapsed - kf[i - 1].t) / (kf[i].t - kf[i - 1].t));
      return {
        pos:  new THREE.Vector3().lerpVectors(kf[i - 1].pos,  kf[i].pos,  e),
        look: new THREE.Vector3().lerpVectors(kf[i - 1].look, kf[i].look, e),
      };
    }
  }
  const last = kf[kf.length - 1];
  return { pos: last.pos.clone(), look: last.look.clone() };
}

// ─── Fade opacity curve ───────────────────────────────────────────────────────
function fadeAt(t: number): number {
  if (t < 0.6)              return 1 - t / 0.6;          // open fade-in
  if (t >= 6.5 && t < 7)   return (t - 6.5) / 0.5;      // cut 1 → black
  if (t >= 7   && t < 7.5) return 1 - (t - 7) / 0.5;    // cut 1 → reveal
  if (t >= 12.5 && t < 13) return (t - 12.5) / 0.5;     // cut 2 → black
  if (t >= 13  && t < 13.5)return 1 - (t - 13) / 0.5;   // cut 2 → reveal
  if (t >= 21)              return Math.min((t - 21) / 2, 1); // final fade
  return 0;
}

// ─── Subtitles ────────────────────────────────────────────────────────────────
const SUBS = [
  { start:  0,  end:  4,  main: 'VAULT-TEC CORPORATION',         sub: 'CLASSIFIED TRANSMISSION — EYES ONLY' },
  { start:  4,  end:  7,  main: 'VAULT 63',                       sub: 'ACCESSING FACILITY...' },
  { start:  7,  end: 10,  main: 'DESCENDING TO CRYO LEVEL',       sub: '210 FLOORS BELOW SURFACE' },
  { start: 10,  end: 13,  main: 'CRYO LABORATORY — LEVEL 1',      sub: 'ARRIVAL IMMINENT' },
  { start: 13,  end: 16,  main: 'SUBJECT LOCATED',                sub: 'CRYOGENIC STASIS — 210 YEARS' },
  { start: 16,  end: 20,  main: 'EMERGENCY THAW SEQUENCE',        sub: 'OVERRIDE CODE ACCEPTED' },
  { start: 20,  end: 22,  main: '...',                             sub: 'WAKE UP' },
];

// ─── Drone searchlight (follows camera, only active during exterior) ─────────
function DroneSearchLight({ elapsedRef }: { elapsedRef: MutableRefObject<number> }) {
  const { camera } = useThree();
  const lightsRef  = useRef<THREE.Group>(null!);
  const circleRef  = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    const active = elapsedRef.current < 7;
    if (lightsRef.current) {
      lightsRef.current.visible = active;
      if (active) lightsRef.current.position.copy(camera.position);
    }
    if (circleRef.current) {
      circleRef.current.visible = active;
      if (active) {
        // Project the beam onto the ground plane (y = -2.9)
        circleRef.current.position.set(camera.position.x, -2.92, camera.position.z - 8);
      }
    }
  });

  return (
    <>
      {/* Lights travel with the camera */}
      <group ref={lightsRef}>
        <pointLight color="#e8f4ff" intensity={28} distance={90} decay={2} />
        <pointLight position={[0, -4, -12]} color="#ccdff5" intensity={14} distance={55} decay={2} />
      </group>

      {/* Ground-plane impact circle — no cones, so nothing clips */}
      <mesh ref={circleRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6, 32]} />
        <meshBasicMaterial color="#ddeeff" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </>
  );
}

// ─── Frozen human silhouette (shared between cinematic + game) ────────────────
function FrozenHuman({ scale = 1 }: { scale?: number }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#8ec8e8',
    emissive: '#1a5080',
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.82,
    roughness: 0.25,
    metalness: 0.05,
  }), []);

  return (
    <group scale={[scale, scale, scale]}>
      {/* Head */}
      <mesh position={[0, 4.62, 0]} material={mat}>
        <sphereGeometry args={[0.21, 12, 10]} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 4.3, 0]} material={mat}>
        <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 3.35, 0]} material={mat}>
        <capsuleGeometry args={[0.24, 1.3, 6, 12]} />
      </mesh>
      {/* Left upper arm */}
      <mesh position={[-0.38, 3.6, 0]} rotation={[0, 0, 0.28]} material={mat}>
        <capsuleGeometry args={[0.09, 0.7, 4, 8]} />
      </mesh>
      {/* Left forearm */}
      <mesh position={[-0.52, 2.9, 0]} rotation={[0, 0, 0.15]} material={mat}>
        <capsuleGeometry args={[0.075, 0.6, 4, 8]} />
      </mesh>
      {/* Right upper arm */}
      <mesh position={[0.38, 3.6, 0]} rotation={[0, 0, -0.28]} material={mat}>
        <capsuleGeometry args={[0.09, 0.7, 4, 8]} />
      </mesh>
      {/* Right forearm */}
      <mesh position={[0.52, 2.9, 0]} rotation={[0, 0, -0.15]} material={mat}>
        <capsuleGeometry args={[0.075, 0.6, 4, 8]} />
      </mesh>
      {/* Left thigh */}
      <mesh position={[-0.15, 2.1, 0]} rotation={[0, 0, 0.05]} material={mat}>
        <capsuleGeometry args={[0.12, 0.75, 4, 8]} />
      </mesh>
      {/* Left shin */}
      <mesh position={[-0.16, 1.2, 0]} rotation={[0, 0, 0.02]} material={mat}>
        <capsuleGeometry args={[0.1, 0.7, 4, 8]} />
      </mesh>
      {/* Right thigh */}
      <mesh position={[0.15, 2.1, 0]} rotation={[0, 0, -0.05]} material={mat}>
        <capsuleGeometry args={[0.12, 0.75, 4, 8]} />
      </mesh>
      {/* Right shin */}
      <mesh position={[0.16, 1.2, 0]} rotation={[0, 0, -0.02]} material={mat}>
        <capsuleGeometry args={[0.1, 0.7, 4, 8]} />
      </mesh>
      {/* Feet */}
      <mesh position={[-0.16, 0.38, 0.06]} rotation={[0.3, 0, 0]} material={mat}>
        <capsuleGeometry args={[0.08, 0.18, 4, 6]} />
      </mesh>
      <mesh position={[0.16, 0.38, 0.06]} rotation={[0.3, 0, 0]} material={mat}>
        <capsuleGeometry args={[0.08, 0.18, 4, 6]} />
      </mesh>
    </group>
  );
}

// ─── CinematicController (inside Canvas) ──────────────────────────────────────
function CinematicController({ elapsedRef, onDone }: {
  elapsedRef: MutableRefObject<number>;
  onDone: () => void;
}) {
  const { camera } = useThree();
  const doneRef = useRef(false);
  useFrame((_, delta) => {
    elapsedRef.current = Math.min(elapsedRef.current + delta, TOTAL + 0.5);
    const { pos, look } = getCam(elapsedRef.current);
    camera.position.copy(pos);
    camera.lookAt(look);
    if (elapsedRef.current >= TOTAL && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });
  return null;
}

// ─── EXTERIOR SCENE ───────────────────────────────────────────────────────────
function VaultDoor({ elapsedRef }: { elapsedRef: MutableRefObject<number> }) {
  const gearRef  = useRef<THREE.Group>(null!);
  const irisRef  = useRef<THREE.Group>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);

  useFrame(() => {
    const t = elapsedRef.current;
    if (t >= 4 && t <= 7 && gearRef.current) {
      gearRef.current.rotation.z = eio((t - 4) / 3) * Math.PI * 0.6;
    }
    if (t >= 4.5 && irisRef.current) {
      const prog = Math.min((t - 4.5) / 2, 1);
      const dist = eio(prog) * 3.2;
      irisRef.current.children.forEach((blade, i) => {
        const ang = (i / 8) * Math.PI * 2;
        (blade as THREE.Mesh).position.set(Math.cos(ang) * dist, Math.sin(ang) * dist, 0);
      });
    }
    // Glow pulses
    if (lightRef.current) {
      lightRef.current.intensity = 3 + Math.sin(Date.now() * 0.002) * 0.6;
    }
  });

  const teeth = useMemo(() => Array.from({ length: 18 }, (_, i) => {
    const ang = (i / 18) * Math.PI * 2;
    return (
      <mesh key={i} position={[Math.cos(ang) * 5, Math.sin(ang) * 5, 0]} rotation={[0, 0, ang]}>
        <boxGeometry args={[0.55, 0.9, 0.35]} />
        <meshStandardMaterial color="#c8a000" emissive="#c8a000" emissiveIntensity={0.3} metalness={0.9} roughness={0.2} />
      </mesh>
    );
  }), []);

  const blades = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const ang = (i / 8) * Math.PI * 2;
    return (
      <mesh key={i} rotation={[0, 0, ang + Math.PI / 8]}>
        <boxGeometry args={[2.0, 4.2, 0.18]} />
        <meshStandardMaterial color="#0d1a28" metalness={0.85} roughness={0.3} />
      </mesh>
    );
  }), []);

  return (
    <group position={[0, 4, 0]}>
      {/* Concrete surround — front face at z=0.2, clear of cliff face at z=-3 */}
      <mesh position={[0, 0, -0.5]}>
        <boxGeometry args={[18, 18, 1.0]} />
        <meshStandardMaterial color="#181412" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Concrete bevelled frame */}
      {[[-7, 0], [7, 0]].map(([x], i) => (
        <mesh key={i} position={[x, 0, -0.1]}>
          <boxGeometry args={[1.8, 14, 0.4]} />
          <meshStandardMaterial color="#1e1a16" roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, 7, -0.1]}>
        <boxGeometry args={[14, 1.8, 0.4]} />
        <meshStandardMaterial color="#1e1a16" roughness={0.85} />
      </mesh>
      <mesh position={[0, -7, -0.1]}>
        <boxGeometry args={[14, 1.8, 0.4]} />
        <meshStandardMaterial color="#1e1a16" roughness={0.85} />
      </mesh>

      {/* Outer steel ring */}
      <mesh>
        <torusGeometry args={[6.2, 0.35, 8, 64]} />
        <meshStandardMaterial color="#334455" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Gear ring (rotates on open) */}
      <group ref={gearRef}>
        <mesh>
          <torusGeometry args={[5.0, 0.28, 8, 64]} />
          <meshStandardMaterial color="#c8a000" emissive="#c8a000" emissiveIntensity={0.25} metalness={0.9} roughness={0.15} />
        </mesh>
        {teeth}
      </group>

      {/* Iris blades (slide outward on open) */}
      <group ref={irisRef}>{blades}</group>

      {/* Centre emblem */}
      <mesh position={[0, 0, 0.22]}>
        <cylinderGeometry args={[1.3, 1.3, 0.12, 32]} />
        <meshStandardMaterial color="#08121e" metalness={0.8} emissive="#001830" emissiveIntensity={0.6} />
      </mesh>
      <Text position={[0, 0.15, 0.35]} fontSize={0.9} color="#ffd040" anchorX="center" anchorY="middle" letterSpacing={0.05}>
        63
      </Text>
      <Text position={[0, -0.55, 0.34]} fontSize={0.18} color="#c8a000" anchorX="center" anchorY="middle" letterSpacing={0.12}>
        VAULT-TEC
      </Text>

      {/* Glow from inside door + front-facing fill so door face is lit */}
      <pointLight ref={lightRef} position={[0, 0, 1.5]} color="#ffd080" intensity={8} distance={30} />
      <pointLight position={[0, 0, -2]} color="#aaccff" intensity={3} distance={16} />
      <pointLight position={[0, 0, 15]} color="#ffeecc" intensity={6} distance={40} />
    </group>
  );
}

// ─── Scene fog (imperative — avoids JSX attach/detach bugs) ──────────────────
function SceneFog({ near, far, color }: { near: number; far: number; color: string }) {
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new THREE.Fog(color, near, far);
    return () => { scene.fog = null; };
  }, [scene, near, far, color]);
  return null;
}

// ─── Manual star field (points geometry — no shader compilation needed) ───────
function StarField() {
  const COUNT = 3000;
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 140 + Math.random() * 60;
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta)); // upper hemisphere only
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.55} color="#e8eeff" sizeAttenuation transparent opacity={0.85} />
    </points>
  );
}

function ExteriorScene({ elapsedRef }: { elapsedRef: MutableRefObject<number> }) {
  return (
    <>
      {/* Atmospheric depth fog set imperatively — avoids JSX attach timing issues */}
      <SceneFog near={55} far={140} color="#1a1520" />

      {/* Hemisphere: warm wasteland sky above, dusty ground below — toned down so
          ACESFilmic at exposure 1.0 doesn't blow the ground out to white */}
      <hemisphereLight args={['#7a6a55', '#4a3a28', 0.9]} />
      <ambientLight intensity={0.4} color="#887766" />
      {/* Overhead moon fill */}
      <pointLight position={[0, 50, 20]} color="#bbccdd" intensity={10} distance={250} />
      {/* Front spotlight on vault door — key light */}
      <pointLight position={[0, 6, 28]} color="#ffeedd" intensity={10} distance={60} />
      <pointLight position={[0, 6, 50]} color="#ccbbaa" intensity={7} distance={80} />

      {/* Night sky — manual point cloud, no shader deps */}
      <StarField />

      {/* Ground — slightly lower than rocky path so no z-fight */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 40]}>
        <planeGeometry args={[300, 200]} />
        <meshStandardMaterial color="#5a4a35" roughness={1} />
      </mesh>

      {/* Rocky approach path — sits on top of ground (y=-2.98 vs ground y=-3) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.98, 20]}>
        <planeGeometry args={[8, 60]} />
        <meshStandardMaterial color="#6e5c42" roughness={1} />
      </mesh>

      {/* Main cliff face — pushed back so front face is at z=-3, no z-fight with vault door */}
      <mesh position={[0, 14, -8]}>
        <boxGeometry args={[70, 50, 10]} />
        <meshStandardMaterial color="#4a3e32" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Cliff top overhang */}
      <mesh position={[0, 38, 0]}>
        <boxGeometry args={[70, 24, 20]} />
        <meshStandardMaterial color="#3e3428" roughness={1} />
      </mesh>
      {/* Loose rock formations — sitting on ground (y=-3 + half-height) */}
      {[[-18, 10], [22, 15], [-12, 30], [16, 25]].map(([x, z], i) => {
        const h = 3 + i * 0.5;
        return (
          <mesh key={i} position={[x, -3 + h / 2, z]} rotation={[0, i * 0.8, 0]}>
            <boxGeometry args={[4 + i, h, 3 + i * 0.3]} />
            <meshStandardMaterial color="#524438" roughness={1} />
          </mesh>
        );
      })}

      {/* Vault-Tec signage above the door */}
      <mesh position={[0, 14, 0.1]}>
        <boxGeometry args={[9, 0.7, 0.15]} />
        <meshStandardMaterial color="#0a1520" emissive="#001030" emissiveIntensity={0.5} metalness={0.7} />
      </mesh>
      <Text position={[0, 14, 0.28]} fontSize={0.38} color="#ffd040" anchorX="center" anchorY="middle" letterSpacing={0.2}>
        VAULT-TEC CORPORATION
      </Text>
      <Text position={[0, 13.4, 0.27]} fontSize={0.2} color="#88aacc" anchorX="center" anchorY="middle" letterSpacing={0.1}>
        AUTHORIZED PERSONNEL ONLY
      </Text>

      {/* Yellow hazard stripe along base of cliff */}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[-26 + i * 4, -2.4, 0.15]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.4, 3, 0.1]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#c8a000' : '#1a1a1a'} emissive={i % 2 === 0 ? '#c8a000' : '#000'} emissiveIntensity={0.15} />
        </mesh>
      ))}

      <VaultDoor elapsedRef={elapsedRef} />
      <DroneSearchLight elapsedRef={elapsedRef} />
    </>
  );
}

// ─── ELEVATOR SHAFT SCENE ─────────────────────────────────────────────────────
function ShaftScene() {
  const SHAFT_Y = -20;
  const SHAFT_H = 55;
  const lights = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const y = 2 - i * 5;
    return (
      <group key={i} position={[0, y, -2]}>
        <mesh position={[0, 0.55, -0.94]}>
          <boxGeometry args={[2, 0.08, 0.06]} />
          <meshStandardMaterial color="#eeddbb" emissive="#eeddbb" emissiveIntensity={3} />
        </mesh>
        <pointLight position={[0, 0.4, -0.85]} color="#c8d8ff" intensity={5.5} distance={10} decay={2} />
        {/* Depth marker */}
        <mesh position={[1.35, 0, -1.04]}>
          <boxGeometry args={[0.3, 0.3, 0.02]} />
          <meshStandardMaterial color="#c8a000" emissive="#c8a000" emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[-1.35, 0, -1.04]}>
          <boxGeometry args={[0.3, 0.3, 0.02]} />
          <meshStandardMaterial color="#c8a000" emissive="#c8a000" emissiveIntensity={0.7} />
        </mesh>
      </group>
    );
  }), []);

  return (
    <>
      <ambientLight intensity={1.8} color="#5577cc" />
      <hemisphereLight args={['#334466', '#223355', 2.0]} />
      {/* Central fill lights along the full shaft length */}
      <pointLight position={[0,  0,  -2]} color="#aabbff" intensity={10} distance={18} decay={2} />
      <pointLight position={[0, -12, -2]} color="#aabbff" intensity={10} distance={18} decay={2} />
      <pointLight position={[0, -25, -2]} color="#aabbff" intensity={10} distance={18} decay={2} />
      <pointLight position={[0, -38, -2]} color="#aabbff" intensity={10} distance={18} decay={2} />

      {/* Left wall */}
      <mesh position={[-1.5, SHAFT_Y, -2]}>
        <boxGeometry args={[0.14, SHAFT_H, 2.5]} />
        <meshStandardMaterial color="#3a4a60" metalness={0.5} roughness={0.55} />
      </mesh>
      {/* Right wall */}
      <mesh position={[1.5, SHAFT_Y, -2]}>
        <boxGeometry args={[0.14, SHAFT_H, 2.5]} />
        <meshStandardMaterial color="#3a4a60" metalness={0.5} roughness={0.55} />
      </mesh>
      {/* Near wall */}
      <mesh position={[0, SHAFT_Y, -0.8]}>
        <boxGeometry args={[3, SHAFT_H, 0.14]} />
        <meshStandardMaterial color="#2e3e55" metalness={0.4} roughness={0.65} />
      </mesh>
      {/* Far wall */}
      <mesh position={[0, SHAFT_Y, -3.2]}>
        <boxGeometry args={[3, SHAFT_H, 0.14]} />
        <meshStandardMaterial color="#2e3e55" metalness={0.4} roughness={0.65} />
      </mesh>

      {/* Cables */}
      {[-0.6, 0, 0.6].map((x, i) => (
        <mesh key={i} position={[x, SHAFT_Y, -2]}>
          <boxGeometry args={[0.04, SHAFT_H, 0.04]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}

      {/* Warning stripe bands every 15 units */}
      {[0, -15, -30].map((y, i) => (
        <mesh key={i} position={[-1.46, y, -2]}>
          <boxGeometry args={[0.02, 0.4, 2.4]} />
          <meshStandardMaterial color="#c8a000" emissive="#c8a000" emissiveIntensity={0.5} />
        </mesh>
      ))}
      {[0, -15, -30].map((y, i) => (
        <mesh key={i} position={[1.46, y, -2]}>
          <boxGeometry args={[0.02, 0.4, 2.4]} />
          <meshStandardMaterial color="#c8a000" emissive="#c8a000" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {lights}

      {/* Bottom of shaft — vault emblem */}
      <mesh position={[0, -52, -2]}>
        <boxGeometry args={[3, 0.2, 2.5]} />
        <meshStandardMaterial color="#0a1520" />
      </mesh>
      <mesh position={[0, -51.9, -2]}>
        <torusGeometry args={[0.7, 0.08, 8, 32]} />
        <meshStandardMaterial color="#c8a000" emissive="#c8a000" emissiveIntensity={0.5} />
      </mesh>
    </>
  );
}

// ─── CRYO ROOM SCENE ──────────────────────────────────────────────────────────
function CryoPod({ elapsedRef }: { elapsedRef: MutableRefObject<number> }) {
  const texture = useTexture('/vault-girl.png');
  useMemo(() => { texture.flipY = true; texture.needsUpdate = true; }, [texture]);

  const leftDoorRef  = useRef<THREE.Mesh>(null!);
  const rightDoorRef = useRef<THREE.Mesh>(null!);
  const glowRef      = useRef<THREE.PointLight>(null!);
  const mist1Ref     = useRef<THREE.Mesh>(null!);
  const mist2Ref     = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    const t = elapsedRef.current;
    const time = Date.now() * 0.001;

    // Door opens t=16..19
    if (leftDoorRef.current && rightDoorRef.current) {
      const target = t >= 16 ? eio(Math.min((t - 16) / 2.5, 1)) * 0.92 : 0;
      leftDoorRef.current.position.x  = THREE.MathUtils.lerp(leftDoorRef.current.position.x,  -target, delta * 2.5);
      rightDoorRef.current.position.x = THREE.MathUtils.lerp(rightDoorRef.current.position.x,  target, delta * 2.5);
    }

    // Glow pulse
    if (glowRef.current) {
      const base = t >= 16 ? 4.5 : 2.5;
      glowRef.current.intensity = base + Math.sin(time * 1.4) * 0.5;
    }

    // Cryo mist drifts out after door opens
    if (mist1Ref.current && mist2Ref.current) {
      const mistAmt = t >= 16 ? Math.min((t - 16) / 3, 1) : 0;
      mist1Ref.current.position.z = 0.9 + Math.sin(time * 0.7) * 0.15;
      mist1Ref.current.position.y = 1.0 + mistAmt * 1.2;
      (mist1Ref.current.material as THREE.MeshStandardMaterial).opacity = mistAmt * 0.35;
      mist2Ref.current.position.z = 1.1 + Math.cos(time * 0.5) * 0.2;
      mist2Ref.current.position.y = 2.4 + mistAmt * 0.8;
      (mist2Ref.current.material as THREE.MeshStandardMaterial).opacity = mistAmt * 0.25;
    }
  });

  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#9dd8f8', transparent: true, opacity: 0.22, roughness: 0.04,
    metalness: 0.05, transmission: 0.7, thickness: 0.3, side: THREE.DoubleSide,
  }), []);

  return (
    <group position={[0, 0, -12]}>
      <pointLight ref={glowRef} position={[0, 2.8, 1]} color="#44bbff" intensity={6} distance={16} decay={2} />
      <pointLight position={[0, 0.1, 0.5]} color="#2299ff" intensity={3} distance={8} decay={2} />
      <pointLight position={[0, 4, 2]} color="#88ddff" intensity={4} distance={12} decay={2} />

      {/* Platform */}
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[1.15, 1.25, 0.12, 24]} />
        <meshStandardMaterial color="#0d2035" metalness={0.9} roughness={0.3} emissive="#001133" emissiveIntensity={0.4} />
      </mesh>
      {/* Glow ring */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.1, 32]} />
        <meshStandardMaterial color="#000" emissive="#0088ff" emissiveIntensity={0.9} transparent opacity={0.9} />
      </mesh>

      {/* Glass cylinder */}
      <mesh position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.78, 0.78, 5.2, 24, 1, true]} />
        <primitive object={glassMat} />
      </mesh>

      {/* Frozen human inside the tube */}
      <group position={[0, 0, -0.18]}>
        <FrozenHuman />
      </group>

      {/* Inner glow */}
      <mesh position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 5.0, 18, 1, true]} />
        <meshStandardMaterial color="#001830" emissive="#1166dd" emissiveIntensity={0.45} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>

      {/* Vault girl */}
      <mesh position={[0, 2.65, -0.52]}>
        <planeGeometry args={[1.22, 3.9]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>

      {/* Dome top */}
      <mesh position={[0, 5.4, 0]}>
        <sphereGeometry args={[0.78, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <primitive object={glassMat} />
      </mesh>

      {/* Frame rings */}
      {[5.45, 2.8, 0.27].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.82, 0.065, 8, 28]} />
          <meshStandardMaterial color="#1a3550" metalness={0.9} roughness={0.35} emissive="#002244" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Vertical rails */}
      {[-0.80, 0.80].map((x, i) => (
        <mesh key={i} position={[x, 2.8, 0]}>
          <boxGeometry args={[0.06, 5.2, 0.14]} />
          <meshStandardMaterial color="#1a3550" metalness={0.9} roughness={0.35} />
        </mesh>
      ))}

      {/* Door panels */}
      <mesh ref={leftDoorRef} position={[0, 2.8, 0.02]}>
        <boxGeometry args={[0.78, 5.18, 0.07]} />
        <meshStandardMaterial color="#0d2035" metalness={0.8} roughness={0.5} emissive="#001133" emissiveIntensity={0.2} />
      </mesh>
      <mesh ref={rightDoorRef} position={[0, 2.8, 0.02]}>
        <boxGeometry args={[0.78, 5.18, 0.07]} />
        <meshStandardMaterial color="#0d2035" metalness={0.8} roughness={0.5} emissive="#001133" emissiveIntensity={0.2} />
      </mesh>

      {/* Status LEDs */}
      {[3.5, 3.3, 3.1].map((y, i) => (
        <mesh key={i} position={[0.96, y, 0.07]}>
          <boxGeometry args={[0.05, 0.06, 0.05]} />
          <meshStandardMaterial color="#000" emissive={i === 0 ? '#00ff44' : i === 1 ? '#ffaa00' : '#0044ff'} emissiveIntensity={1} />
        </mesh>
      ))}

      {/* Cryo mist particles */}
      <mesh ref={mist1Ref} position={[0, 1, 0.9]}>
        <sphereGeometry args={[0.55, 10, 8]} />
        <meshStandardMaterial color="#aaddff" transparent opacity={0} roughness={1} />
      </mesh>
      <mesh ref={mist2Ref} position={[0, 2.4, 1.1]}>
        <sphereGeometry args={[0.7, 10, 8]} />
        <meshStandardMaterial color="#cceeff" transparent opacity={0} roughness={1} />
      </mesh>
    </group>
  );
}

function CryoScene({ elapsedRef }: { elapsedRef: MutableRefObject<number> }) {
  return (
    <>
      <ambientLight intensity={2.2} color="#aabbdd" />
      <hemisphereLight args={['#aaccff', '#224466', 2.5]} />
      <pointLight position={[0, 5, 0]}   color="#d8f0ff" intensity={15}  distance={30} decay={2} />
      <pointLight position={[0, 5, -13]} color="#aaccff" intensity={12}  distance={20} decay={2} />
      <pointLight position={[0, 5, 13]}  color="#d8f0ff" intensity={10}  distance={20} decay={2} />
      <pointLight position={[-10, 3, 0]} color="#99bbdd" intensity={8}   distance={20} decay={2} />
      <pointLight position={[10,  3, 0]} color="#99bbdd" intensity={8}   distance={20} decay={2} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1e3048" metalness={0.35} roughness={0.55} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#18243a" />
      </mesh>
      {/* North wall */}
      <mesh position={[0, 3, -14]}>
        <boxGeometry args={[30, 6, 0.3]} />
        <meshStandardMaterial color="#243650" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* South wall */}
      <mesh position={[0, 3, 14]}>
        <boxGeometry args={[30, 6, 0.3]} />
        <meshStandardMaterial color="#1e2e46" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* East/West walls */}
      <mesh position={[-14, 3, 0]}>
        <boxGeometry args={[0.3, 6, 30]} />
        <meshStandardMaterial color="#1e2e46" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[14, 3, 0]}>
        <boxGeometry args={[0.3, 6, 30]} />
        <meshStandardMaterial color="#1e2e46" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Background pods (flanking) */}
      {[-5, 5, -10, 10].map((x, i) => (
        <group key={i} position={[x, 0, -12]}>
          <mesh position={[0, 2.8, 0]}>
            <cylinderGeometry args={[0.65, 0.65, 5.2, 18, 1, true]} />
            <meshStandardMaterial color="#091525" transparent opacity={0.6} roughness={0.3} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.9, 1.0, 0.12, 20]} />
            <meshStandardMaterial color="#0d2035" metalness={0.9} roughness={0.3} />
          </mesh>
          <pointLight position={[0, 2, 0.8]} color="#004488" intensity={0.7} distance={3} decay={2} />
        </group>
      ))}

      {/* Vault 63 wall sign */}
      <mesh position={[0, 5.1, -13.7]}>
        <boxGeometry args={[9, 0.8, 0.1]} />
        <meshStandardMaterial color="#0a1520" emissive="#001030" emissiveIntensity={0.4} />
      </mesh>
      <Text position={[0, 5.1, -13.62]} fontSize={0.38} color="#ffd040" anchorX="center" anchorY="middle" letterSpacing={0.18}>
        VAULT 63  ·  CRYOGENIC LABORATORY  ·  LEVEL 1
      </Text>

      {/* Ceiling strip lights */}
      {[-8, 0, 8].map((z, i) => (
        <group key={i}>
          <mesh position={[0, 5.85, z]}>
            <boxGeometry args={[8, 0.06, 0.18]} />
            <meshStandardMaterial color="#d8f0ff" emissive="#d8f0ff" emissiveIntensity={2.5} />
          </mesh>
          <pointLight position={[0, 5.4, z]} color="#c8e8ff" intensity={6} distance={14} decay={2} />
        </group>
      ))}

      <CryoPod elapsedRef={elapsedRef} />
    </>
  );
}

// ─── SceneSelector (inside Canvas — switches phase based on elapsed) ────────────
// ─── Dynamic exposure per phase ───────────────────────────────────────────────
// Exterior is naturally bright — keep exposure at 1.0 to stop blowout.
// Cryo room is very dark — ramp up to 2.2 so the lit pod reads clearly.
function ExposureController({ elapsedRef }: { elapsedRef: MutableRefObject<number> }) {
  const { gl } = useThree();
  useFrame(() => {
    const t = elapsedRef.current;
    let target: number;
    if      (t < 7)  target = 1.0;   // exterior — natural daylight tones
    else if (t < 13) target = 1.5;   // shaft    — slightly boosted
    else             target = 2.2;   // cryo     — dark room, needs boost
    // Smooth lerp so exposure doesn't jump at cut points
    gl.toneMappingExposure += (target - gl.toneMappingExposure) * 0.08;
  });
  return null;
}

function SceneSelector({ elapsedRef }: { elapsedRef: MutableRefObject<number> }) {
  const [phase, setPhase] = useState<'ext' | 'shaft' | 'cryo'>('ext');
  useFrame(() => {
    const t = elapsedRef.current;
    const next = t < 7 ? 'ext' : t < 13 ? 'shaft' : 'cryo';
    if (next !== phase) setPhase(next);
  });
  return (
    <>
      {phase === 'ext'   && <ExteriorScene elapsedRef={elapsedRef} />}
      {phase === 'shaft' && <ShaftScene />}
      {phase === 'cryo'  && <CryoScene elapsedRef={elapsedRef} />}
    </>
  );
}

// ─── CinematicIntro (exported) ────────────────────────────────────────────────
interface Props { onComplete: () => void; }

export function CinematicIntro({ onComplete }: Props) {
  const elapsedRef = useRef(0);
  const [tick, setTick] = useState(0);

  // Poll elapsed every 80ms so HTML overlays react to time without per-frame state updates
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 80);
    return () => clearInterval(id);
  }, []);

  const elapsed = elapsedRef.current;
  const fade    = fadeAt(elapsed);
  const sub     = SUBS.find(s => elapsed >= s.start && elapsed < s.end) ?? null;

  const skip = () => onComplete();

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: '#000', userSelect: 'none', touchAction: 'none',
    }}>
      {/* 3-D cinematic canvas — ACESFilmic so highlights compress instead of blowing white */}
      <Canvas
        camera={{ fov: 65, near: 0.1, far: 300 }}
        gl={{ antialias: true, toneMapping: 4, toneMappingExposure: 1.0, alpha: false }}
        style={{ width: '100%', height: '100%', background: '#000' }}
        onCreated={({ gl }) => gl.setClearColor('#000000', 1)}
      >
        <Suspense fallback={null}>
          <CinematicController elapsedRef={elapsedRef} onDone={onComplete} />
          <ExposureController elapsedRef={elapsedRef} />
          <SceneSelector elapsedRef={elapsedRef} />
        </Suspense>
      </Canvas>

      {/* ── Black fade overlay ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `rgba(0,0,0,${fade.toFixed(3)})`,
        pointerEvents: 'none',
        transition: 'background 0.05s',
      }} />

      {/* ── Top VAULT-TEC bar ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: 'linear-gradient(90deg, #c8a000, #ffd040, #c8a000)',
        opacity: fade < 0.9 ? 1 : 0, transition: 'opacity 0.3s',
      }} />

      {/* ── Cinematic letterbox bars ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8%', background: '#000', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8%', background: '#000', pointerEvents: 'none' }} />

      {/* ── Subtitle block ── */}
      {sub && fade < 0.85 && (
        <div style={{
          position: 'absolute', bottom: '10%', left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center', pointerEvents: 'none',
          fontFamily: "'Courier New', monospace",
        }}>
          <div style={{
            color: '#ffd040', fontSize: 'clamp(13px, 2vw, 20px)',
            fontWeight: 'bold', letterSpacing: 5,
            textShadow: '0 0 20px #c8a000, 0 0 40px #c8a00055',
            marginBottom: 5,
          }}>{sub.main}</div>
          {sub.sub && (
            <div style={{
              color: '#88aacc', fontSize: 'clamp(10px, 1.3vw, 14px)',
              letterSpacing: 3,
              textShadow: '0 0 10px #0066ff44',
            }}>{sub.sub}</div>
          )}
        </div>
      )}

      {/* ── Top-left VAULT-TEC logo ── */}
      {fade < 0.85 && (
        <div style={{
          position: 'absolute', top: '10%', left: 20,
          fontFamily: "'Courier New', monospace",
          color: '#c8a000', fontSize: 'clamp(9px, 1vw, 12px)',
          letterSpacing: 4, opacity: 0.65, pointerEvents: 'none',
        }}>VAULT-TEC</div>
      )}

      {/* ── Progress ticker (top right) ── */}
      {fade < 0.85 && (
        <div style={{
          position: 'absolute', top: '10%', right: 20,
          fontFamily: "'Courier New', monospace",
          color: '#334455', fontSize: 'clamp(8px, 0.85vw, 11px)',
          letterSpacing: 2, pointerEvents: 'none',
        }}>
          {Math.floor(elapsed).toString().padStart(2, '0')} / {TOTAL}s
        </div>
      )}

      {/* ── Skip button ── */}
      <button
        onClick={skip}
        onTouchEnd={e => { e.preventDefault(); skip(); }}
        style={{
          position: 'absolute', bottom: '10%', right: 20,
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid #445566',
          color: '#445566',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(9px, 1vw, 12px)', letterSpacing: 3,
          padding: '6px 14px', cursor: 'pointer',
          transition: 'color 0.2s, border-color 0.2s',
        }}
        onMouseEnter={e => {
          (e.target as HTMLElement).style.color = '#88aacc';
          (e.target as HTMLElement).style.borderColor = '#88aacc';
        }}
        onMouseLeave={e => {
          (e.target as HTMLElement).style.color = '#445566';
          (e.target as HTMLElement).style.borderColor = '#445566';
        }}
      >
        SKIP ›
      </button>

      {/* suppress lint — tick keeps overlay in sync */}
      <span style={{ display: 'none' }}>{tick}</span>
    </div>
  );
}

import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';

function FrozenHuman() {
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
    <group>
      <mesh position={[0, 4.62, 0]} material={mat}><sphereGeometry args={[0.21, 12, 10]} /></mesh>
      <mesh position={[0, 4.3, 0]} material={mat}><capsuleGeometry args={[0.08, 0.2, 4, 8]} /></mesh>
      <mesh position={[0, 3.35, 0]} material={mat}><capsuleGeometry args={[0.24, 1.3, 6, 12]} /></mesh>
      <mesh position={[-0.38, 3.6, 0]} rotation={[0, 0, 0.28]} material={mat}><capsuleGeometry args={[0.09, 0.7, 4, 8]} /></mesh>
      <mesh position={[-0.52, 2.9, 0]} rotation={[0, 0, 0.15]} material={mat}><capsuleGeometry args={[0.075, 0.6, 4, 8]} /></mesh>
      <mesh position={[0.38, 3.6, 0]} rotation={[0, 0, -0.28]} material={mat}><capsuleGeometry args={[0.09, 0.7, 4, 8]} /></mesh>
      <mesh position={[0.52, 2.9, 0]} rotation={[0, 0, -0.15]} material={mat}><capsuleGeometry args={[0.075, 0.6, 4, 8]} /></mesh>
      <mesh position={[-0.15, 2.1, 0]} rotation={[0, 0, 0.05]} material={mat}><capsuleGeometry args={[0.12, 0.75, 4, 8]} /></mesh>
      <mesh position={[-0.16, 1.2, 0]} material={mat}><capsuleGeometry args={[0.1, 0.7, 4, 8]} /></mesh>
      <mesh position={[0.15, 2.1, 0]} rotation={[0, 0, -0.05]} material={mat}><capsuleGeometry args={[0.12, 0.75, 4, 8]} /></mesh>
      <mesh position={[0.16, 1.2, 0]} material={mat}><capsuleGeometry args={[0.1, 0.7, 4, 8]} /></mesh>
      <mesh position={[-0.16, 0.38, 0.06]} rotation={[0.3, 0, 0]} material={mat}><capsuleGeometry args={[0.08, 0.18, 4, 6]} /></mesh>
      <mesh position={[0.16, 0.38, 0.06]} rotation={[0.3, 0, 0]} material={mat}><capsuleGeometry args={[0.08, 0.18, 4, 6]} /></mesh>
    </group>
  );
}

interface Props {
  introStep: number;
}

// Icicle positions around the top rim
const ICICLE_OFFSETS: [number, number, number, number][] = [
  // [x, z, length, scale]
  [0.55, 0.1,   0.35, 1.0],
  [0.4,  0.38,  0.22, 0.7],
  [0.1,  0.55,  0.40, 1.1],
  [-0.3, 0.46,  0.28, 0.8],
  [-0.55, 0.1,  0.32, 0.9],
  [-0.45, -0.3, 0.20, 0.65],
  [0.0,  -0.56, 0.38, 1.0],
  [0.35, -0.44, 0.24, 0.75],
];

export function CryoTube3D({ introStep }: Props) {
  const leftDoorRef    = useRef<THREE.Mesh>(null!);
  const rightDoorRef   = useRef<THREE.Mesh>(null!);
  const glowRef        = useRef<THREE.PointLight>(null!);
  const rimGlowRef     = useRef<THREE.PointLight>(null!);
  const innerGlowRef   = useRef<THREE.Mesh>(null!);
  const statusRef      = useRef<THREE.Mesh>(null!);

  const vaultGirlTexture = useTexture('/vault-girl.png');

  // Fix texture orientation
  useMemo(() => {
    vaultGirlTexture.flipY = true;
    vaultGirlTexture.needsUpdate = true;
  }, [vaultGirlTexture]);

  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#9dd8f8',
    transparent: true,
    opacity: 0.28,
    roughness: 0.04,
    metalness: 0.05,
    transmission: 0.65,
    thickness: 0.3,
    envMapIntensity: 1,
    side: THREE.DoubleSide,
  }), []);

  const frostMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#cceeff',
    transparent: true,
    opacity: introStep < 2 ? 0.18 : 0.04,
    roughness: 1,
    side: THREE.DoubleSide,
  }), [introStep]);

  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a3550',
    roughness: 0.35,
    metalness: 0.9,
    emissive: '#002244',
    emissiveIntensity: 0.5,
  }), []);

  const frameAccentMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0a1a2a',
    roughness: 0.2,
    metalness: 1.0,
    emissive: '#0066cc',
    emissiveIntensity: 0.6,
  }), []);

  const doorMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0d2035',
    roughness: 0.5,
    metalness: 0.8,
    emissive: '#001133',
    emissiveIntensity: 0.2,
  }), []);

  const icicleMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#b8e8ff',
    transparent: true,
    opacity: 0.72,
    roughness: 0.05,
    metalness: 0.0,
    emissive: '#4499cc',
    emissiveIntensity: 0.3,
  }), []);

  const vaultGirlMat = useMemo(() => new THREE.MeshBasicMaterial({
    map: vaultGirlTexture,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  }), [vaultGirlTexture]);

  const platformMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0d2035',
    roughness: 0.3,
    metalness: 0.9,
    emissive: '#001133',
    emissiveIntensity: 0.4,
  }), []);

  useFrame((_, delta) => {
    if (!leftDoorRef.current || !rightDoorRef.current) return;

    const targetX = introStep >= 2 ? 0.95 : 0;
    leftDoorRef.current.position.x = THREE.MathUtils.lerp(
      leftDoorRef.current.position.x, -targetX, delta * 1.6
    );
    rightDoorRef.current.position.x = THREE.MathUtils.lerp(
      rightDoorRef.current.position.x, targetX, delta * 1.6
    );

    const t = Date.now() * 0.001;

    // Main cryo glow pulsing
    if (glowRef.current) {
      const base = introStep >= 2 ? 1.2 : 3.5;
      glowRef.current.intensity = base + Math.sin(t * 1.2) * 0.4;
    }

    // Rim glow
    if (rimGlowRef.current) {
      rimGlowRef.current.intensity = 0.8 + Math.sin(t * 2.1) * 0.2;
    }

    // Inner cylinder shimmer
    if (innerGlowRef.current) {
      const mat = innerGlowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.35 + Math.sin(t * 0.9) * 0.15;
    }

    // Status light blink
    if (statusRef.current) {
      const mat = statusRef.current.material as THREE.MeshStandardMaterial;
      const blink = introStep < 2
        ? (Math.sin(t * 4) > 0 ? 1.0 : 0.1)
        : 0.9 + Math.sin(t * 3) * 0.1;
      mat.emissiveIntensity = blink;
    }
  });

  return (
    <group position={[0, 0, -3]}>

      {/* === LIGHTS === */}
      <pointLight
        ref={glowRef}
        position={[0, 3, 0.3]}
        color="#44bbff"
        intensity={3.5}
        distance={11}
        decay={2}
      />
      <pointLight
        ref={rimGlowRef}
        position={[0, 5.2, 0.5]}
        color="#88ddff"
        intensity={0.8}
        distance={5}
        decay={2}
      />
      {/* Floor reflection glow */}
      <pointLight
        position={[0, 0.1, 0]}
        color="#2299ff"
        intensity={1.2}
        distance={4}
        decay={2}
      />

      {/* === PLATFORM BASE === */}
      {/* Outer plinth */}
      <mesh position={[0, 0.06, 0]} material={platformMat}>
        <cylinderGeometry args={[1.15, 1.25, 0.12, 24]} />
      </mesh>
      {/* Inner step */}
      <mesh position={[0, 0.18, 0]} material={frameMat}>
        <cylinderGeometry args={[0.88, 0.95, 0.12, 24]} />
      </mesh>
      {/* Platform glow ring */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.1, 32]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#0088ff"
          emissiveIntensity={0.9}
          transparent opacity={0.9}
        />
      </mesh>
      {/* Bolt details on platform */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh key={`bolt-${i}`}
            position={[Math.cos(angle) * 1.05, 0.14, Math.sin(angle) * 1.05]}
            material={frameAccentMat}
          >
            <cylinderGeometry args={[0.035, 0.035, 0.1, 6]} />
          </mesh>
        );
      })}

      {/* === MAIN TUBE CYLINDER === */}
      {/* Outer glass cylinder */}
      <mesh position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.78, 0.78, 5.2, 24, 1, true]} />
        <primitive object={glassMat} />
      </mesh>

      {/* Frost layer (only when frozen) */}
      {introStep < 2 && (
        <mesh position={[0, 2.8, 0]}>
          <cylinderGeometry args={[0.81, 0.81, 5.2, 24, 1, true]} />
          <primitive object={frostMat} />
        </mesh>
      )}

      {/* Inner glow cylinder */}
      <mesh ref={innerGlowRef} position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 5.0, 18, 1, true]} />
        <meshStandardMaterial
          color="#001830"
          emissive="#1166dd"
          emissiveIntensity={0.4}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* === FROZEN HUMAN SHAPE === */}
      <group position={[0, 0, -0.18]}>
        <FrozenHuman />
      </group>

      {/* === VAULT GIRL IMAGE (backlit behind human) === */}
      {/* Backlit panel behind figure */}
      <mesh position={[0, 2.55, -0.55]}>
        <planeGeometry args={[1.3, 4.2]} />
        <meshStandardMaterial
          color="#000a18"
          emissive="#002266"
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* The actual character texture */}
      <mesh position={[0, 2.65, -0.5]}>
        <planeGeometry args={[1.22, 3.9]} />
        <primitive object={vaultGirlMat} />
      </mesh>

      {/* === DOME TOP === */}
      <mesh position={[0, 5.4, 0]}>
        <sphereGeometry args={[0.78, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <primitive object={glassMat} />
      </mesh>

      {/* === ICICLES === */}
      {introStep < 2 && ICICLE_OFFSETS.map(([x, z, len, sc], i) => (
        <mesh
          key={`ic-${i}`}
          position={[x * 0.78, 5.35, z * 0.78]}
          scale={[sc * 0.06, len, sc * 0.06]}
          material={icicleMat}
        >
          <coneGeometry args={[1, 1, 5]} />
        </mesh>
      ))}

      {/* === FRAME RINGS === */}
      {/* Top cap ring */}
      <mesh position={[0, 5.45, 0]} material={frameMat}>
        <torusGeometry args={[0.82, 0.07, 8, 28]} />
      </mesh>
      {/* Upper accent ring */}
      <mesh position={[0, 5.3, 0]} material={frameAccentMat}>
        <torusGeometry args={[0.80, 0.035, 6, 28]} />
      </mesh>
      {/* Mid ring */}
      <mesh position={[0, 2.8, 0]} material={frameMat}>
        <torusGeometry args={[0.82, 0.055, 8, 28]} />
      </mesh>
      {/* Mid accent */}
      <mesh position={[0, 2.8, 0]} material={frameAccentMat}>
        <torusGeometry args={[0.80, 0.03, 6, 28]} />
      </mesh>
      {/* Lower ring */}
      <mesh position={[0, 0.27, 0]} material={frameMat}>
        <torusGeometry args={[0.82, 0.07, 8, 28]} />
      </mesh>
      {/* Lower accent */}
      <mesh position={[0, 0.28, 0]} material={frameAccentMat}>
        <torusGeometry args={[0.80, 0.035, 6, 28]} />
      </mesh>

      {/* === VERTICAL FRAME RAILS === */}
      {[-0.80, 0.80].map((x, i) => (
        <mesh key={`rail-${i}`} position={[x, 2.8, 0]} material={frameMat}>
          <boxGeometry args={[0.06, 5.2, 0.14]} />
        </mesh>
      ))}
      {/* Side accent strips */}
      {[-0.78, 0.78].map((x, i) => (
        <mesh key={`acc-${i}`} position={[x, 2.8, 0]} material={frameAccentMat}>
          <boxGeometry args={[0.025, 5.1, 0.06]} />
        </mesh>
      ))}

      {/* === DOOR PANELS (split open) === */}
      <mesh ref={leftDoorRef} position={[0, 2.8, 0.01]}>
        <boxGeometry args={[0.80, 5.2, 0.07]} />
        <primitive object={doorMat} />
      </mesh>
      <mesh ref={rightDoorRef} position={[0, 2.8, 0.01]}>
        <boxGeometry args={[0.80, 5.2, 0.07]} />
        <primitive object={doorMat} />
      </mesh>

      {/* === CONTROL PANEL (right side of frame) === */}
      <mesh position={[0.95, 3.2, 0]} material={frameMat}>
        <boxGeometry args={[0.08, 0.7, 0.22]} />
      </mesh>
      {/* Status LEDs */}
      {[3.5, 3.3, 3.1].map((y, i) => (
        <mesh key={`led-${i}`} position={[0.96, y, 0.06]}>
          <boxGeometry args={[0.05, 0.06, 0.05]} />
          <meshStandardMaterial
            color="#000"
            emissive={i === 0 ? '#00ff44' : i === 1 ? '#ffaa00' : '#0044ff'}
            emissiveIntensity={0.9}
          />
        </mesh>
      ))}

      {/* Main status indicator (top right of tube) */}
      <mesh ref={statusRef} position={[0.82, 4.8, 0]}>
        <boxGeometry args={[0.09, 0.09, 0.07]} />
        <meshStandardMaterial
          color="#000"
          emissive={introStep < 2 ? '#0055ff' : '#00ff44'}
          emissiveIntensity={1.0}
        />
      </mesh>

      {/* === CRYO-POD LABEL === */}
      <mesh position={[0, 0.14, 0.92]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.75, 0.15]} />
        <meshStandardMaterial color="#000a18" emissive="#0066cc" emissiveIntensity={0.7} />
      </mesh>

      {/* === FLOOR REFLECTION GLOW RING === */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[0.85, 2.0, 32]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#1166cc"
          emissiveIntensity={0.35}
          transparent
          opacity={0.7}
        />
      </mesh>

    </group>
  );
}

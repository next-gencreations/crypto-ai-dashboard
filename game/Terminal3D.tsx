import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Terminal3DDef } from './constants';

interface Props {
  terminal: Terminal3DDef;
  isNearby?: boolean;
}

export function Terminal3D({ terminal, isNearby = false }: Props) {
  const screenRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.PointLight>(null!);
  const color = new THREE.Color(terminal.color);

  const screenMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#000800',
    emissive: new THREE.Color(terminal.color).multiplyScalar(0.08),
    emissiveIntensity: 1,
    roughness: 0.3,
    metalness: 0.1,
  }), [terminal.color]);

  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0d1a0d',
    roughness: 0.7,
    metalness: 0.5,
  }), []);

  const standMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0a120a',
    roughness: 0.8,
    metalness: 0.6,
  }), []);

  const dotMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: terminal.color,
    emissive: terminal.color,
    emissiveIntensity: 0.9,
  }), [terminal.color]);

  useFrame(() => {
    if (!glowRef.current) return;
    const t = Date.now() * 0.001;
    const base = isNearby ? 1.5 : 0.6;
    glowRef.current.intensity = base + Math.sin(t * 2.0) * 0.15;

    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial;
      const emissiveBase = isNearby ? 0.2 : 0.08;
      mat.emissiveIntensity = emissiveBase + Math.sin(t * 1.5) * 0.04;
    }
  });

  return (
    <group position={terminal.position} rotation={terminal.rotation}>
      {/* Terminal glow light */}
      <pointLight
        ref={glowRef}
        position={[0, 0, 0.4]}
        color={terminal.color}
        intensity={0.6}
        distance={4}
        decay={2}
      />

      {/* Monitor body/frame */}
      <mesh position={[0, 0, 0]} material={frameMat}>
        <boxGeometry args={[0.75, 0.6, 0.08]} />
      </mesh>

      {/* Screen */}
      <mesh ref={screenRef} position={[0, 0.04, 0.045]} material={screenMat}>
        <planeGeometry args={[0.62, 0.46]} />
      </mesh>

      {/* Scanline overlay */}
      <mesh position={[0, 0.04, 0.048]}>
        <planeGeometry args={[0.62, 0.46]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>

      {/* Screen glow dots (simulated text) */}
      {[-0.15, 0, 0.15].map((x, i) => (
        <mesh key={i} position={[x, 0.05, 0.05]} material={dotMat}>
          <planeGeometry args={[0.08, 0.03]} />
        </mesh>
      ))}
      {[-0.2, -0.05, 0.1].map((x, i) => (
        <mesh key={`r2-${i}`} position={[x, -0.02, 0.05]} material={dotMat}>
          <planeGeometry args={[0.06, 0.02]} />
        </mesh>
      ))}
      {[-0.1, 0.1].map((x, i) => (
        <mesh key={`r3-${i}`} position={[x, -0.09, 0.05]} material={dotMat}>
          <planeGeometry args={[0.1, 0.02]} />
        </mesh>
      ))}

      {/* Status LED */}
      <mesh position={[0.33, -0.24, 0.045]} material={dotMat}>
        <circleGeometry args={[0.025, 8]} />
      </mesh>

      {/* Keyboard */}
      <mesh position={[0, -0.38, 0.06]} material={frameMat}>
        <boxGeometry args={[0.65, 0.1, 0.06]} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`key-${i}`} position={[-0.22 + i * 0.11, -0.38, 0.095]} material={standMat}>
          <boxGeometry args={[0.08, 0.06, 0.02]} />
        </mesh>
      ))}

      {/* Stand neck */}
      <mesh position={[0, -0.7, 0.04]} material={standMat}>
        <boxGeometry args={[0.06, 0.3, 0.06]} />
      </mesh>

      {/* Stand base */}
      <mesh position={[0, -0.86, 0.06]} material={standMat}>
        <boxGeometry args={[0.35, 0.06, 0.25]} />
      </mesh>

      {/* Nearby highlight ring */}
      {isNearby && (
        <mesh position={[0, 0, -0.01]}>
          <ringGeometry args={[0.42, 0.46, 32]} />
          <meshBasicMaterial color={terminal.color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

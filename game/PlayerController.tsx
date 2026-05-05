import * as THREE from 'three';
import { MutableRefObject, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { TERMINALS_3D, INTERACT_RADIUS, PLAYER_SPEED, ROOM_BOUND } from './constants';

interface Props {
  onNearTerminal: (id: string | null) => void;
  onLock: () => void;
  onUnlock: () => void;
  paused: boolean;
  isMobile: boolean;
  cameraRotRef: MutableRefObject<{ yaw: number; pitch: number }>;
  moveInputRef: MutableRefObject<{ x: number; z: number }>;
  playerPosRef: MutableRefObject<{ x: number; z: number }>;
}

export function PlayerController({
  onNearTerminal, onLock, onUnlock, paused,
  isMobile, cameraRotRef, moveInputRef, playerPosRef,
}: Props) {
  const { camera } = useThree();
  const keys = useRef(new Set<string>());
  const plcRef = useRef<any>(null);
  const lastNearest = useRef<string | null>(null);

  useEffect(() => {
    camera.position.set(0, 1.7, 9);
    if (isMobile) {
      cameraRotRef.current = { yaw: 0, pitch: 0 };
      camera.rotation.set(0, 0, 0, 'YXZ');
    } else {
      camera.lookAt(0, 1.7, -3);
    }
  }, [camera, isMobile, cameraRotRef]);

  // Desktop keyboard input
  useEffect(() => {
    if (isMobile) return;
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [isMobile]);

  // Unlock pointer on pause (desktop only)
  useEffect(() => {
    if (!isMobile && paused && plcRef.current?.isLocked) {
      plcRef.current.unlock();
    }
  }, [paused, isMobile]);

  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const fwd = useRef(new THREE.Vector3());
  const rgt = useRef(new THREE.Vector3());
  const vel = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (paused) return;

    const dt = Math.min(delta, 0.05);
    const speed = PLAYER_SPEED * dt;

    if (isMobile) {
      // Apply touch camera rotation
      camera.rotation.set(
        cameraRotRef.current.pitch,
        cameraRotRef.current.yaw,
        0,
        'YXZ'
      );

      // Mobile movement from joystick (x = strafe, z = forward/back)
      const mx = moveInputRef.current.x;
      const mz = moveInputRef.current.z;

      if (mx !== 0 || mz !== 0) {
        const yaw = cameraRotRef.current.yaw;
        fwd.current.set(-Math.sin(yaw), 0, -Math.cos(yaw)); // forward
        rgt.current.set(Math.cos(yaw), 0, -Math.sin(yaw));  // right

        vel.current.set(0, 0, 0);
        vel.current.addScaledVector(fwd.current, -mz);
        vel.current.addScaledVector(rgt.current, mx);

        if (vel.current.lengthSq() > 0) {
          vel.current.normalize().multiplyScalar(speed);
          camera.position.add(vel.current);
        }
      }
    } else {
      // Desktop — only move when pointer is locked
      if (!plcRef.current?.isLocked) return;

      euler.current.setFromQuaternion(camera.quaternion, 'YXZ');
      const yaw = euler.current.y;
      fwd.current.set(-Math.sin(yaw), 0, -Math.cos(yaw));
      rgt.current.set(Math.cos(yaw), 0, -Math.sin(yaw));

      vel.current.set(0, 0, 0);
      const k = keys.current;
      if (k.has('KeyW') || k.has('ArrowUp'))    vel.current.add(fwd.current);
      if (k.has('KeyS') || k.has('ArrowDown'))  vel.current.sub(fwd.current);
      if (k.has('KeyA') || k.has('ArrowLeft'))  vel.current.sub(rgt.current);
      if (k.has('KeyD') || k.has('ArrowRight')) vel.current.add(rgt.current);

      if (vel.current.lengthSq() > 0) {
        vel.current.normalize().multiplyScalar(speed);
        camera.position.add(vel.current);
      }
    }

    // Clamp to room bounds
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -ROOM_BOUND, ROOM_BOUND);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -ROOM_BOUND, ROOM_BOUND);
    camera.position.y = 1.7;

    // Update shared position ref for radiation scanner
    playerPosRef.current.x = camera.position.x;
    playerPosRef.current.z = camera.position.z;

    // Terminal proximity detection
    let nearest: string | null = null;
    let nearestDist = Infinity;
    for (const t of TERMINALS_3D) {
      const dx = t.position[0] - camera.position.x;
      const dz = t.position[2] - camera.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < INTERACT_RADIUS && dist < nearestDist) {
        nearest = t.id;
        nearestDist = dist;
      }
    }
    if (nearest !== lastNearest.current) {
      lastNearest.current = nearest;
      onNearTerminal(nearest);
    }
  });

  if (isMobile) return null;

  return (
    <PointerLockControls
      ref={plcRef}
      onLock={onLock}
      onUnlock={onUnlock}
      maxPolarAngle={Math.PI * 0.75}
      minPolarAngle={Math.PI * 0.25}
    />
  );
}

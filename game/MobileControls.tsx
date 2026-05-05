import { MutableRefObject, useEffect, useRef } from 'react';

interface Props {
  cameraRotRef: MutableRefObject<{ yaw: number; pitch: number }>;
  moveInputRef: MutableRefObject<{ x: number; z: number }>;
  nearbyTerminal: string | null;
  onInteract: () => void;
  onPipBoy: () => void;
  isModalOpen: boolean;
}

const JOYSTICK_RADIUS = 55;
const HANDLE_RADIUS = 26;
const BASE_LEFT = 90;
const BASE_BOTTOM = 140;

export function MobileControls({
  cameraRotRef, moveInputRef, nearbyTerminal, onInteract, onPipBoy, isModalOpen,
}: Props) {
  const joystickTouchId = useRef<number | null>(null);
  const lookTouchId = useRef<number | null>(null);
  const lookLastPos = useRef({ x: 0, y: 0 });
  const handleDomRef = useRef<HTMLDivElement>(null);
  const baseDomRef = useRef<HTMLDivElement>(null);
  const joystickBasePos = useRef({ x: 0, y: 0 }); // center of joystick base in screen coords

  useEffect(() => {
    // Compute joystick center on mount / resize
    const computeBase = () => {
      joystickBasePos.current = {
        x: BASE_LEFT,
        y: window.innerHeight - BASE_BOTTOM,
      };
    };
    computeBase();
    window.addEventListener('resize', computeBase);
    return () => window.removeEventListener('resize', computeBase);
  }, []);

  const resetHandle = () => {
    if (handleDomRef.current) {
      handleDomRef.current.style.transform = 'translate(-50%, -50%)';
    }
    moveInputRef.current.x = 0;
    moveInputRef.current.z = 0;
    joystickTouchId.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isModalOpen) return;
    Array.from(e.changedTouches).forEach(touch => {
      const isLeftSide = touch.clientX < window.innerWidth * 0.42;
      if (isLeftSide && joystickTouchId.current === null) {
        joystickTouchId.current = touch.identifier;
      } else if (!isLeftSide && lookTouchId.current === null) {
        lookTouchId.current = touch.identifier;
        lookLastPos.current = { x: touch.clientX, y: touch.clientY };
      }
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isModalOpen) return;
    Array.from(e.changedTouches).forEach(touch => {
      // Joystick movement
      if (touch.identifier === joystickTouchId.current) {
        const base = joystickBasePos.current;
        const dx = touch.clientX - base.x;
        const dy = touch.clientY - base.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clamped = Math.min(dist, JOYSTICK_RADIUS);
        const angle = Math.atan2(dy, dx);
        const ox = Math.cos(angle) * clamped;
        const oy = Math.sin(angle) * clamped;
        const norm = clamped / JOYSTICK_RADIUS;

        // Update DOM directly for smooth visuals
        if (handleDomRef.current) {
          handleDomRef.current.style.transform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`;
        }

        // Normalized joystick output
        moveInputRef.current.x = Math.cos(angle) * norm;
        moveInputRef.current.z = Math.sin(angle) * norm;
      }

      // Look movement
      if (touch.identifier === lookTouchId.current) {
        const dx = touch.clientX - lookLastPos.current.x;
        const dy = touch.clientY - lookLastPos.current.y;
        lookLastPos.current = { x: touch.clientX, y: touch.clientY };

        cameraRotRef.current.yaw -= dx * 0.0035;
        cameraRotRef.current.pitch = Math.max(
          -1.1,
          Math.min(1.1, cameraRotRef.current.pitch - dy * 0.0035)
        );
      }
    });
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    Array.from(e.changedTouches).forEach(touch => {
      if (touch.identifier === joystickTouchId.current) resetHandle();
      if (touch.identifier === lookTouchId.current) lookTouchId.current = null;
    });
  };

  return (
    <>
      {/* Full-screen touch capture */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          WebkitUserSelect: 'none', userSelect: 'none',
          touchAction: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Joystick base */}
      <div
        ref={baseDomRef}
        style={{
          position: 'fixed',
          left: BASE_LEFT - JOYSTICK_RADIUS,
          bottom: BASE_BOTTOM - JOYSTICK_RADIUS,
          width: JOYSTICK_RADIUS * 2,
          height: JOYSTICK_RADIUS * 2,
          borderRadius: '50%',
          background: 'rgba(0,30,0,0.35)',
          border: '2px solid rgba(0,200,60,0.3)',
          boxShadow: '0 0 16px rgba(0,200,60,0.1)',
          zIndex: 70,
          pointerEvents: 'none',
        }}
      />

      {/* Joystick handle */}
      <div
        ref={handleDomRef}
        style={{
          position: 'fixed',
          left: BASE_LEFT,
          bottom: BASE_BOTTOM,
          width: HANDLE_RADIUS * 2,
          height: HANDLE_RADIUS * 2,
          borderRadius: '50%',
          background: 'rgba(0,200,60,0.45)',
          border: '2px solid rgba(0,255,80,0.8)',
          boxShadow: '0 0 12px rgba(0,255,80,0.4)',
          transform: 'translate(-50%, 50%)',
          zIndex: 71,
          pointerEvents: 'none',
          transition: 'box-shadow 0.1s',
        }}
      />

      {/* Move label */}
      <div style={{
        position: 'fixed', left: BASE_LEFT - JOYSTICK_RADIUS, bottom: BASE_BOTTOM - JOYSTICK_RADIUS - 22,
        width: JOYSTICK_RADIUS * 2, textAlign: 'center',
        color: 'rgba(0,200,60,0.5)', fontSize: 9, fontFamily: 'monospace', letterSpacing: 2,
        zIndex: 70, pointerEvents: 'none',
      }}>MOVE</div>

      {/* Look hint (right side) */}
      <div style={{
        position: 'fixed', right: 20, bottom: BASE_BOTTOM - JOYSTICK_RADIUS - 22,
        color: 'rgba(0,200,60,0.35)', fontSize: 9, fontFamily: 'monospace', letterSpacing: 2,
        zIndex: 70, pointerEvents: 'none',
      }}>LOOK ▶</div>

      {/* Interact [E] button — shows when near terminal */}
      {nearbyTerminal && !isModalOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 120,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 80,
            background: 'rgba(0,20,0,0.9)',
            border: '2px solid #00ff44',
            borderRadius: 8,
            padding: '14px 28px',
            color: '#00ff44',
            fontSize: 14,
            fontFamily: 'monospace',
            letterSpacing: 3,
            boxShadow: '0 0 20px rgba(0,255,68,0.4)',
            cursor: 'pointer',
            minWidth: 140,
            textAlign: 'center',
          }}
          onTouchStart={(e) => { e.stopPropagation(); onInteract(); }}
        >
          [E] ACCESS
        </div>
      )}

      {/* PIP-BOY button */}
      {!isModalOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: BASE_BOTTOM - JOYSTICK_RADIUS,
            right: 20,
            zIndex: 80,
            background: 'rgba(0,20,0,0.85)',
            border: '1.5px solid #00aa33',
            borderRadius: 8,
            padding: '10px 16px',
            color: '#00aa33',
            fontSize: 11,
            fontFamily: 'monospace',
            letterSpacing: 2,
            boxShadow: '0 0 12px rgba(0,170,51,0.3)',
            cursor: 'pointer',
            textAlign: 'center',
          }}
          onTouchStart={(e) => { e.stopPropagation(); onPipBoy(); }}
        >
          PIP-BOY<br />
          <span style={{ fontSize: 9, opacity: 0.7 }}>[TAB]</span>
        </div>
      )}
    </>
  );
}

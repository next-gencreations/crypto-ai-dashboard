import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Scene } from './Scene';
import { PipBoy } from './PipBoy';
import { TerminalModal } from './TerminalModal';
import { Crosshair } from './Crosshair';
import { MobileControls } from './MobileControls';
import { DayCounter } from './DayCounter';
import { RadiationScanner } from './RadiationScanner';
import { CinematicIntro } from './CinematicIntro';
import { PipBoyScreen } from './types';
import { checkWebGL } from './WebGLCheck';

const isMobile = typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

function NoWebGL() {
  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#010801',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Courier New', monospace", color: '#00ff44', gap: 14,
    }}>
      <div style={{ fontSize: 24, letterSpacing: 6, textShadow: '0 0 20px #00ff44' }}>VAULT 63</div>
      <div style={{ color: '#ff4444', fontSize: 11, letterSpacing: 3 }}>DISPLAY SYSTEM FAILURE</div>
      <div style={{ color: '#008822', fontSize: 10, letterSpacing: 1, textAlign: 'center', maxWidth: 360, lineHeight: 1.8 }}>
        WebGL is required for the 3D vault experience.<br />
        Please open in a WebGL-capable browser tab.
      </div>
    </div>
  );
}

function VaultGame() {
  const [showCinematic, setShowCinematic] = useState(true);
  const [isActive, setIsActive] = useState(false);  // locked on desktop / started on mobile
  const [hasStarted, setHasStarted] = useState(false);
  const [introStep, setIntroStep] = useState(0);
  const [nearbyTerminal, setNearbyTerminal] = useState<string | null>(null);
  const [activeTerminal, setActiveTerminal] = useState<string | null>(null);
  const [pipBoyOpen, setPipBoyOpen] = useState(false);
  const [pipBoyScreen, setPipBoyScreen] = useState<PipBoyScreen>('STAT');

  // Shared refs that cross the Canvas/HTML boundary
  const cameraRotRef = useRef({ yaw: 0, pitch: 0 });
  const moveInputRef = useRef({ x: 0, z: 0 });
  const playerPosRef = useRef({ x: 0, z: 9 });

  const isModalOpen = pipBoyOpen || !!activeTerminal;

  // Intro sequence
  useEffect(() => {
    const t1 = setTimeout(() => setIntroStep(1), 1800);
    const t2 = setTimeout(() => setIntroStep(2), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        if (!activeTerminal) setPipBoyOpen(o => !o);
      }
      if (e.code === 'KeyE' && nearbyTerminal && isActive && !isModalOpen) {
        setActiveTerminal(nearbyTerminal);
      }
      if (e.code === 'Escape') {
        if (activeTerminal) { setActiveTerminal(null); return; }
        if (pipBoyOpen) { setPipBoyOpen(false); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nearbyTerminal, isActive, isModalOpen, activeTerminal, pipBoyOpen]);

  const handleLock = useCallback(() => { setIsActive(true); setHasStarted(true); }, []);
  const handleUnlock = useCallback(() => setIsActive(false), []);
  const handleNearTerminal = useCallback((id: string | null) => setNearbyTerminal(id), []);

  const handleMobileStart = () => {
    setIsActive(true);
    setHasStarted(true);
  };

  const handleInteract = useCallback(() => {
    if (nearbyTerminal) setActiveTerminal(nearbyTerminal);
  }, [nearbyTerminal]);

  const handlePipBoy = useCallback(() => {
    if (!activeTerminal) setPipBoyOpen(o => !o);
  }, [activeTerminal]);

  const showHUD = isActive && !isModalOpen;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#010801',
      position: 'relative',
      overflow: 'hidden',
      userSelect: 'none',
      fontFamily: "'Courier New', monospace",
      touchAction: 'none',
    }}>
      {/* ── Cinematic intro (shown before game starts) ── */}
      {showCinematic && (
        <CinematicIntro onComplete={() => setShowCinematic(false)} />
      )}

      {/* 3D Canvas */}
      <Canvas
        camera={{ fov: isMobile ? 80 : 75, near: 0.1, far: 100 }}
        gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 0.9 }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <Suspense fallback={null}>
          <Scene
            introStep={introStep}
            nearbyTerminal={nearbyTerminal}
            onNearTerminal={handleNearTerminal}
            onLock={handleLock}
            onUnlock={handleUnlock}
            paused={isModalOpen}
            isMobile={isMobile}
            cameraRotRef={cameraRotRef}
            moveInputRef={moveInputRef}
            playerPosRef={playerPosRef}
          />
        </Suspense>
      </Canvas>

      {/* ---- MOBILE UI ---- */}
      {isMobile && (
        <>
          {/* Tap-to-start overlay */}
          {!isActive && !isModalOpen && (
            <div
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,5,0,0.92)',
                zIndex: 200,
              }}
              onTouchStart={handleMobileStart}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: 'linear-gradient(90deg, #c8a000, #ffd040, #c8a000)' }} />
              <div style={{ color: '#c8a000', fontSize: 10, letterSpacing: 5, marginBottom: 18, opacity: 0.75 }}>VAULT-TEC CORPORATION</div>
              <div style={{
                color: '#ffd040', fontSize: 40, fontWeight: 'bold',
                letterSpacing: 10, marginBottom: 4,
                textShadow: '0 0 40px #ffd040, 0 0 80px #c8a00066',
              }}>VAULT 63</div>
              <div style={{ color: '#88aacc', fontSize: 11, letterSpacing: 6, marginBottom: 6 }}>CRYOGENIC LABORATORY</div>
              <div style={{ color: '#445566', fontSize: 9, letterSpacing: 3, marginBottom: 50 }}>SANCTUARY HILLS · MASSACHUSETTS</div>
              <div style={{
                color: '#ffd040', fontSize: 14, letterSpacing: 4,
                border: '2px solid #c8a000', padding: '14px 44px',
                borderRadius: 2, background: 'rgba(200,160,0,0.08)',
                boxShadow: '0 0 24px #c8a00033',
                animation: 'pulseBtn 2s ease-in-out infinite',
              }}>
                TAP TO ENTER VAULT
              </div>
              <div style={{ color: '#445566', fontSize: 9, letterSpacing: 1, marginTop: 30, textAlign: 'center', lineHeight: 2.2 }}>
                LEFT JOYSTICK — MOVE<br />
                SWIPE RIGHT — LOOK<br />
                TAP BUTTONS — INTERACT / PIP-BOY
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #c8a000, #ffd040, #c8a000)' }} />
            </div>
          )}

          {/* Mobile touch controls */}
          {isActive && (
            <MobileControls
              cameraRotRef={cameraRotRef}
              moveInputRef={moveInputRef}
              nearbyTerminal={nearbyTerminal}
              onInteract={handleInteract}
              onPipBoy={handlePipBoy}
              isModalOpen={isModalOpen}
            />
          )}

          {/* Mobile vault badge (top center) */}
          {showHUD && (
            <div style={{
              position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,10,0,0.75)', border: '1px solid #1a4a1a',
              borderRadius: 3, padding: '4px 16px', textAlign: 'center', zIndex: 100, pointerEvents: 'none',
            }}>
              <div style={{ color: '#00ff44', fontSize: 11, fontWeight: 'bold', letterSpacing: 4 }}>VAULT 63</div>
              <div style={{ color: '#00aa33', fontSize: 7, letterSpacing: 2 }}>CRYO LEVEL</div>
            </div>
          )}
        </>
      )}

      {/* ---- DESKTOP UI ---- */}
      {!isMobile && (
        <>
          {/* Click-to-start overlay */}
          {!isActive && !isModalOpen && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: hasStarted ? 'rgba(0,8,0,0.55)' : 'rgba(0,5,0,0.90)',
              zIndex: 200, cursor: 'pointer',
              transition: 'background 0.4s',
            }}>
              {!hasStarted ? (
                <>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: 'linear-gradient(90deg, #c8a000, #ffd040, #c8a000)' }} />
                  <div style={{ color: '#c8a000', fontSize: 11, letterSpacing: 5, marginBottom: 18, opacity: 0.75 }}>VAULT-TEC CORPORATION</div>
                  <div style={{
                    color: '#ffd040', fontSize: 48, fontWeight: 'bold',
                    letterSpacing: 12, marginBottom: 4,
                    textShadow: '0 0 40px #ffd040, 0 0 90px #c8a00055',
                  }}>VAULT 63</div>
                  <div style={{ color: '#88aacc', fontSize: 13, letterSpacing: 7, marginBottom: 6 }}>CRYOGENIC LABORATORY — LEVEL 1</div>
                  <div style={{ color: '#445566', fontSize: 10, letterSpacing: 3, marginBottom: 52 }}>SANCTUARY HILLS · MASSACHUSETTS · ESTABLISHED 2077</div>
                  <div style={{
                    color: '#ffd040', fontSize: 13, letterSpacing: 4,
                    border: '2px solid #c8a000', padding: '12px 40px', borderRadius: 2,
                    background: 'rgba(200,160,0,0.08)',
                    boxShadow: '0 0 24px #c8a00033',
                    animation: 'pulseBtn 2s ease-in-out infinite',
                  }}>CLICK TO ENTER VAULT</div>
                  <div style={{ color: '#445566', fontSize: 9, letterSpacing: 2, marginTop: 26, lineHeight: 2 }}>
                    WASD — MOVE &nbsp;·&nbsp; MOUSE — LOOK &nbsp;·&nbsp; E — INTERACT &nbsp;·&nbsp; TAB — PIP-BOY
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #c8a000, #ffd040, #c8a000)' }} />
                </>
              ) : (
                <>
                  <div style={{ color: '#c8a000', fontSize: 13, letterSpacing: 4, marginBottom: 14 }}>
                    POINTER LOCK RELEASED
                  </div>
                  <div style={{
                    color: '#ffd040', fontSize: 12, letterSpacing: 3,
                    border: '2px solid #c8a000', padding: '10px 30px', borderRadius: 2,
                    background: 'rgba(200,160,0,0.08)',
                  }}>CLICK TO RESUME</div>
                </>
              )}
            </div>
          )}

          {/* Desktop crosshair */}
          {showHUD && <Crosshair nearbyTerminal={nearbyTerminal} />}

          {/* Desktop — [E] prompt */}
          {showHUD && nearbyTerminal && (
            <div style={{
              position: 'fixed', bottom: '10%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,12,0,0.9)', border: '1px solid #00aa33',
              borderRadius: 3, padding: '7px 22px',
              color: '#00ff44', fontSize: 12, letterSpacing: 3,
              zIndex: 100, pointerEvents: 'none',
            }}>[E] ACCESS TERMINAL</div>
          )}

          {/* Desktop controls hint */}
          {showHUD && (
            <div style={{
              position: 'fixed', bottom: 16, left: 16,
              background: 'rgba(0,10,0,0.75)', border: '1px solid #1a3a1a',
              borderRadius: 3, padding: '7px 12px',
              color: '#00aa33', fontSize: 9, lineHeight: 1.9, letterSpacing: 1, zIndex: 100,
            }}>
              <div style={{ color: '#00ff44', marginBottom: 2, letterSpacing: 2 }}>CONTROLS</div>
              WASD / ARROWS — MOVE<br />
              MOUSE — LOOK AROUND<br />
              E — INTERACT WITH TERMINAL<br />
              TAB — OPEN PIP-BOY<br />
              ESC — RELEASE MOUSE
            </div>
          )}

          {/* Desktop Vault 63 badge */}
          {showHUD && (
            <div style={{
              position: 'fixed', top: 16, right: 16,
              background: 'rgba(0,10,0,0.8)', border: '1px solid #1a4a1a',
              borderRadius: 3, padding: '5px 14px', textAlign: 'center', zIndex: 100,
            }}>
              <div style={{ color: '#00ff44', fontSize: 12, fontWeight: 'bold', letterSpacing: 4 }}>VAULT 63</div>
              <div style={{ color: '#00aa33', fontSize: 8, letterSpacing: 2 }}>CRYO LEVEL</div>
            </div>
          )}

          {/* Desktop Pip-Boy arm widget */}
          {showHUD && (
            <div style={{
              position: 'fixed', bottom: 0, right: 0,
              width: 130, height: 90,
              background: 'linear-gradient(135deg, transparent 0%, rgba(0,20,0,0.65) 60%)',
              borderTop: '1px solid #1a3a1a', borderLeft: '1px solid #1a3a1a',
              borderRadius: '12px 0 0 0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 5, zIndex: 50,
            }}>
              <div style={{
                width: 44, height: 32, background: '#0a1a0a',
                border: '1.5px solid #00ff44', borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 12px #00ff4444',
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '1.5px solid #00ff44',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff44' }} />
                </div>
              </div>
              <div style={{ color: '#00aa33', fontSize: 8, letterSpacing: 2 }}>PIP-BOY [TAB]</div>
            </div>
          )}
        </>
      )}

      {/* ---- SHARED HUD (both mobile & desktop) ---- */}

      {/* Day counter — top left */}
      <DayCounter visible={showHUD} />

      {/* Radiation scanner — bottom right (desktop) / top right (mobile) */}
      <div style={isMobile ? {
        position: 'fixed', top: 52, right: 8,
      } : {}}>
        <RadiationScanner playerPosRef={playerPosRef} visible={showHUD} />
      </div>

      {/* Intro cinematic text */}
      {introStep < 2 && (
        <div style={{
          position: 'fixed', top: '28%', left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center', pointerEvents: 'none', zIndex: 300,
        }}>
          {introStep === 0 && (
            <div style={{ color: '#1a4a8a', fontSize: isMobile ? 11 : 14, letterSpacing: 4 }}>
              CRYOGENIC STASIS SYSTEM — VAULT 63
            </div>
          )}
          {introStep === 1 && (
            <div style={{ color: '#00aaff', fontSize: isMobile ? 11 : 14, letterSpacing: 3, textShadow: '0 0 15px #00aaff' }}>
              EMERGENCY OVERRIDE — THAWING SUBJECT...
            </div>
          )}
        </div>
      )}

      {/* PipBoy modal */}
      <PipBoy
        open={pipBoyOpen}
        screen={pipBoyScreen}
        onChangeScreen={setPipBoyScreen}
        onClose={() => setPipBoyOpen(false)}
      />

      {/* Terminal modal */}
      <TerminalModal
        terminalId={activeTerminal}
        onClose={() => setActiveTerminal(null)}
      />

      <style>{`
        @keyframes pulseBtn {
          0%, 100% { box-shadow: 0 0 20px #00ff4422; }
          50% { box-shadow: 0 0 30px #00ff4466, 0 0 50px #00ff4422; }
        }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}

export function Game() {
  if (!checkWebGL()) return <NoWebGL />;
  return <VaultGame />;
}

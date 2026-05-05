import { useEffect, useState } from 'react';
import { TERMINAL_CONTENT, TERMINALS } from './constants';

interface Props {
  terminalId: string | null;
  onClose: () => void;
}

export function TerminalModal({ terminalId, onClose }: Props) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [blink, setBlink] = useState(true);

  const terminal = TERMINALS.find(t => t.id === terminalId);
  const content = terminalId ? TERMINAL_CONTENT[terminalId] : null;

  useEffect(() => {
    if (!content) return;
    setVisibleLines(0);
    const interval = setInterval(() => {
      setVisibleLines(v => {
        if (v >= content.lines.length) { clearInterval(interval); return v; }
        return v + 1;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [terminalId, content]);

  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyE') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!terminalId || !content || !terminal) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)',
    }}>
      <div style={{
        width: 640,
        background: '#000a00',
        border: `2px solid ${terminal.color}`,
        borderRadius: 4,
        boxShadow: `0 0 40px ${terminal.color}44, 0 0 80px ${terminal.color}22`,
        fontFamily: "'Courier New', monospace",
        overflow: 'hidden',
      }}>
        {/* Terminal header bar */}
        <div style={{
          background: terminal.color + '22',
          borderBottom: `1px solid ${terminal.color}44`,
          padding: '6px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ color: terminal.color, fontSize: 11, letterSpacing: 2 }}>
            VAULT-TEC UNIFIED OPERATING SYSTEM
          </div>
          <div style={{ color: terminal.color, fontSize: 10, opacity: 0.7 }}>
            v7.1.0.8
          </div>
        </div>

        {/* Screen content */}
        <div style={{
          padding: '16px 20px',
          minHeight: 360,
          position: 'relative',
        }}>
          {/* Scanlines */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
          }} />

          {/* Title */}
          <div style={{
            color: terminal.color,
            fontSize: 13,
            fontWeight: 'bold',
            letterSpacing: 2,
            marginBottom: 12,
            borderBottom: `1px solid ${terminal.color}33`,
            paddingBottom: 6,
          }}>
            {content.title}
          </div>

          {/* Content lines */}
          <div style={{ fontSize: 11, lineHeight: 1.7, color: terminal.color + 'cc' }}>
            {content.lines.slice(0, visibleLines).map((line, i) => (
              <div key={i} style={{
                opacity: line === '' ? 0.3 : 1,
                color: line.startsWith('>') ? terminal.color : terminal.color + 'aa',
                fontWeight: line.startsWith('>') ? 'bold' : 'normal',
              }}>
                {line || '\u00A0'}
              </div>
            ))}
            {/* Blinking cursor */}
            {visibleLines < content.lines.length ? (
              <span style={{ color: terminal.color, opacity: blink ? 1 : 0 }}>█</span>
            ) : (
              <div style={{ marginTop: 12, color: terminal.color + '88', fontSize: 10 }}>
                <span style={{ opacity: blink ? 1 : 0 }}>█ </span>
                END OF FILE — PRESS [ESC] OR [E] TO EXIT
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: terminal.color + '11',
          borderTop: `1px solid ${terminal.color}33`,
          padding: '5px 12px',
          display: 'flex', justifyContent: 'space-between',
          color: terminal.color + '88', fontSize: 9, letterSpacing: 1,
        }}>
          <span>{terminal.label}</span>
          <span>[ESC] CLOSE TERMINAL</span>
        </div>
      </div>
    </div>
  );
}

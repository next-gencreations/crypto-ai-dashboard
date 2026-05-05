import { PipBoyScreen } from './types';

interface Props {
  open: boolean;
  screen: PipBoyScreen;
  onChangeScreen: (s: PipBoyScreen) => void;
  onClose: () => void;
}

const SCREENS: PipBoyScreen[] = ['STAT', 'INV', 'DATA', 'MAP', 'RADIO'];

const STAT_BARS = [
  { label: 'STRENGTH',     abbr: 'S', val: 4  },
  { label: 'PERCEPTION',   abbr: 'P', val: 5  },
  { label: 'ENDURANCE',    abbr: 'E', val: 4  },
  { label: 'CHARISMA',     abbr: 'C', val: 7  },
  { label: 'INTELLIGENCE', abbr: 'I', val: 8  },
  { label: 'AGILITY',      abbr: 'A', val: 6  },
  { label: 'LUCK',         abbr: 'L', val: 5  },
];

const MAP_ART = [
  '  ┌─────────────────────────────────┐  ',
  '  │  [SEC]     [CRYO]     [RES]     │  ',
  '  │              ╔═╗                │  ',
  '  │              ║T║ ← Cryo Tube    │  ',
  '  │              ╚═╝                │  ',
  '  │            ★ YOU                │  ',
  '  │                                  │  ',
  '  │                                  │  ',
  '  │  [MED]               [MAIN]     │  ',
  '  └─────────────────────────────────┘  ',
  '',
  '  ★ = CURRENT POSITION',
];

export function PipBoy({ open, screen, onChangeScreen, onClose }: Props) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,8,0,0.85)',
      backdropFilter: 'blur(2px)',
    }}>
      {/* Pip-Boy device */}
      <div style={{
        width: 600, height: 440,
        background: 'linear-gradient(135deg, #1a2a1a 0%, #0d1a0d 60%, #111a11 100%)',
        border: '3px solid #2a4a2a',
        borderRadius: 16,
        boxShadow: '0 0 40px #00ff4422, 0 0 80px #00ff4411, inset 0 0 20px rgba(0,0,0,0.8)',
        position: 'relative',
        padding: 16,
        fontFamily: "'Courier New', monospace",
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #1a3a1a', paddingBottom: 6,
        }}>
          <div style={{ color: '#00ff44', fontSize: 10, letterSpacing: 3 }}>
            ROBCO INDUSTRIES (TM)
          </div>
          <div style={{ color: '#00dd33', fontSize: 18, fontWeight: 'bold', letterSpacing: 4 }}>
            PIP-BOY 3000
          </div>
          <div style={{ color: '#00ff44', fontSize: 10, letterSpacing: 2 }}>
            MARK IV
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4 }}>
          {SCREENS.map(s => (
            <button
              key={s}
              onClick={() => onChangeScreen(s)}
              style={{
                flex: 1,
                padding: '4px 0',
                background: screen === s ? '#00aa33' : '#0a1a0a',
                border: `1px solid ${screen === s ? '#00ff44' : '#1a3a1a'}`,
                borderRadius: 3,
                color: screen === s ? '#000' : '#00aa33',
                fontFamily: 'inherit',
                fontSize: 11,
                fontWeight: 'bold',
                letterSpacing: 1,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Screen area */}
        <div style={{
          flex: 1,
          background: '#001800',
          border: '1px solid #1a3a1a',
          borderRadius: 6,
          padding: 14,
          color: '#00ff44',
          fontSize: 12,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* CRT scanlines */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)',
          }} />

          {screen === 'STAT' && <StatScreen />}
          {screen === 'INV' && <InvScreen />}
          {screen === 'DATA' && <DataScreen />}
          {screen === 'MAP' && <MapScreen />}
          {screen === 'RADIO' && <RadioScreen />}
        </div>

        {/* Close hint */}
        <div style={{
          textAlign: 'center', color: '#00aa33', fontSize: 10, letterSpacing: 2,
        }}>
          [ TAB ] CLOSE PIP-BOY
        </div>

        {/* Decorative screws */}
        {[[-8,-8],[608,-8],[-8,448],[608,448]].map(([x,y],i) => (
          <div key={i} style={{
            position: 'absolute', left: x, top: y,
            width: 12, height: 12, borderRadius: '50%',
            background: '#1a2a1a', border: '1px solid #2a4a2a',
          }} />
        ))}

        {/* Click outside to close */}
        <div
          style={{ position: 'fixed', inset: 0, zIndex: -1 }}
          onClick={onClose}
        />
      </div>
    </div>
  );
}

function StatScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
      <div style={{ fontSize: 14, fontWeight: 'bold', letterSpacing: 3, marginBottom: 4, color: '#00ff66' }}>
        VAULT DWELLER — LVL 1
      </div>
      <div style={{ fontSize: 10, color: '#00aa44', marginBottom: 8 }}>
        XP: 0 / 200 &nbsp;&nbsp; HP: 85/85 &nbsp;&nbsp; RAD: 0
      </div>
      {STAT_BARS.map(({ label, abbr, val }) => (
        <div key={abbr} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <span style={{ width: 16, color: '#00ff44', fontWeight: 'bold' }}>{abbr}</span>
          <span style={{ width: 100, color: '#00cc33', letterSpacing: 1 }}>{label}</span>
          <div style={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{
                width: 14, height: 10,
                background: i < val ? '#00ff44' : '#0a1a0a',
                border: '1px solid #1a3a1a',
                borderRadius: 1,
              }} />
            ))}
          </div>
          <span style={{ color: '#00ff66', fontWeight: 'bold', marginLeft: 4 }}>{val}</span>
        </div>
      ))}
      <div style={{ marginTop: 8, borderTop: '1px solid #1a3a1a', paddingTop: 8, fontSize: 10, color: '#008822' }}>
        SPECIAL POINTS REMAINING: 0 &nbsp;&nbsp; PERKS: NONE
      </div>
    </div>
  );
}

function InvScreen() {
  const items = [
    { name: 'Vault 63 Jumpsuit', wt: 2.0, val: 15, equipped: true },
    { name: 'Pip-Boy 3000 Mark IV', wt: 2.0, val: 0, equipped: true },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 13, fontWeight: 'bold', letterSpacing: 3, marginBottom: 6, color: '#00ff66' }}>
        INVENTORY
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#008822', marginBottom: 4 }}>
        <span>ITEM</span><span>WT &nbsp; VAL</span>
      </div>
      <div style={{ borderTop: '1px solid #1a3a1a', paddingTop: 6 }}>
        <div style={{ color: '#00aa33', fontSize: 10, marginBottom: 6 }}>— EQUIPPED —</div>
        {items.filter(i => i.equipped).map(item => (
          <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
            <span style={{ color: '#00ff44' }}>▶ {item.name}</span>
            <span style={{ color: '#00aa33' }}>{item.wt} &nbsp; {item.val}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #1a3a1a', paddingTop: 8, color: '#008822', fontSize: 10 }}>
        TOTAL WEIGHT: 4.0 / 210 lbs
      </div>
      <div style={{ marginTop: 8, color: '#006611', fontSize: 10, fontStyle: 'italic' }}>
        "You have nothing else. You just woke up."
      </div>
    </div>
  );
}

function DataScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 13, fontWeight: 'bold', letterSpacing: 3, marginBottom: 4, color: '#00ff66' }}>
        DATA / QUESTS
      </div>
      <div style={{ color: '#00aa33', fontSize: 10, marginBottom: 4 }}>ACTIVE QUESTS:</div>
      <div style={{ borderLeft: '2px solid #00ff44', paddingLeft: 8, marginBottom: 8 }}>
        <div style={{ color: '#00ff44', fontSize: 12, fontWeight: 'bold' }}>▶ WAKE UP</div>
        <div style={{ color: '#00aa33', fontSize: 10, marginTop: 2 }}>
          You have emerged from Vault 63 after 210 years of cryogenic sleep.
          Orient yourself. Explore the cryo lab.
        </div>
      </div>
      <div style={{ borderLeft: '2px solid #00aa33', paddingLeft: 8, marginBottom: 8 }}>
        <div style={{ color: '#00aa33', fontSize: 12, fontWeight: 'bold' }}>▶ FIND THE OVERSEER</div>
        <div style={{ color: '#008822', fontSize: 10, marginTop: 2 }}>
          The Overseer appears to have left Vault 63 in 2079.
          Find out what happened and locate the exit.
        </div>
      </div>
      <div style={{ borderTop: '1px solid #1a3a1a', paddingTop: 6 }}>
        <div style={{ color: '#00aa33', fontSize: 10, marginBottom: 4 }}>NOTES:</div>
        <div style={{ color: '#008822', fontSize: 10, lineHeight: 1.5 }}>
          → Cryo system malfunction detected<br/>
          → 210 years elapsed since vault entry<br/>
          → All other pods: CRITICAL FAILURE<br/>
          → Mainframe reports 12% power remaining<br/>
          → Surface elevator located: LEVEL 0
        </div>
      </div>
    </div>
  );
}

function MapScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 'bold', letterSpacing: 3, marginBottom: 4, color: '#00ff66' }}>
        LOCAL MAP — VAULT 63
      </div>
      <div style={{ fontSize: 9, lineHeight: 1.6, color: '#00cc33', fontFamily: 'monospace' }}>
        {MAP_ART.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      <div style={{ color: '#008822', fontSize: 9, marginTop: 4 }}>
        [SEC]=SECURITY [RES]=RESEARCH [MED]=MEDICAL [MAIN]=MAINFRAME
      </div>
    </div>
  );
}

let radioTick = 0;
function RadioScreen() {
  const bars = Array.from({ length: 20 }).map((_, i) => Math.random() > 0.85 ? 1 : 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 'bold', letterSpacing: 3, marginBottom: 4, color: '#00ff66' }}>
        RADIO
      </div>
      <div style={{ color: '#00aa33', fontSize: 12, letterSpacing: 2 }}>SCANNING FOR SIGNAL...</div>
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 30, marginTop: 4 }}>
        {bars.map((b, i) => (
          <div key={i} style={{
            width: 14,
            height: b ? 20 + Math.random() * 10 : 4,
            background: b ? '#00ff44' : '#0a2a0a',
            borderRadius: 1,
            transition: 'height 0.2s',
          }} />
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ color: '#008822', fontSize: 10, lineHeight: 1.8 }}>
          FREQUENCY: --- MHz<br/>
          SIGNAL:    NONE DETECTED<br/>
          STRENGTH:  0%
        </div>
      </div>
      <div style={{ marginTop: 8, color: '#006611', fontSize: 10, borderTop: '1px solid #1a3a1a', paddingTop: 8 }}>
        "Nothing but static out there.<br/>
        &nbsp;The world has gone quiet."
      </div>
    </div>
  );
}

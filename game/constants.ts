export const INTERACT_RADIUS = 4.5;
export const PLAYER_SPEED = 6;
export const ROOM_W = 28;
export const ROOM_H = 6;
export const ROOM_D = 28;
export const ROOM_BOUND = 12.5;

export interface RadZone {
  x: number;
  z: number;
  radius: number;
  maxRads: number;
  label: string;
}

export const RAD_ZONES: RadZone[] = [
  { x: 13,  z: 4,   radius: 6, maxRads: 8, label: 'MAINFRAME COOLANT LEAK' },
  { x: -12, z: -8,  radius: 5, maxRads: 5, label: 'CRYO FLUID CONTAMINATION' },
  { x: 12,  z: -8,  radius: 5, maxRads: 4, label: 'REACTOR BLEED' },
  { x: 0,   z: -13, radius: 3, maxRads: 3, label: 'CRYO TUBE DISCHARGE' },
];

export interface TerminalDef {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
}

export interface Terminal3DDef {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  label: string;
}

export const TERMINALS_3D: Terminal3DDef[] = [
  { id: 'cryo',     position: [0,   1.5, -13],  rotation: [0, 0, 0],             color: '#00aaff', label: 'CRYO SYSTEM CONTROL' },
  { id: 'security', position: [-13, 1.5, -4],   rotation: [0, Math.PI / 2, 0],   color: '#ff4444', label: 'VAULT SECURITY' },
  { id: 'research', position: [13,  1.5, -4],   rotation: [0, -Math.PI / 2, 0],  color: '#44ff44', label: 'RESEARCH TERMINAL B-7' },
  { id: 'medical',  position: [-13, 1.5, 4],    rotation: [0, Math.PI / 2, 0],   color: '#44aaff', label: 'MEDICAL STATION ALPHA' },
  { id: 'mainframe',position: [13,  1.5, 4],    rotation: [0, -Math.PI / 2, 0],  color: '#ffaa00', label: 'MAINFRAME ACCESS' },
];

// Keep for TerminalModal content
export const TERMINALS: TerminalDef[] = [
  { id: 'cryo',     x: 0,   y: 0, label: 'CRYO SYSTEM CONTROL',  color: '#00aaff' },
  { id: 'security', x: 0,   y: 0, label: 'VAULT SECURITY',        color: '#ff4444' },
  { id: 'research', x: 0,   y: 0, label: 'RESEARCH TERMINAL B-7', color: '#44ff44' },
  { id: 'medical',  x: 0,   y: 0, label: 'MEDICAL STATION ALPHA', color: '#44aaff' },
  { id: 'mainframe',x: 0,   y: 0, label: 'MAINFRAME ACCESS',      color: '#ffaa00' },
];

export const TERMINAL_CONTENT: Record<string, { title: string; lines: string[] }> = {
  cryo: {
    title: 'VAULT-TEC CRYOGENIC SYSTEM v4.7.3',
    lines: [
      '> VAULT 63 - CRYO CHAMBER STATUS',
      '  Current Date: 2287.10.23',
      '  Last Maintenance: ERROR - LOG CORRUPTED',
      '',
      '> ACTIVE PODS: 1/12',
      '  POD STATUS: MALFUNCTION - EMERGENCY OVERRIDE',
      '',
      '> SUBJECT: VAULT DWELLER',
      '  Entry Date:    2077.10.23',
      '  Elapsed Time:  210 YEARS 0 DAYS',
      '  Exit Status:   THAWED - MANUAL OVERRIDE',
      '',
      '> SYSTEM MESSAGE:',
      '  All other pods: CRITICAL FAILURE',
      '  Cryo fluid drained. Life signs: NEGATIVE',
      '  Reason for failure: UNKNOWN',
      '',
      '  You are the only one left.',
    ],
  },
  security: {
    title: 'VAULT-TEC UNIFIED SECURITY SYSTEM',
    lines: [
      '> VAULT 63 - SECURITY STATUS REPORT',
      '  Last Security Sweep: ERROR (210 yrs ago)',
      '',
      '> VAULT POPULATION: 1',
      '  Original Population: 117',
      '  Threat Level: UNKNOWN',
      '',
      '> SYSTEM STATUS:',
      '  Camera Systems:   OFFLINE',
      '  Turret Network:   OFFLINE',
      '  Door Locks:       DISENGAGED',
      '  Alarm System:     OFFLINE',
      '',
      '> SECURITY LOG - FINAL ENTRIES:',
      '  2079.03.16 - Disturbance reported in Sector C',
      '  2079.03.20 - VAULT SECURITY OFFLINE',
      '',
      '  Power was rerouted to cryo systems.',
      '  No security updates since 2079.',
    ],
  },
  research: {
    title: 'VAULT-TEC RESEARCH DIVISION - CLASSIFIED',
    lines: [
      '> PROJECT HELIX - CRYOGENIC STUDY',
      '',
      '  Test subjects entered stasis:  117',
      '  Observation target period:     200 years',
      '  Study objective: [CLASSIFIED]',
      '  Current status: STUDY TERMINATED',
      '',
      '> RESEARCHER NOTES:',
      '  "Subject metabolism shows remarkable',
      '   preservation after 50+ year intervals.',
      '   All biometrics nominal pre-freeze."',
      '                       - Dr. Chamberlain',
      '',
      '> FINAL LOG (Dr. Chamberlain, 2079.04.01):',
      '  "The Overseer has left the vault.',
      '   Power failing. I cannot stop it.',
      '   If anyone reads this - I am sorry.',
      '   The project was never what they said."',
    ],
  },
  medical: {
    title: 'VAULT-TEC MEDICAL SYSTEMS - STATION A',
    lines: [
      '> PATIENT DIAGNOSTIC REPORT',
      '  Date: 2287.10.23',
      '',
      '> PATIENT: VAULT DWELLER',
      '  Blood Pressure:     118/72  (NORMAL)',
      '  Heart Rate:          68 bpm (NORMAL)',
      '  Radiation Level:      0 rads (CLEAR)',
      '  Core Temperature:   98.6 °F (NORMAL)',
      '  Cryo Duration:      210 years',
      '',
      '> POST-CRYO ASSESSMENT:',
      '  Muscle atrophy:          MINIMAL',
      '  Cognitive function:      INTACT',
      '  Memory retention:        INTACT',
      '  Temporal disorientation: EXPECTED',
      '',
      '> PHYSICIAN NOTES:',
      '  Standard reorientation protocol advised.',
      '  Estimated recovery time: 24 hours.',
      '  Pip-Boy systems nominal. All vitals clear.',
    ],
  },
  mainframe: {
    title: 'VAULT-TEC MAINFRAME - VAULT 63 CORE',
    lines: [
      '> SYSTEM DIAGNOSTICS',
      '  Power Reserves:         12% *** CRITICAL ***',
      '  Estimated Remaining:    ~15 DAYS',
      '  Core Temp:              ELEVATED',
      '',
      '> VAULT STATUS: COMPROMISED',
      '',
      '> SYSTEM LOG - LAST ENTRIES:',
      '  2079.03.15 - Overseer Withdrawal Logged',
      '  2079.03.16 - Civil unrest: Residential Wing',
      '  2079.03.20 - Power rerouted: Cryo priority',
      '  2079.04.01 - Last survivor logged off',
      '  2079.04.01 - AUTOMATED SYSTEMS ONLY',
      '',
      '  ... No further entries (210 years) ...',
      '',
      '> *** EMERGENCY ALERT ***',
      '  IMMINENT POWER FAILURE DETECTED',
      '  RECOMMENDATION: EVACUATE VAULT 63',
      '  SURFACE ACCESS: ELEVATOR - LEVEL 0',
    ],
  },
};

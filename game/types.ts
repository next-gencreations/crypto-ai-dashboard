export type GamePhase = 'intro' | 'playing' | 'terminal' | 'pipboy';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type PipBoyScreen = 'STAT' | 'INV' | 'DATA' | 'MAP' | 'RADIO';

export interface PlayerPos {
  x: number;
  y: number;
}

export interface GameState {
  phase: GamePhase;
  playerPos: PlayerPos;
  direction: Direction;
  walking: boolean;
  nearbyTerminal: string | null;
  activeTerminal: string | null;
  pipBoyOpen: boolean;
  pipBoyScreen: PipBoyScreen;
  introStep: number;
}

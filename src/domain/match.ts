import { DEFAULT_TIMEOUT_CONFIG, TimeoutConfig } from './timeouts';

export type PlayerId = 'A' | 'B';
export type Pair<T> = Record<PlayerId, T>;
export type BestOf = 1 | 3 | 5 | 7;
export interface Rules {
  target: number;
  bestOf: BestOf;
  decidingSwitch: boolean;
}
export interface Preferences {
  haptics: boolean;
  doubleTapGuard: boolean;
  highContrast: boolean;
  warmupSeconds: number;
  sound: boolean;
}
export interface Settings extends Rules, Preferences, TimeoutConfig {}
export const DEFAULT_SETTINGS: Settings = {
  ...DEFAULT_TIMEOUT_CONFIG,
  target: 11, bestOf: 3, decidingSwitch: true,
  haptics: false, doubleTapGuard: false, highContrast: false,
  warmupSeconds: 120, sound: false,
};
export interface FinishedSet {
  points: Pair<number>;
  winner: PlayerId;
}
export type Pending = 'betweenSets' | 'deciding' | 'manual' | null;
export interface Match {
  rules: Rules;
  points: Pair<number>;
  sets: Pair<number>;
  left: PlayerId;
  firstServer: PlayerId | null;
  completed: FinishedSet[];
  decidingSwitched: boolean;
  pending: Pending;
  winner: PlayerId | null;
}
export interface Session {
  current: Match;
  history: Match[];
}
export type Action =
  | { type: 'selectServer'; player: PlayerId }
  | { type: 'point'; player: PlayerId }
  | { type: 'requestManual' }
  | { type: 'cancelManual' }
  | { type: 'confirmSwitch' }
  | { type: 'undo' };

export const other = (player: PlayerId): PlayerId => player === 'A' ? 'B' : 'A';
export const playerName = (player: PlayerId): string => `Jogador ${player}`;
export const rulesFrom = (settings: Rules): Rules => ({
  target: settings.target, bestOf: settings.bestOf, decidingSwitch: settings.decidingSwitch,
});
export function newSession(settings: Rules = DEFAULT_SETTINGS): Session {
  return {
    current: {
      rules: rulesFrom(settings), points: { A: 0, B: 0 }, sets: { A: 0, B: 0 },
      left: 'A', firstServer: null, completed: [], decidingSwitched: false,
      pending: null, winner: null,
    },
    history: [],
  };
}
export function isDeciding(match: Match): boolean {
  const required = Math.floor(match.rules.bestOf / 2);
  return match.sets.A === required && match.sets.B === required;
}
/** Identity-based service calculation, independent of physical ends. */
export function nextServer(match: Match): PlayerId | null {
  if (!match.firstServer || match.winner) return null;
  if (match.pending === 'betweenSets') return other(match.firstServer);
  const { A, B } = match.points;
  const deuceAt = match.rules.target - 1;
  const turn = A >= deuceAt && B >= deuceAt
    ? deuceAt + (A + B - 2 * deuceAt)
    : Math.floor((A + B) / 2);
  return turn % 2 === 0 ? match.firstServer : other(match.firstServer);
}
function remember(session: Session, current: Match): Session {
  return { current, history: [...session.history, session.current] };
}
export function reduceSession(session: Session, action: Action): Session {
  const match = session.current;
  switch (action.type) {
    case 'undo': {
      // A confirmation belongs to the point that triggered it. Undo restores
      // the complete state before that point, even after changing ends.
      if (match.pending === 'manual') return { ...session, current: { ...match, pending: null } };
      const previous = session.history.at(-1);
      return previous ? { current: previous, history: session.history.slice(0, -1) } : session;
    }
    case 'selectServer':
      if (match.firstServer || match.pending || match.winner) return session;
      return remember(session, { ...match, firstServer: action.player });
    case 'requestManual':
      if (match.pending || match.winner) return session;
      return { ...session, current: { ...match, pending: 'manual' } };
    case 'cancelManual':
      return match.pending === 'manual' ? { ...session, current: { ...match, pending: null } } : session;
    case 'confirmSwitch': {
      if (!match.pending) return session;
      const swapped: Match = { ...match, left: other(match.left), pending: null };
      if (match.pending === 'betweenSets') {
        swapped.points = { A: 0, B: 0 };
        swapped.firstServer = other(match.firstServer!);
        swapped.decidingSwitched = false;
      }
      if (match.pending === 'deciding') swapped.decidingSwitched = true;
      if (match.pending === 'manual') {
        return { current: swapped, history: [...session.history, { ...match, pending: null }] };
      }
      return { ...session, current: swapped };
    }
    case 'point': {
      if (!match.firstServer || match.pending || match.winner) return session;
      const points = { ...match.points, [action.player]: match.points[action.player] + 1 };
      const updated: Match = { ...match, points };
      if (points[action.player] >= match.rules.target && points[action.player] - points[other(action.player)] >= 2) {
        updated.sets = { ...match.sets, [action.player]: match.sets[action.player] + 1 };
        updated.completed = [...match.completed, { points, winner: action.player }];
        if (updated.sets[action.player] > Math.floor(match.rules.bestOf / 2)) updated.winner = action.player;
        else updated.pending = 'betweenSets';
      } else if (isDeciding(match) && match.rules.decidingSwitch && !match.decidingSwitched && Math.max(points.A, points.B) >= 5) {
        updated.pending = 'deciding';
      }
      return remember(session, updated);
    }
  }
}

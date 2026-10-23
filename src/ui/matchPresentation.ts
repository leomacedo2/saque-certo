import type { Match } from '../domain/match';
import type { Timeouts } from '../domain/timeouts';
export const isPreMatch = (match: Match): boolean => !match.firstServer && match.points.A === 0 && match.points.B === 0 && match.completed.length === 0 && !match.winner;
export const promoteTimeoutRestore = (match: Match, timeouts: Timeouts, disabled: boolean): boolean =>
  !!match.firstServer && !match.winner && !match.pending && !disabled && (timeouts.used.A > 0 || timeouts.used.B > 0);

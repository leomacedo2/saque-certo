import type { Match, Pair, PlayerId } from './match';
import { createTimer, pauseTimer, startTimer, TimerState } from './timer';

export interface TimeoutConfig { timeoutSeconds: number; timeoutLimit: number }
export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = { timeoutSeconds: 60, timeoutLimit: 1 };
export type TimeoutWho = PlayerId | 'both';
export interface ActiveTimeout { who: TimeoutWho; timer: TimerState; started: boolean }
export interface Timeouts {
  config: TimeoutConfig;
  used: Pair<number>;
  request: TimeoutWho | null;
  active: ActiveTimeout | null;
  correction: PlayerId | null;
}
export type TimeoutAction =
  | { type: 'request'; who: TimeoutWho }
  | { type: 'cancelRequest' }
  | { type: 'confirmRequest' }
  | { type: 'toggleTimer'; now: number }
  | { type: 'end' }
  | { type: 'cancelBeforeStart' }
  | { type: 'requestRestore'; player: PlayerId }
  | { type: 'cancelRestore' }
  | { type: 'confirmRestore' };
export const timeoutPlayers = (who: TimeoutWho): PlayerId[] => who === 'both' ? ['A', 'B'] : [who];
export const timeoutRemaining = (state: Timeouts, player: PlayerId): number => state.config.timeoutLimit - state.used[player];
export const timeoutBlocksPlay = (state: Timeouts): boolean => !!(state.request || state.active || state.correction);
export const timeoutConfigFrom = (config: TimeoutConfig): TimeoutConfig => ({ timeoutSeconds: config.timeoutSeconds, timeoutLimit: config.timeoutLimit });
export function newTimeouts(config: TimeoutConfig = DEFAULT_TIMEOUT_CONFIG): Timeouts {
  return { config: timeoutConfigFrom(config), used: { A: 0, B: 0 }, request: null, active: null, correction: null };
}
export function canRequestTimeout(state: Timeouts, match: Match, who: TimeoutWho): boolean {
  return !!match.firstServer && !match.pending && !match.winner && !state.active && !state.correction
    && timeoutPlayers(who).every(player => timeoutRemaining(state, player) > 0);
}
export function reduceTimeouts(state: Timeouts, action: TimeoutAction, match: Match): Timeouts {
  switch (action.type) {
    case 'request':
      return canRequestTimeout(state, match, action.who) ? { ...state, request: action.who } : state;
    case 'cancelRequest':
      return state.request ? { ...state, request: null } : state;
    case 'confirmRequest': {
      if (!state.request || !canRequestTimeout(state, match, state.request)) return state;
      const used = { ...state.used };
      timeoutPlayers(state.request).forEach(player => used[player]++);
      return { ...state, used, request: null, active: { who: state.request, timer: createTimer(state.config.timeoutSeconds), started: false } };
    }
    case 'toggleTimer': {
      if (!state.active || !Number.isFinite(action.now) || action.now < 0) return state;
      const timer = state.active.timer.deadline === null
        ? startTimer(state.active.timer, action.now) : pauseTimer(state.active.timer, action.now);
      if (timer === state.active.timer) return state;
      return { ...state, active: { ...state.active, timer, started: true } };
    }
    case 'end':
      return state.active ? { ...state, active: null } : state;
    case 'cancelBeforeStart': {
      if (!state.active || state.active.started) return state;
      const used = { ...state.used };
      timeoutPlayers(state.active.who).forEach(player => used[player]--);
      return { ...state, used, active: null };
    }
    case 'requestRestore':
      if (timeoutBlocksPlay(state) || match.pending || state.used[action.player] <= 0) return state;
      return { ...state, correction: action.player };
    case 'cancelRestore':
      return state.correction ? { ...state, correction: null } : state;
    case 'confirmRestore': {
      if (!state.correction || state.active || state.used[state.correction] <= 0) return state;
      return { ...state, used: { ...state.used, [state.correction]: state.used[state.correction] - 1 }, correction: null };
    }
  }
}

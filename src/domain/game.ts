import { Action, DEFAULT_SETTINGS, newSession, reduceSession, Session, Settings } from './match';
import { newTimeouts, reduceTimeouts, TimeoutAction, timeoutBlocksPlay, Timeouts } from './timeouts';
import { createTimer, pauseTimer, startTimer, TimerState } from './timer';

export type GamePhase = 'awaitingInitialServer' | 'awaitingAthleteServer' | 'awaitingAthleteReceiver' | 'setOrderPrompt' | 'warmupPrompt' | 'warmup' | 'playing' | 'finished';
export interface Preparation { phase: GamePhase; warmup: { seconds: number; timer: TimerState } | null }
export interface GameState extends Preparation { session: Session; timeouts: Timeouts }
export type PreparationAction = { type: 'acceptWarmup'; seconds: number } | { type: 'skipWarmup' } | { type: 'closeWarmup' }
  | { type: 'toggleWarmup'; now: number } | { type: 'restartWarmup' } | { type: 'cancelInitialServer' };
export type GameAction = { kind: 'match'; action: Action } | { kind: 'timeout'; action: TimeoutAction }
  | { kind: 'preparation'; action: PreparationAction };
export function inferPreparation(session: Session): Preparation {
  const match = session.current;
  const phase: GamePhase = match.winner ? 'finished' : !match.firstServer ? 'awaitingInitialServer'
    : match.doubles && !match.doubles.server ? 'awaitingAthleteServer'
      : match.doubles && !match.doubles.receiver ? 'awaitingAthleteReceiver'
        : match.doubles && !match.doubles.confirmed ? 'setOrderPrompt' : 'playing';
  return { phase, warmup: null };
}
export function newGame(settings: Settings = DEFAULT_SETTINGS): GameState {
  return { session: newSession(settings), timeouts: newTimeouts(settings), phase: 'awaitingInitialServer', warmup: null };
}
/** Timeout corrections never enter the point snapshots used by Undo. */
export function reduceGame(game: GameState, action: GameAction): GameState {
  if (action.kind === 'preparation') {
    const step = action.action;
    if (step.type === 'cancelInitialServer' && game.phase === 'warmupPrompt') {
      const session = reduceSession(game.session, { type: 'undo' });
      return { ...game, session, ...inferPreparation(session) };
    }
    if (game.phase === 'warmupPrompt') {
      if (step.type === 'skipWarmup') return { ...game, phase: 'playing' };
      if (step.type === 'acceptWarmup' && Number.isInteger(step.seconds) && step.seconds >= 10 && step.seconds <= 3600)
        return { ...game, phase: 'warmup', warmup: { seconds: step.seconds, timer: createTimer(step.seconds) } };
    }
    if (game.phase === 'warmup' && game.warmup) {
      if (step.type === 'closeWarmup') return { ...game, phase: 'playing', warmup: null };
      if (step.type === 'restartWarmup') return { ...game, warmup: { ...game.warmup, timer: createTimer(game.warmup.seconds) } };
      if (step.type === 'toggleWarmup') {
        const timer = game.warmup.timer;
        return { ...game, warmup: { ...game.warmup, timer: timer.deadline === null ? startTimer(timer, step.now) : pauseTimer(timer, step.now) } };
      }
    }
    return game;
  }
  if (action.kind === 'match') {
    if (timeoutBlocksPlay(game.timeouts) || game.phase === 'warmup') return game;
    if (game.phase === 'warmupPrompt' && action.action.type !== 'undo') return game;
    if (action.action.type === 'point' && game.phase !== 'playing') return game;
    if (action.action.type === 'requestManual' && game.phase !== 'playing' && game.phase !== 'awaitingInitialServer') return game;
    const session = reduceSession(game.session, action.action);
    if (session === game.session) return game;
    const needsWarmup = action.action.type === 'selectAthleteReceiver' || (action.action.type === 'selectServer' && !session.current.doubles);
    const preparation = needsWarmup ? { phase: 'warmupPrompt' as const, warmup: null } : inferPreparation(session);
    return { ...game, session, ...preparation };
  }
  if (game.phase !== 'playing' && game.phase !== 'finished') return game;
  const timeouts = reduceTimeouts(game.timeouts, action.action, game.session.current);
  return timeouts === game.timeouts ? game : { ...game, timeouts };
}

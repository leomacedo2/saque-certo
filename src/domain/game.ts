import { Action, DEFAULT_SETTINGS, newSession, reduceSession, Session, Settings } from './match';
import { newTimeouts, reduceTimeouts, TimeoutAction, timeoutBlocksPlay, Timeouts } from './timeouts';

export interface GameState { session: Session; timeouts: Timeouts }
export type GameAction = { kind: 'match'; action: Action } | { kind: 'timeout'; action: TimeoutAction };
export function newGame(settings: Settings = DEFAULT_SETTINGS): GameState {
  return { session: newSession(settings), timeouts: newTimeouts(settings) };
}
/** Timeout corrections never enter the point snapshots used by Undo. */
export function reduceGame(game: GameState, action: GameAction): GameState {
  if (action.kind === 'match') {
    if (timeoutBlocksPlay(game.timeouts)) return game;
    const session = reduceSession(game.session, action.action);
    return session === game.session ? game : { ...game, session };
  }
  const timeouts = reduceTimeouts(game.timeouts, action.action, game.session.current);
  return timeouts === game.timeouts ? game : { ...game, timeouts };
}

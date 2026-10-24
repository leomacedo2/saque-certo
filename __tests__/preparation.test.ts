import { GameState, newGame, PreparationAction, reduceGame } from '../src/domain/game';
import { Action, BestOf, DEFAULT_SETTINGS, nextServer, PlayerId } from '../src/domain/match';
import { remainingTime } from '../src/domain/timer';
import { decodeGame, encodeGame } from '../src/storage/codec';

const match = (game: GameState, action: Action) => reduceGame(game, { kind: 'match', action });
const prepare = (game: GameState, action: PreparationAction) => reduceGame(game, { kind: 'preparation', action });
const chosen = (player: PlayerId = 'A') => match(newGame(), { type: 'selectServer', player });
const saved = (game: GameState) => decodeGame(encodeGame(DEFAULT_SETTINGS, game.session, game.timeouts, game));

test.each(['A', 'B'] as const)('escolha de %s abre pergunta sem ponto, set ou consumo', player => {
  const game = chosen(player);
  expect(newGame().phase).toBe('awaitingInitialServer');
  expect(game.phase).toBe('warmupPrompt');
  expect(game.session.current.points).toEqual({ A: 0, B: 0 });
  expect(game.session.current.sets).toEqual({ A: 0, B: 0 });
  expect(game.timeouts.used).toEqual({ A: 0, B: 0 });
  expect(nextServer(game.session.current)).toBe(player);
  expect(saved(game).phase).toBe('warmupPrompt');
});

test('negar aquecimento libera pontos e tempos, sem mudar o sacador', () => {
  const initial = chosen('B');
  const game = prepare(initial, { type: 'skipWarmup' });
  expect(game.phase).toBe('playing');
  expect(game.session).toBe(initial.session);
  expect(game.timeouts).toBe(initial.timeouts);
  expect(match(game, { type: 'point', player: 'A' }).session.current.points.A).toBe(1);
  expect(reduceGame(game, { kind: 'timeout', action: { type: 'request', who: 'B' } }).timeouts.request).toBe('B');
});

test('aquecimento usa duração configurada e abre parado, com controles e recuperação', () => {
  let game = prepare(chosen('B'), { type: 'acceptWarmup', seconds: 135 });
  expect(game.phase).toBe('warmup');
  expect(game.warmup).toEqual({ seconds: 135, timer: { remainingMs: 135000, deadline: null } });
  expect(saved(game).warmup).toEqual(game.warmup);
  game = prepare(game, { type: 'toggleWarmup', now: 1000 });
  expect(remainingTime(saved(game).warmup!.timer, 36000)).toBe(100000);
  game = prepare(game, { type: 'toggleWarmup', now: 36000 });
  expect(saved(game).warmup!.timer).toEqual({ remainingMs: 100000, deadline: null });
  game = prepare(game, { type: 'toggleWarmup', now: 200000 });
  expect(remainingTime(saved(game).warmup!.timer, 900000)).toBe(0);
  game = prepare(game, { type: 'restartWarmup' });
  expect(game.warmup!.timer).toEqual({ remainingMs: 135000, deadline: null });
  const session = game.session;
  game = prepare(game, { type: 'closeWarmup' });
  expect(game.phase).toBe('playing');
  expect(game.warmup).toBeNull();
  expect(game.session).toBe(session);
  expect(nextServer(game.session.current)).toBe('B');
});

test.each(['awaitingInitialServer', 'warmupPrompt', 'warmup'])('bloqueia pontos e pedidos na fase %s', phase => {
  const game = phase === 'awaitingInitialServer' ? newGame() : phase === 'warmupPrompt' ? chosen() : prepare(chosen(), { type: 'acceptWarmup', seconds: 120 });
  expect(match(game, { type: 'point', player: 'A' })).toBe(game);
  expect(reduceGame(game, { kind: 'timeout', action: { type: 'request', who: 'A' } })).toBe(game);
  expect(reduceGame(game, { kind: 'timeout', action: { type: 'confirmRequest' } })).toBe(game);
});

test.each(['undo', 'cancelInitialServer', 'afterWarmup', 'afterSkip'])('corrige escolha pelo caminho %s e pergunta novamente', route => {
  let game = chosen('A');
  if (route === 'afterWarmup') {
    game = prepare(game, { type: 'acceptWarmup', seconds: 120 });
    expect(match(game, { type: 'undo' })).toBe(game);
    expect(prepare(game, { type: 'cancelInitialServer' })).toBe(game);
    game = prepare(game, { type: 'closeWarmup' });
  }
  if (route === 'afterSkip') game = prepare(game, { type: 'skipWarmup' });
  game = route === 'cancelInitialServer' ? prepare(game, { type: 'cancelInitialServer' }) : match(game, { type: 'undo' });
  expect(game.phase).toBe('awaitingInitialServer');
  expect(game.session.current.firstServer).toBeNull();
  expect(game.session.current.sets).toEqual({ A: 0, B: 0 });
  game = match(game, { type: 'selectServer', player: 'B' });
  expect(game.phase).toBe('warmupPrompt');
  expect(nextServer(game.session.current)).toBe('B');
});

test('desfazer ponto restaura jogada e não reabre pergunta; escolha continua corrigível depois', () => {
  let game = prepare(chosen(), { type: 'skipWarmup' });
  const initial = game;
  game = match(game, { type: 'point', player: 'B' });
  game = match(game, { type: 'undo' });
  expect(game).toEqual(initial);
  expect(game.phase).toBe('playing');
  game = match(game, { type: 'undo' });
  expect(game.phase).toBe('awaitingInitialServer');
});

test.each([1, 3, 5, 7] as BestOf[])('resultados preservam identidade, cronologia e correção em melhor de %i', bestOf => {
  let game = newGame({ ...DEFAULT_SETTINGS, bestOf });
  game = match(game, { type: 'selectServer', player: 'B' });
  game = prepare(game, { type: 'skipWarmup' });
  const winners: PlayerId[] = Array.from({ length: bestOf }, (_, index) => index % 2 === 0 ? 'B' : 'A');
  const results: { A: number; B: number }[] = [];
  for (const winner of winners) {
    for (let point = 0; point < 11; point++) {
      game = match(game, { type: 'point', player: winner });
      if (game.session.current.pending === 'deciding') game = match(game, { type: 'confirmSwitch' });
    }
    results.push(winner === 'A' ? { A: 11, B: 0 } : { A: 0, B: 11 });
    if (game.session.current.pending === 'betweenSets') {
      game = match(game, { type: 'confirmSwitch' });
      expect(game.phase).toBe('playing');
      expect(game.session.current.points).toEqual({ A: 0, B: 0 });
    }
  }
  expect(game.phase).toBe('finished');
  expect(game.session.current.winner).toBe('B');
  expect(game.session.current.completed.map(set => set.points)).toEqual(results);
  expect(saved(game).session).toEqual(game.session);
  expect(saved(game).phase).toBe('finished');
  game = match(game, { type: 'undo' });
  expect(game.phase).toBe('playing');
  expect(game.session.current.completed.map(set => set.points)).toEqual(results.slice(0, -1));
  expect(game.session.current.points.B).toBe(10);
});

test.each(['awaitingInitialServer', 'playing', 'finished'])('migra schema 3 sem forçar aquecimento: %s', phase => {
  let game = phase === 'awaitingInitialServer' ? newGame() : prepare(chosen(), { type: 'skipWarmup' });
  if (phase === 'finished') {
    game = newGame({ ...DEFAULT_SETTINGS, bestOf: 1, decidingSwitch: false });
    game = prepare(match(game, { type: 'selectServer', player: 'A' }), { type: 'skipWarmup' });
    for (let i = 0; i < 11; i++) game = match(game, { type: 'point', player: 'A' });
  }
  const data = { schema: 3, settings: DEFAULT_SETTINGS, session: game.session, timeouts: game.timeouts };
  const loaded = decodeGame(JSON.stringify(data));
  expect(loaded.phase).toBe(phase);
  expect(loaded.session).toEqual(game.session);
});

test.each([
  { phase: 'bad', warmup: null }, { phase: 'playing', warmup: {} }, { phase: 'warmup', warmup: null },
  { phase: 'warmup', warmup: { seconds: 120, timer: { remainingMs: 120001, deadline: null } } },
  { phase: 'warmup', warmup: { seconds: 120, timer: { remainingMs: 100, deadline: -1 } } },
])('rejeita preparação inconsistente: %j', preparation => {
  const data = JSON.parse(encodeGame(DEFAULT_SETTINGS, chosen().session));
  expect(() => decodeGame(JSON.stringify({ ...data, ...preparation }))).toThrow();
});

test('rejeita prompt com pontos; mantém cores e tempos anteriores ao corrigir sacador', () => {
  let game = prepare(chosen(), { type: 'skipWarmup' });
  game = match(game, { type: 'point', player: 'B' });
  const data = JSON.parse(encodeGame(DEFAULT_SETTINGS, game.session, game.timeouts, game));
  expect(() => decodeGame(JSON.stringify({ ...data, phase: 'warmupPrompt' }))).toThrow();
  game = match(game, { type: 'undo' });
  game = reduceGame(game, { kind: 'timeout', action: { type: 'request', who: 'A' } });
  game = reduceGame(game, { kind: 'timeout', action: { type: 'confirmRequest' } });
  game = reduceGame(game, { kind: 'timeout', action: { type: 'end' } });
  game = match(game, { type: 'undo' });
  game = match(game, { type: 'selectServer', player: 'B' });
  const settings = { ...DEFAULT_SETTINGS, colors: { A: 'green', B: 'purple' } as const };
  const loaded = decodeGame(encodeGame(settings, game.session, game.timeouts, game));
  expect(loaded.settings.colors).toEqual(settings.colors);
  expect(loaded.timeouts.used.A).toBe(1);
  expect(loaded.phase).toBe('warmupPrompt');
});

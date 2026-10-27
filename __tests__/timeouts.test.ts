import { GameState, newGame, reduceGame } from '../src/domain/game';
import { Action, DEFAULT_SETTINGS, nextServer } from '../src/domain/match';
import { createTimer, remainingTime } from '../src/domain/timer';
import { TimeoutAction, timeoutRemaining } from '../src/domain/timeouts';
import { decodeGame, encodeGame } from '../src/storage/codec';

const timeout = (game: GameState, action: TimeoutAction) => reduceGame(game, { kind: 'timeout', action });
const match = (game: GameState, action: Action) => reduceGame(game, { kind: 'match', action });
const started = (overrides = {}) => reduceGame(match(newGame({ ...DEFAULT_SETTINGS, ...overrides }), { type: 'selectServer', player: 'A' }), { kind: 'preparation', action: { type: 'skipWarmup' } });
const accepted = (game = started(), who: 'A' | 'B' | 'both' = 'A') => timeout(timeout(game, { type: 'request', who }), { type: 'confirmRequest' });
const roundtrip = (game: GameState) => {
  const saved = decodeGame(encodeGame(DEFAULT_SETTINGS, game.session, game.timeouts, game));
  return { session: saved.session, timeouts: saved.timeouts, phase: saved.phase, warmup: saved.warmup };
};

describe('pedido e consumo de tempo técnico', () => {
  test('nova partida tem 60 segundos e um tempo individual, sem alterar o placar', () => {
    const game = newGame();
    expect(game.timeouts.config).toEqual({ timeoutSeconds: 60, timeoutLimit: 1 });
    expect(game.timeouts.used).toEqual({ A: 0, B: 0 });
    expect(timeoutRemaining(game.timeouts, 'A')).toBe(1);
    expect(timeoutRemaining(game.timeouts, 'B')).toBe(1);
    expect(timeout(game, { type: 'request', who: 'A' })).toBe(game);
  });
  test('primeiro toque só pede confirmação; cancelar não consome nada', () => {
    const initial = started();
    const request = timeout(initial, { type: 'request', who: 'A' });
    expect(request.timeouts.request).toBe('A');
    expect(request.timeouts.used).toEqual({ A: 0, B: 0 });
    expect(request.timeouts.active).toBeNull();
    expect(timeout(request, { type: 'cancelRequest' })).toEqual(initial);
    expect(timeout(initial, { type: 'confirmRequest' })).toBe(initial);
  });
  test('confirmação consome só A, preserva pontos, saque, lados, sets e histórico', () => {
    let game = started();
    game = match(game, { type: 'point', player: 'B' });
    const previous = game;
    game = accepted(game);
    expect(game.session).toBe(previous.session);
    expect(nextServer(game.session.current)).toBe(nextServer(previous.session.current));
    expect(game.timeouts.used).toEqual({ A: 1, B: 0 });
    expect(game.timeouts.active).toEqual({ who: 'A', started: false, timer: createTimer(60) });
    expect(timeout(game, { type: 'confirmRequest' })).toBe(game);
    expect(timeout(game, { type: 'request', who: 'B' })).toBe(game);
  });
  test('tempo parado inicialmente, iniciar, pausar e continuar usam tempo real', () => {
    let game = accepted();
    expect(game.timeouts.active!.timer.deadline).toBeNull();
    game = timeout(game, { type: 'toggleTimer', now: 1000 });
    expect(game.timeouts.active!.started).toBe(true);
    expect(game.timeouts.active!.timer.deadline).toBe(61000);
    expect(remainingTime(game.timeouts.active!.timer, 21000)).toBe(40000);
    game = timeout(game, { type: 'toggleTimer', now: 21000 });
    expect(game.timeouts.active!.timer).toEqual({ remainingMs: 40000, deadline: null });
    game = timeout(game, { type: 'toggleTimer', now: 100000 });
    expect(remainingTime(game.timeouts.active!.timer, 120000)).toBe(20000);
  });
  test.each([false, true])('encerrar antecipadamente mantém o consumo (iniciado=%s)', running => {
    let game = accepted();
    if (running) game = timeout(game, { type: 'toggleTimer', now: 1000 });
    const session = game.session;
    game = timeout(game, { type: 'end' });
    expect(game.timeouts.active).toBeNull();
    expect(game.timeouts.used.A).toBe(1);
    expect(game.session).toBe(session);
    expect(timeout(game, { type: 'request', who: 'A' })).toBe(game);
    expect(timeout(game, { type: 'end' })).toBe(game);
  });
  test('antes de iniciar é possível cancelar e devolver; depois de iniciar não', () => {
    const initial = started();
    expect(timeout(accepted(initial), { type: 'cancelBeforeStart' })).toEqual(initial);
    let game = timeout(accepted(initial), { type: 'toggleTimer', now: 0 });
    game = timeout(game, { type: 'toggleTimer', now: 100 });
    expect(timeout(game, { type: 'cancelBeforeStart' })).toBe(game);
    expect(game.timeouts.used.A).toBe(1);
  });
  test('zero é limitado e mantém encerramento pendente até ação explícita', () => {
    let game = timeout(accepted(), { type: 'toggleTimer', now: 1000 });
    game = roundtrip(game);
    expect(remainingTime(game.timeouts.active!.timer, 61000)).toBe(0);
    expect(remainingTime(game.timeouts.active!.timer, 999000)).toBe(0);
    expect(game.timeouts.active).not.toBeNull();
    const session = game.session;
    game = timeout(game, { type: 'end' });
    expect(game.session).toBe(session);
    expect(game.timeouts.used.A).toBe(1);
  });
  test('bloqueia pontos, desfazer e trocas durante confirmação e cronômetro', () => {
    const request = timeout(started(), { type: 'request', who: 'A' });
    const active = timeout(request, { type: 'confirmRequest' });
    for (const game of [request, active]) {
      for (const action of [{ type: 'point', player: 'A' }, { type: 'undo' }, { type: 'requestManual' }] as Action[]) {
        expect(match(game, action)).toBe(game);
      }
    }
  });
  test('bloqueia pedidos durante trocas e depois da vitória', () => {
    let game = started();
    const manual = match(game, { type: 'requestManual' });
    expect(timeout(manual, { type: 'request', who: 'A' })).toBe(manual);
    for (let i = 0; i < 11; i++) game = match(game, { type: 'point', player: 'A' });
    expect(game.session.current.pending).toBe('betweenSets');
    expect(timeout(game, { type: 'request', who: 'B' })).toBe(game);
    game = match(game, { type: 'confirmSwitch' });
    for (let i = 0; i < 11; i++) game = match(game, { type: 'point', player: 'A' });
    expect(game.session.current.winner).toBe('A');
    expect(timeout(game, { type: 'request', who: 'B' })).toBe(game);
  });
  test('bloqueia pedido no aviso obrigatório do set decisivo', () => {
    let game = started();
    for (const player of ['A', 'B'] as const) {
      for (let i = 0; i < 11; i++) game = match(game, { type: 'point', player });
      game = match(game, { type: 'confirmSwitch' });
    }
    for (let i = 0; i < 5; i++) game = match(game, { type: 'point', player: 'A' });
    expect(game.session.current.pending).toBe('deciding');
    expect(timeout(game, { type: 'request', who: 'both' })).toBe(game);
  });
});
describe('direitos durante toda a partida', () => {
  test('troca e próximo set não renovam nem transferem o tempo de A', () => {
    let game = timeout(accepted(), { type: 'end' });
    for (let i = 0; i < 11; i++) game = match(game, { type: 'point', player: 'A' });
    game = match(game, { type: 'confirmSwitch' });
    expect(game.session.current.left).toBe('B');
    expect(game.session.current.sets.A).toBe(1);
    expect(timeoutRemaining(game.timeouts, 'A')).toBe(0);
    expect(timeoutRemaining(game.timeouts, 'B')).toBe(1);
    expect(timeout(game, { type: 'request', who: 'A' })).toBe(game);
    expect(accepted(game, 'B').timeouts.used).toEqual({ A: 1, B: 1 });
  });
  test('desfazer ponto não devolve tempo nem desfaz correção', () => {
    let game = match(started(), { type: 'point', player: 'A' });
    game = timeout(accepted(game), { type: 'end' });
    game = match(game, { type: 'undo' });
    expect(game.session.current.points.A).toBe(0);
    expect(game.timeouts.used.A).toBe(1);
    game = timeout(timeout(game, { type: 'requestRestore', player: 'A' }), { type: 'confirmRestore' });
    game = match(game, { type: 'undo' });
    expect(game.timeouts.used.A).toBe(0);
  });
  test.each([2, 3])('quantidade personalizada %i não permite ultrapassar o limite', limit => {
    let game = started({ timeoutLimit: limit, timeoutSeconds: 30 });
    for (let i = 0; i < limit; i++) {
      game = accepted(game);
      expect(game.timeouts.active!.timer.remainingMs).toBe(30000);
      game = timeout(game, { type: 'end' });
      expect(timeoutRemaining(game.timeouts, 'A')).toBe(limit - i - 1);
    }
    expect(timeout(game, { type: 'request', who: 'A' })).toBe(game);
    expect(timeoutRemaining(game.timeouts, 'B')).toBe(limit);
  });
  test('configuração zero desativa pedidos de ambos', () => {
    const game = started({ timeoutLimit: 0 });
    for (const who of ['A', 'B', 'both'] as const) expect(timeout(game, { type: 'request', who })).toBe(game);
  });
  test('configuração nova só entra em nova partida, que restaura os direitos', () => {
    const game = timeout(accepted(), { type: 'end' });
    const settings = { ...DEFAULT_SETTINGS, timeoutLimit: 3, timeoutSeconds: 180 };
    expect(game.timeouts.config).toEqual({ timeoutSeconds: 60, timeoutLimit: 1 });
    const next = newGame(settings);
    expect(next.timeouts.config).toEqual({ timeoutSeconds: 180, timeoutLimit: 3 });
    expect(next.timeouts.used).toEqual({ A: 0, B: 0 });
    expect(next.session.history).toEqual([]);
  });
  test('simultâneo consome um de cada e abre apenas um cronômetro', () => {
    const game = accepted(started(), 'both');
    expect(game.timeouts.used).toEqual({ A: 1, B: 1 });
    expect(game.timeouts.active).toEqual({ who: 'both', timer: createTimer(60), started: false });
    expect(timeout(game, { type: 'confirmRequest' })).toBe(game);
    const ended = timeout(game, { type: 'end' });
    expect(timeout(ended, { type: 'request', who: 'both' })).toBe(ended);
  });
  test('pedido conjunto exige direito de ambos; cancelamento antes de iniciar devolve ambos', () => {
    const original = started({ timeoutLimit: 3 });
    expect(timeout(accepted(original, 'both'), { type: 'cancelBeforeStart' })).toEqual(original);
    const singleUsed = timeout(accepted(), { type: 'end' });
    expect(timeout(singleUsed, { type: 'request', who: 'both' })).toBe(singleUsed);
  });
  test('restauração exige confirmação e nunca ultrapassa o limite', () => {
    const used = timeout(accepted(), { type: 'end' });
    const prompt = timeout(used, { type: 'requestRestore', player: 'A' });
    expect(prompt.timeouts.used.A).toBe(1);
    expect(match(prompt, { type: 'point', player: 'B' })).toBe(prompt);
    expect(timeout(prompt, { type: 'cancelRestore' })).toEqual(used);
    const restored = timeout(prompt, { type: 'confirmRestore' });
    expect(restored.timeouts.used.A).toBe(0);
    expect(restored.session).toBe(used.session);
    expect(timeout(restored, { type: 'confirmRestore' })).toBe(restored);
    expect(timeout(restored, { type: 'requestRestore', player: 'A' })).toBe(restored);
  });
});
describe('persistência e compatibilidade', () => {
  test('retomada de confirmação não consome até confirmar e confirmação repetida não duplica', () => {
    const pending = roundtrip(timeout(started(), { type: 'request', who: 'both' }));
    expect(pending.timeouts.used).toEqual({ A: 0, B: 0 });
    const game = roundtrip(timeout(pending, { type: 'confirmRequest' }));
    expect(game.timeouts.used).toEqual({ A: 1, B: 1 });
    expect(timeout(game, { type: 'confirmRequest' })).toBe(game);
  });
  test('retomada de cronômetro parado, rodando, pausado e vencido é coerente', () => {
    let game = roundtrip(accepted());
    expect(game.timeouts.active!.timer).toEqual(createTimer(60));
    game = roundtrip(timeout(game, { type: 'toggleTimer', now: 1000 }));
    expect(remainingTime(game.timeouts.active!.timer, 31000)).toBe(30000);
    game = roundtrip(timeout(game, { type: 'toggleTimer', now: 31000 }));
    expect(remainingTime(game.timeouts.active!.timer, 999000)).toBe(30000);
    game = roundtrip(timeout(game, { type: 'toggleTimer', now: 1000000 }));
    expect(remainingTime(game.timeouts.active!.timer, 2000000)).toBe(0);
    expect(game.timeouts.used.A).toBe(1);
    expect(game.timeouts.active).not.toBeNull();
  });
  test('recupera correção pendente sem restaurar antecipadamente', () => {
    const game = roundtrip(timeout(timeout(accepted(), { type: 'end' }), { type: 'requestRestore', player: 'A' }));
    expect(game.timeouts.correction).toBe('A');
    expect(game.timeouts.used.A).toBe(1);
    expect(timeout(game, { type: 'confirmRestore' }).timeouts.used.A).toBe(0);
  });
  test('migra schema 1 sem perder partida ou histórico', () => {
    const original = match(started(), { type: 'point', player: 'B' });
    const { timeoutLimit: _limit, timeoutSeconds: _seconds, ...oldSettings } = DEFAULT_SETTINGS;
    const saved = decodeGame(JSON.stringify({ schema: 1, settings: oldSettings, session: original.session }));
    expect(saved.schema).toBe(5);
    expect(saved.session).toEqual(original.session);
    expect(saved.settings.timeoutLimit).toBe(1);
    expect(saved.timeouts.used).toEqual({ A: 0, B: 0 });
  });
  test.each(['usedNegative', 'usedAboveLimit', 'missingDebit', 'badTimer', 'badStarted', 'twoPending', 'badConfig'])('rejeita estado salvo inconsistente: %s', scenario => {
    const game = accepted();
    const data = JSON.parse(encodeGame(DEFAULT_SETTINGS, game.session, game.timeouts));
    switch (scenario) {
      case 'usedNegative': data.timeouts.used.A = -1; break;
      case 'usedAboveLimit': data.timeouts.used.A = 2; break;
      case 'missingDebit': data.timeouts.used.A = 0; break;
      case 'badTimer': data.timeouts.active.timer.remainingMs = 61000; break;
      case 'badStarted': data.timeouts.active.timer.deadline = 10000; break;
      case 'twoPending': data.timeouts.request = 'B'; break;
      case 'badConfig': data.timeouts.config.timeoutSeconds = 0; break;
    }
    expect(() => decodeGame(JSON.stringify(data))).toThrow();
  });
  test.each([1, 30, 60, 120, 180, 3599, 3600])('duração válida %i persiste com preferências e limites', seconds => {
    const settings = { ...DEFAULT_SETTINGS, timeoutSeconds: seconds, timeoutLimit: 3 };
    const game = newGame(settings);
    const data = decodeGame(encodeGame(settings, game.session, game.timeouts));
    expect(data.settings).toEqual(settings);
    expect(data.timeouts.config.timeoutSeconds).toBe(seconds);
  });
  test('aquecimento independente não altera estado do tempo técnico ou da partida', () => {
    const game = timeout(accepted(), { type: 'end' });
    const snapshot = JSON.stringify(game);
    const warmup = createTimer(120);
    expect(remainingTime(warmup, 900000)).toBe(120000);
    expect(JSON.stringify(game)).toBe(snapshot);
  });
});

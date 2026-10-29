import { ATHLETES, AthleteId, advanceOrder, athletesOf, doublesService, partner, receiverForNextSet, serviceTurn, teamOf } from '../src/domain/doubles';
import { GameState, newGame, reduceGame } from '../src/domain/game';
import { Action, BestOf, DEFAULT_SETTINGS, nextServer, PlayerId } from '../src/domain/match';
import { changeAthleteColor, DEFAULT_ATHLETE_COLORS, teamHexColors, validAthleteColors } from '../src/domain/colors';
import { decodeGame, encodeGame } from '../src/storage/codec';

const settings = { ...DEFAULT_SETTINGS, mode: 'doubles' as const };
const act = (game: GameState, action: Action) => reduceGame(game, { kind: 'match', action });
const skip = (game: GameState) => reduceGame(game, { kind: 'preparation', action: { type: 'skipWarmup' } });
const save = (game: GameState) => decodeGame(encodeGame(settings, game.session, game.timeouts, game));
function start(server: AthleteId = 'A1', receiver: AthleteId = 'B1', overrides = {}): GameState {
  let game = newGame({ ...settings, ...overrides });
  game = act(game, { type: 'selectServer', player: teamOf(server) });
  game = act(game, { type: 'selectAthleteServer', athlete: server });
  game = act(game, { type: 'selectAthleteReceiver', athlete: receiver });
  return skip(game);
}
function points(game: GameState, count: number, player: PlayerId): GameState {
  for (let i = 0; i < count; i++) game = act(game, { type: 'point', player });
  return game;
}
const combinations = ATHLETES.flatMap(server => athletesOf(teamOf(server) === 'A' ? 'B' : 'A').map(receiver => ({ server, receiver })));
function decidingStart(server: AthleteId = 'A1', receiver: AthleteId = 'B1', overrides = {}): GameState {
  let game = start(server, receiver, { bestOf: 3, ...overrides });
  for (const winner of ['A', 'B'] as const) {
    game = points(game, 11, winner);
    game = act(game, { type: 'confirmSwitch' });
    game = act(game, { type: 'selectAthleteServer', athlete: teamOf(server) === game.session.current.firstServer ? server : receiver });
    game = act(game, { type: 'confirmSetOrder' });
  }
  return game;
}

test('preparação separa dupla, atleta sacador e atleta recebedor, sem pontos/tempos', () => {
  let game = newGame(settings);
  expect(game.phase).toBe('awaitingInitialServer');
  expect(game.session.current.mode).toBe('doubles');
  game = act(game, { type: 'selectServer', player: 'B' });
  expect(game.phase).toBe('awaitingAthleteServer');
  expect(act(game, { type: 'selectAthleteServer', athlete: 'A1' })).toBe(game);
  game = act(game, { type: 'selectAthleteServer', athlete: 'B2' });
  expect(game.phase).toBe('awaitingAthleteReceiver');
  expect(act(game, { type: 'selectAthleteReceiver', athlete: 'B1' })).toBe(game);
  game = act(game, { type: 'selectAthleteReceiver', athlete: 'A2' });
  expect(game.phase).toBe('warmupPrompt');
  expect(doublesService(game.session.current)).toEqual({ server: 'B2', receiver: 'A2' });
  expect(game.session.current.points).toEqual({ A: 0, B: 0 });
  expect(game.session.current.sets).toEqual({ A: 0, B: 0 });
  expect(game.timeouts.used).toEqual({ A: 0, B: 0 });
});

test('desfazer percorre preparação e mantém configurações/cores', () => {
  let game = start();
  game = act(game, { type: 'undo' });
  expect(game.phase).toBe('awaitingAthleteReceiver');
  game = act(game, { type: 'undo' });
  expect(game.phase).toBe('awaitingAthleteServer');
  game = act(game, { type: 'undo' });
  expect(game.phase).toBe('awaitingInitialServer');
  expect(game.session.current.firstServer).toBeNull();
  expect(game.timeouts.used).toEqual({ A: 0, B: 0 });
});

test('ciclo regulamentar completo A1/B1, B1/A2, A2/B2, B2/A1 e repetição', () => {
  let game = start();
  const expected = [{ server: 'A1', receiver: 'B1' }, { server: 'B1', receiver: 'A2' }, { server: 'A2', receiver: 'B2' }, { server: 'B2', receiver: 'A1' }, { server: 'A1', receiver: 'B1' }];
  for (const order of expected) {
    expect(doublesService(game.session.current)).toEqual(order);
    game = act(game, { type: 'point', player: 'A' });
    expect(doublesService(game.session.current)).toEqual(order);
    game = act(game, { type: 'point', player: 'B' });
  }
});

test.each(combinations)('propriedade do ciclo e deuce para $server/$receiver', initial => {
  let game = start(initial.server, initial.receiver, { decidingSwitch: false });
  for (let total = 0; total <= 80; total++) {
    const turn = total < 20 ? Math.floor(total / 2) : 10 + total - 20;
    const expected = advanceOrder(initial, turn);
    expect(doublesService(game.session.current)).toEqual(expected);
    expect(nextServer(game.session.current)).toBe(teamOf(expected.server));
    expect(teamOf(expected.server)).not.toBe(teamOf(expected.receiver));
    if (total % 7 === 0) expect(save(game).session).toEqual(game.session);
    game = act(game, { type: 'point', player: total % 2 === 0 ? 'A' : 'B' });
  }
});

test.each(['B1', 'B2'] as const)('segundo set escolhe %s e deriva recebedor obrigatório', athlete => {
  let game = points(start(), 11, 'A');
  expect(game.session.current.pending).toBe('betweenSets');
  game = act(game, { type: 'confirmSwitch' });
  expect(game.session.current.left).toBe('B');
  expect(game.session.current.firstServer).toBe('B');
  expect(game.phase).toBe('awaitingAthleteServer');
  expect(act(game, { type: 'point', player: 'B' })).toBe(game);
  expect(act(game, { type: 'selectAthleteServer', athlete: 'A1' })).toBe(game);
  game = act(game, { type: 'selectAthleteServer', athlete });
  expect(game.phase).toBe('setOrderPrompt');
  const receiver = athlete === 'B1' ? 'A1' : 'A2';
  expect(doublesService(game.session.current)).toEqual({ server: athlete, receiver });
  expect(act(game, { type: 'selectAthleteReceiver', athlete: partner(receiver) })).toBe(game);
  expect(save(game).phase).toBe('setOrderPrompt');
  game = act(game, { type: 'confirmSetOrder' });
  expect(game.phase).toBe('playing');
  expect(game.session.current.points).toEqual({ A: 0, B: 0 });
  game = act(game, { type: 'undo' });
  expect(game.phase).toBe('setOrderPrompt');
  game = act(game, { type: 'undo' });
  expect(game.phase).toBe('awaitingAthleteServer');
  game = act(game, { type: 'undo' });
  expect(game.session.current.points).toEqual({ A: 10, B: 0 });
  expect(game.session.current.completed).toHaveLength(0);
  expect(game.session.current.left).toBe('A');
});

test.each(combinations)('recebedor do próximo set usa quem servia para o atleta ($server/$receiver)', initial => {
  for (let turn = 0; turn < 4; turn++) {
    const order = advanceOrder(initial, turn);
    expect(receiverForNextSet(initial, order.receiver)).toBe(order.server);
  }
});

test('troca manual só altera lado físico, preservando ordem e identidades', () => {
  const game = points(start('A2', 'B2'), 3, 'B');
  const order = doublesService(game.session.current);
  const changed = act(act(game, { type: 'requestManual' }), { type: 'confirmSwitch' });
  expect(changed.session.current.left).toBe('B');
  expect(doublesService(changed.session.current)).toEqual(order);
  expect(changed.session.current.doubles).toEqual(game.session.current.doubles);
  expect(act(changed, { type: 'undo' })).toEqual(game);
});

test.each([0, 1, 2, 3, 4])('decisivo 5 × %i muda quem recebe NEXT e todo o ciclo restante', losing => {
  let game = decidingStart();
  game = points(game, 4, 'A');
  game = points(game, losing, 'B');
  const before = game;
  game = act(game, { type: 'point', player: 'A' });
  expect(game.session.current.pending).toBe('deciding');
  expect(game.session.current.points.A).toBe(5);
  expect(game.session.current.left).toBe('A');
  const regular = advanceOrder({ server: 'A1', receiver: 'B1' }, Math.floor((5 + losing) / 2));
  const changed = { server: regular.server, receiver: partner(regular.receiver) };
  expect(doublesService(game.session.current)).toEqual(changed);
  expect(act(game, { type: 'point', player: 'A' })).toBe(game);
  expect(save(game).session).toEqual(game.session);
  expect(act(game, { type: 'undo' })).toEqual(before);
  game = act(game, { type: 'confirmSwitch' });
  expect(game.session.current.left).toBe('B');
  expect(game.session.current.decidingSwitched).toBe(true);
  expect(doublesService(game.session.current)).toEqual(changed);
  expect(act(game, { type: 'confirmSwitch' })).toBe(game);
  expect(act(game, { type: 'undo' })).toEqual(before);
  const afterSwitch = game;
  game = act(game, { type: 'point', player: 'B' });
  expect(act(game, { type: 'undo' })).toEqual(afterSwitch);
  const turn = serviceTurn(game.session.current.points, 11);
  expect(doublesService(game.session.current)).toEqual(advanceOrder(changed, turn - Math.floor((5 + losing) / 2)));
  expect(game.session.current.pending).toBeNull();
  expect(save(game).session).toEqual(game.session);
});

test('modo casual desliga conjuntamente troca física e mudança de recepção', () => {
  const game = points(decidingStart('A1', 'B1', { decidingSwitch: false }), 5, 'A');
  expect(game.session.current.pending).toBeNull();
  expect(game.session.current.decidingSwitched).toBe(false);
  expect(game.session.current.doubles!.receptionChange).toBeNull();
  expect(doublesService(game.session.current)).toEqual({ server: 'A2', receiver: 'B2' });
  expect(game.session.current.left).toBe('A');
});

test('propriedade: decisão aos cinco funciona para as 80 combinações de ordem, dupla e placar', () => {
  for (const initial of combinations) for (const scoring of ['A', 'B'] as const) for (let losing = 0; losing <= 4; losing++) {
    const opponent = scoring === 'A' ? 'B' : 'A';
    let game = points(points(decidingStart(initial.server, initial.receiver), 4, scoring), losing, opponent);
    const before = game;
    game = act(game, { type: 'point', player: scoring });
    const old = advanceOrder(initial, Math.floor((5 + losing) / 2));
    const expected = { server: old.server, receiver: partner(old.receiver) };
    expect(doublesService(game.session.current)).toEqual(expected);
    game = act(game, { type: 'confirmSwitch' });
    expect(doublesService(game.session.current)).toEqual(expected);
    expect(act(game, { type: 'undo' })).toEqual(before);
    expect(save(game).session).toEqual(game.session);
  }
});

test('tempo técnico e correção pertencem à dupla inteira e não entram no undo de pontos', () => {
  let game = start();
  const request = (state: GameState, action: Parameters<typeof reduceGame>[1]) => reduceGame(state, action);
  game = request(game, { kind: 'timeout', action: { type: 'request', who: 'A' } });
  game = request(game, { kind: 'timeout', action: { type: 'confirmRequest' } });
  expect(game.timeouts.used).toEqual({ A: 1, B: 0 });
  expect(act(game, { type: 'point', player: 'B' })).toBe(game);
  game = request(game, { kind: 'timeout', action: { type: 'end' } });
  game = points(game, 4, 'B'); // server changed to A2; no new right for the partner.
  expect(request(game, { kind: 'timeout', action: { type: 'request', who: 'A' } })).toBe(game);
  game = act(game, { type: 'undo' });
  expect(game.timeouts.used.A).toBe(1);
  game = request(game, { kind: 'timeout', action: { type: 'requestRestore', player: 'A' } });
  game = request(game, { kind: 'timeout', action: { type: 'confirmRestore' } });
  expect(game.timeouts.used.A).toBe(0);
  expect(save(game).timeouts).toEqual(game.timeouts);
});

test.each([1, 3, 5, 7] as BestOf[])('partida completa melhor de %i conserva ordens, resultados e desfazer', bestOf => {
  let game = start('A2', 'B1', { bestOf });
  for (let set = 0; set < bestOf; set++) {
    for (let point = 0; point < 11; point++) {
      game = act(game, { type: 'point', player: set % 2 === 0 ? 'B' : 'A' });
      if (game.session.current.pending === 'deciding') game = act(game, { type: 'confirmSwitch' });
    }
    expect(save(game).session).toEqual(game.session);
    if (game.session.current.pending === 'betweenSets') {
      game = act(game, { type: 'confirmSwitch' });
      game = act(game, { type: 'selectAthleteServer', athlete: athletesOf(game.session.current.firstServer!)[set % 2]! });
      game = act(game, { type: 'confirmSetOrder' });
    }
  }
  expect(game.phase).toBe('finished');
  expect(game.session.current.winner).toBe('B');
  expect(game.session.current.completed).toHaveLength(bestOf);
  expect(game.session.current.sets.B).toBe(Math.floor(bestOf / 2) + 1);
  expect(save(game).phase).toBe('finished');
  game = act(game, { type: 'undo' });
  expect(game.phase).toBe('playing');
  expect(game.session.current.winner).toBeNull();
  expect(game.session.current.points.B).toBe(10);
  expect(game.session.current.completed).toHaveLength(bestOf - 1);
});

test('quatro cores distintas e cores principais pertencem a A1/B1', () => {
  expect(validAthleteColors(DEFAULT_ATHLETE_COLORS)).toBe(true);
  expect(changeAthleteColor(DEFAULT_ATHLETE_COLORS, 'A2', 'blue')).toBe(DEFAULT_ATHLETE_COLORS);
  const changed = changeAthleteColor(DEFAULT_ATHLETE_COLORS, 'B2', 'red');
  expect(changed.B2).toBe('red');
  expect(validAthleteColors(changed)).toBe(true);
  const colors = teamHexColors(settings, 'doubles');
  expect(colors).toEqual({ A: '#62B5FF', B: '#FFAE65' });
});

test.each([1, 2, 3, 4])('migra individual schema %i incluindo todo histórico', schema => {
  let game = newGame();
  game = act(game, { type: 'selectServer', player: 'B' });
  game = points(skip(game), 5, 'A');
  const raw = JSON.parse(encodeGame(DEFAULT_SETTINGS, game.session, game.timeouts, game));
  raw.schema = schema;
  delete raw.settings.mode; delete raw.settings.athleteColors;
  const strip = (state: Record<string, unknown>) => { delete state.mode; delete state.doubles; return state; };
  strip(raw.session.current); raw.session.history.forEach(strip);
  const loaded = decodeGame(JSON.stringify(raw));
  expect(loaded.session).toEqual(game.session);
  expect(loaded.phase).toBe('playing');
  expect(loaded.session.current.mode).toBe('singles');
  expect(loaded.settings.athleteColors).toEqual(DEFAULT_ATHLETE_COLORS);
});

test('recupera etapas iniciais, aquecimento, novo set e histórico de ordens', () => {
  let game = newGame(settings);
  for (const action of [{ type: 'selectServer', player: 'A' }, { type: 'selectAthleteServer', athlete: 'A2' }, { type: 'selectAthleteReceiver', athlete: 'B2' }] as Action[]) {
    game = act(game, action);
    const loaded = save(game);
    expect(loaded.phase).toBe(game.phase);
    expect(loaded.session).toEqual(game.session);
  }
  game = reduceGame(game, { kind: 'preparation', action: { type: 'acceptWarmup', seconds: 120 } });
  game = reduceGame(game, { kind: 'preparation', action: { type: 'toggleWarmup', now: 1000 } });
  expect(save(game).warmup).toEqual(game.warmup);
  expect(save(game).phase).toBe('warmup');
  game = reduceGame(game, { kind: 'preparation', action: { type: 'closeWarmup' } });
  game = points(game, 11, 'B');
  game = act(game, { type: 'confirmSwitch' });
  expect(save(game).phase).toBe('awaitingAthleteServer');
});

test.each(['mode', 'athlete', 'receiver', 'previous', 'phase', 'colors', 'change', 'history'])('rejeita save corrompido de duplas: %s', kind => {
  const game = start();
  const raw = JSON.parse(encodeGame(settings, game.session, game.timeouts, game));
  if (kind === 'mode') raw.session.current.mode = 'bad';
  if (kind === 'athlete') raw.session.current.doubles.server = 'A3';
  if (kind === 'receiver') raw.session.current.doubles.receiver = 'A2';
  if (kind === 'previous') raw.session.current.doubles.previous = { server: 'B1', receiver: 'A2' };
  if (kind === 'phase') raw.phase = 'awaitingAthleteServer';
  if (kind === 'colors') raw.settings.athleteColors.A2 = 'blue';
  if (kind === 'change') raw.session.current.doubles.receptionChange = { turn: 2, order: { server: 'A2', receiver: 'B1' } };
  if (kind === 'history') raw.session.history[0].doubles.server = 'X';
  expect(() => decodeGame(JSON.stringify(raw))).toThrow();
});

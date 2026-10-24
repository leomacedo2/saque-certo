import { changePlayerColor, ColorId, DEFAULT_PLAYER_COLORS, distinctColors, PLAYER_PALETTE, playerHexColors, validPlayerColors } from '../src/domain/colors';
import { newGame, reduceGame } from '../src/domain/game';
import { DEFAULT_SETTINGS, nextServer } from '../src/domain/match';
import { decodeGame, encodeGame } from '../src/storage/codec';
import { isPreMatch, promoteTimeoutRestore } from '../src/ui/matchPresentation';

test('cores padrão são azul para A e laranja para B', () => {
  expect(DEFAULT_PLAYER_COLORS).toEqual({ A: 'blue', B: 'orange' });
  expect(validPlayerColors(DEFAULT_PLAYER_COLORS)).toBe(true);
});
test.each(Object.keys(PLAYER_PALETTE) as ColorId[])('impede cor igual: %s', color => {
  expect(distinctColors(color, color)).toBe(false);
});
test.each([['blue', 'cyan'], ['orange', 'yellow'], ['red', 'orange'], ['purple', 'pink']] as [ColorId, ColorId][])('impede cores muito próximas: %s/%s', (first, second) => {
  expect(distinctColors(first, second)).toBe(false);
  expect(distinctColors(second, first)).toBe(false);
});
test('seleção válida é imutável e inválida preserva a dupla anterior', () => {
  const changed = changePlayerColor(DEFAULT_PLAYER_COLORS, 'A', 'green');
  expect(changed).toEqual({ A: 'green', B: 'orange' });
  expect(DEFAULT_PLAYER_COLORS.A).toBe('blue');
  expect(changePlayerColor(changed, 'B', 'green')).toBe(changed);
  expect(playerHexColors(changed).A).toBe(PLAYER_PALETTE.green.hex);
});
test('pré-jogo depende de primeiro sacador indefinido, não só 0 × 0', () => {
  let game = newGame();
  expect(isPreMatch(game.session.current)).toBe(true);
  game = reduceGame(game, { kind: 'match', action: { type: 'selectServer', player: 'A' } });
  game = reduceGame(game, { kind: 'preparation', action: { type: 'skipWarmup' } });
  expect(game.session.current.points).toEqual({ A: 0, B: 0 });
  expect(isPreMatch(game.session.current)).toBe(false);
  for (let i = 0; i < 11; i++) game = reduceGame(game, { kind: 'match', action: { type: 'point', player: 'A' } });
  game = reduceGame(game, { kind: 'match', action: { type: 'confirmSwitch' } });
  expect(game.session.current.points).toEqual({ A: 0, B: 0 });
  expect(game.session.current.left).toBe('B');
  expect(isPreMatch(game.session.current)).toBe(false);
});
test('cores persistem sem afetar pontos, saques, histórico ou tempos consumidos', () => {
  let game = newGame();
  game = reduceGame(game, { kind: 'match', action: { type: 'selectServer', player: 'A' } });
  game = reduceGame(game, { kind: 'preparation', action: { type: 'skipWarmup' } });
  game = reduceGame(game, { kind: 'match', action: { type: 'point', player: 'B' } });
  game = reduceGame(game, { kind: 'timeout', action: { type: 'request', who: 'A' } });
  game = reduceGame(game, { kind: 'timeout', action: { type: 'confirmRequest' } });
  game = reduceGame(game, { kind: 'timeout', action: { type: 'end' } });
  const settings = { ...DEFAULT_SETTINGS, colors: changePlayerColor(DEFAULT_PLAYER_COLORS, 'A', 'green') };
  const loaded = decodeGame(encodeGame(settings, game.session, game.timeouts));
  expect(loaded.settings.colors.A).toBe('green');
  expect(loaded.session).toEqual(game.session);
  expect(loaded.timeouts).toEqual(game.timeouts);
  expect(nextServer(loaded.session.current)).toBe(nextServer(game.session.current));
  expect(newGame(settings).timeouts.used).toEqual({ A: 0, B: 0 });
});
test.each([1, 2])('migra save schema %i para cores padrão sem perda de estado', schema => {
  const game = newGame();
  const { colors: _colors, ...settings } = DEFAULT_SETTINGS;
  const data = { schema, settings, session: game.session, timeouts: game.timeouts };
  const loaded = decodeGame(JSON.stringify(data));
  expect(loaded.schema).toBe(4);
  expect(loaded.settings.colors).toEqual(DEFAULT_PLAYER_COLORS);
  expect(loaded.session).toEqual(game.session);
  expect(loaded.timeouts).toEqual(game.timeouts);
});
test.each([null, { A: 'bad', B: 'orange' }, { A: 'blue', B: 'blue' }, { A: 'blue', B: 'cyan' }])('rejeita tema inválido no schema atual: %j', colors => {
  const game = newGame();
  const data = JSON.parse(encodeGame(DEFAULT_SETTINGS, game.session, game.timeouts));
  data.settings.colors = colors;
  expect(() => decodeGame(JSON.stringify(data))).toThrow();
});
test('restaurar só é promovido com consumo corrigível em partida em andamento', () => {
  let game = newGame();
  expect(promoteTimeoutRestore(game.session.current, game.timeouts, false)).toBe(false);
  game = reduceGame(game, { kind: 'match', action: { type: 'selectServer', player: 'A' } });
  game = reduceGame(game, { kind: 'preparation', action: { type: 'skipWarmup' } });
  game = reduceGame(game, { kind: 'timeout', action: { type: 'request', who: 'A' } });
  game = reduceGame(game, { kind: 'timeout', action: { type: 'confirmRequest' } });
  game = reduceGame(game, { kind: 'timeout', action: { type: 'end' } });
  expect(promoteTimeoutRestore(game.session.current, game.timeouts, false)).toBe(true);
  expect(promoteTimeoutRestore(game.session.current, game.timeouts, true)).toBe(false);
  expect(promoteTimeoutRestore({ ...game.session.current, pending: 'betweenSets' }, game.timeouts, false)).toBe(false);
  expect(promoteTimeoutRestore({ ...game.session.current, winner: 'A' }, game.timeouts, false)).toBe(false);
});

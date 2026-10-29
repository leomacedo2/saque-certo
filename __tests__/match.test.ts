import { DEFAULT_SETTINGS, PlayerId, Session, newSession, nextServer, other, reduceSession } from '../src/domain/match';
import { decodeGame, encodeGame } from '../src/storage/codec';

const act = (s: Session, type: 'point' | 'selectServer', player: PlayerId = 'A') => reduceSession(s, { type, player });
const confirm = (s: Session) => reduceSession(s, { type: 'confirmSwitch' });
function started(overrides = {}) { return act(newSession({ ...DEFAULT_SETTINGS, ...overrides }), 'selectServer'); }
function points(s: Session, player: PlayerId, count: number): Session {
  for (let i = 0; i < count; i++) s = act(s, 'point', player);
  return s;
}
function decisive(overrides = {}): Session {
  let s = started(overrides);
  s = confirm(points(s, 'A', 11));
  s = confirm(points(s, 'B', 11));
  return s;
}
function fiveThree(): Session {
  let s = decisive();
  s = points(s, 'A', 4);
  s = points(s, 'B', 3);
  return act(s, 'point', 'A');
}

describe('início e saque', () => {
  test('primeiro toque só escolhe o sacador e pode ser desfeito', () => {
    const initial = newSession();
    expect(act(initial, 'point')).toBe(initial);
    const s = act(initial, 'selectServer', 'B');
    expect(s.current.points).toEqual({ A: 0, B: 0 });
    expect(nextServer(s.current)).toBe('B');
    expect(reduceSession(s, { type: 'undo' })).toEqual(initial);
    expect(act(s, 'selectServer')).toBe(s);
  });
  test('saques de dois em dois independente de quem marcou', () => {
    let s = started();
    const expected = ['A', 'B', 'B', 'A', 'A', 'B', 'B', 'A'];
    for (let i = 0; i < expected.length; i++) {
      s = act(s, 'point', i % 2 ? 'B' : 'A');
      expect(nextServer(s.current)).toBe(expected[i]);
    }
  });
  test('10 × 10 alterna a cada ponto e não encerra sem vantagem de dois', () => {
    let s = started({ bestOf: 1, decidingSwitch: false });
    for (let i = 0; i < 10; i++) { s = act(act(s, 'point', 'A'), 'point', 'B'); }
    expect(nextServer(s.current)).toBe('A');
    s = act(s, 'point', 'A');
    expect(s.current.winner).toBeNull();
    expect(nextServer(s.current)).toBe('B');
    s = act(s, 'point', 'B');
    expect(nextServer(s.current)).toBe('A');
    s = points(s, 'A', 2);
    expect(s.current.points).toEqual({ A: 13, B: 11 });
    expect(s.current.winner).toBe('A');
    expect(nextServer(s.current)).toBeNull();
  });
  test('deuce prolongado continua alternando', () => {
    let s = started({ bestOf: 1, decidingSwitch: false });
    for (let i = 0; i < 100; i++) {
      s = act(act(s, 'point', 'A'), 'point', 'B');
      expect(nextServer(s.current)).toBe(i < 9 ? (i % 2 ? 'A' : 'B') : 'A');
    }
    expect(s.current.points).toEqual({ A: 100, B: 100 });
  });
  test('formato casual usa alvo − 1 para deuce', () => {
    let s = started({ target: 7, decidingSwitch: false });
    for (let i = 0; i < 6; i++) s = act(act(s, 'point', 'A'), 'point', 'B');
    expect(nextServer(s.current)).toBe('A');
    s = act(s, 'point', 'B');
    expect(nextServer(s.current)).toBe('B');
  });
});
describe('sets e lados', () => {
  test('encerra em 11 × 0, bloqueia pontos, mantém placar até confirmação', () => {
    const s = points(started(), 'A', 11);
    expect(s.current.pending).toBe('betweenSets');
    expect(s.current.points).toEqual({ A: 11, B: 0 });
    expect(s.current.sets).toEqual({ A: 1, B: 0 });
    expect(s.current.left).toBe('A');
    expect(act(s, 'point', 'B')).toBe(s);
    expect(nextServer(s.current)).toBe('B');
    const next = confirm(s);
    expect(next.current.left).toBe('B');
    expect(next.current.points).toEqual({ A: 0, B: 0 });
    expect(next.current.firstServer).toBe('B');
    expect(nextServer(next.current)).toBe('B');
    expect(confirm(next)).toBe(next);
  });
  test('saque inicial alterna em todos os sets', () => {
    let s = started({ bestOf: 7 });
    for (const winner of ['A', 'B', 'A', 'B', 'A', 'B'] as PlayerId[]) {
      const previous = s.current.firstServer!;
      s = confirm(points(s, winner, 11));
      expect(s.current.firstServer).toBe(other(previous));
    }
  });
  test.each([1, 3, 5, 7] as const)('encerra melhor de %i sem solicitar troca final', bestOf => {
    let s = started({ bestOf, decidingSwitch: false });
    const needed = Math.floor(bestOf / 2) + 1;
    for (let i = 0; i < needed; i++) {
      s = points(s, 'B', 11);
      if (i < needed - 1) s = confirm(s);
    }
    expect(s.current.winner).toBe('B');
    expect(s.current.sets.B).toBe(needed);
    expect(s.current.pending).toBeNull();
    expect(act(s, 'point')).toBe(s);
    expect(confirm(s)).toBe(s);
  });
  test('troca manual só muda posição e exige confirmação', () => {
    const s = points(started(), 'A', 3);
    const pending = reduceSession(s, { type: 'requestManual' });
    expect(pending.current.left).toBe('A');
    expect(act(pending, 'point')).toBe(pending);
    expect(reduceSession(pending, { type: 'cancelManual' })).toEqual(s);
    const swapped = confirm(pending);
    expect(swapped.current.left).toBe('B');
    expect(swapped.current.points).toEqual(s.current.points);
    expect(nextServer(swapped.current)).toBe(nextServer(s.current));
    expect(reduceSession(swapped, { type: 'undo' })).toEqual(s);
  });
  test('troca manual não pode substituir uma troca obrigatória', () => {
    const s = points(started(), 'A', 11);
    expect(reduceSession(s, { type: 'requestManual' })).toBe(s);
    expect(reduceSession(s, { type: 'cancelManual' })).toBe(s);
  });
});
describe('set decisivo', () => {
  test('5 × 3 com A iniciando: próximo saque é A antes e depois da troca', () => {
    const s = fiveThree();
    expect(s.current.firstServer).toBe('A');
    expect(s.current.points).toEqual({ A: 5, B: 3 });
    expect(s.current.pending).toBe('deciding');
    expect(nextServer(s.current)).toBe('A');
    expect(s.current.left).toBe('A');
    expect(act(s, 'point', 'B')).toBe(s);
    const swapped = confirm(s);
    expect(swapped.current.left).toBe('B');
    expect(swapped.current.points).toEqual({ A: 5, B: 3 });
    expect(swapped.current.sets).toEqual({ A: 1, B: 1 });
    expect(nextServer(swapped.current)).toBe('A');
    expect(swapped.current.decidingSwitched).toBe(true);
  });
  test('5 × 0 não presume o sacador do ponto anterior', () => {
    const s = points(decisive(), 'B', 5);
    expect(s.current.pending).toBe('deciding');
    expect(nextServer(s.current)).toBe('A');
  });
  test('não duplica troca quando o outro jogador chega a cinco', () => {
    let s = confirm(fiveThree());
    s = points(s, 'B', 2);
    expect(s.current.points).toEqual({ A: 5, B: 5 });
    expect(s.current.pending).toBeNull();
    s = points(s, 'A', 6);
    expect(s.current.winner).toBe('A');
    expect(s.current.pending).toBeNull();
  });
  test('desativação não remove a troca ao final dos sets', () => {
    const first = points(started({ decidingSwitch: false }), 'A', 11);
    expect(first.current.pending).toBe('betweenSets');
    const s = points(decisive({ decidingSwitch: false }), 'A', 5);
    expect(s.current.pending).toBeNull();
    expect(s.current.left).toBe('A');
  });
  test('set único também é o último set possível', () => {
    const s = points(started({ bestOf: 1 }), 'A', 5);
    expect(s.current.pending).toBe('deciding');
  });
  test('alvo casual abaixo de cinco encerra sem troca intermediária', () => {
    const s = points(started({ bestOf: 1, target: 3 }), 'A', 3);
    expect(s.current.winner).toBe('A');
    expect(s.current.pending).toBeNull();
  });
  test.each([3, 5, 7] as const)('troca no último set possível da melhor de %i', bestOf => {
    let s = started({ bestOf });
    for (let i = 0; i < bestOf - 1; i++) s = confirm(points(s, i % 2 ? 'B' : 'A', 11));
    expect(points(s, 'A', 5).current.pending).toBe('deciding');
  });
});
describe('desfazer e recuperação', () => {
  test.each([false, true])('desfaz quinto ponto com troca confirmada=%s', confirmed => {
    let s = fiveThree();
    if (confirmed) s = confirm(s);
    const undone = reduceSession(s, { type: 'undo' });
    expect(undone.current.points).toEqual({ A: 4, B: 3 });
    expect(undone.current.left).toBe('A');
    expect(undone.current.pending).toBeNull();
    expect(undone.current.decidingSwitched).toBe(false);
    expect(nextServer(undone.current)).toBe('B');
    expect(act(undone, 'point').current.pending).toBe('deciding');
  });
  test.each([false, true])('desfaz encerramento de set com troca confirmada=%s', confirmed => {
    let s = points(started(), 'A', 11);
    if (confirmed) s = confirm(s);
    const undone = reduceSession(s, { type: 'undo' });
    expect(undone.current.points).toEqual({ A: 10, B: 0 });
    expect(undone.current.sets).toEqual({ A: 0, B: 0 });
    expect(undone.current.left).toBe('A');
    expect(undone.current.completed).toEqual([]);
    expect(undone.current.pending).toBeNull();
  });
  test('desfaz vitória definitiva', () => {
    const s = points(started({ bestOf: 1, decidingSwitch: false }), 'A', 11);
    const undone = reduceSession(s, { type: 'undo' });
    expect(undone.current.winner).toBeNull();
    expect(undone.current.sets.A).toBe(0);
    expect(nextServer(undone.current)).toBe('B');
  });
  test('desfazer em partida vazia não altera estado', () => {
    const s = newSession();
    expect(reduceSession(s, { type: 'undo' })).toBe(s);
  });
  test('persistência preserva troca pendente, identidade, configurações e histórico', () => {
    const s = fiveThree();
    const saved = decodeGame(encodeGame(DEFAULT_SETTINGS, s));
    expect(saved.session).toEqual(s);
    expect(saved.settings).toEqual(DEFAULT_SETTINGS);
    expect(confirm(saved.session)).toEqual(confirm(s));
    expect(reduceSession(saved.session, { type: 'undo' })).toEqual(reduceSession(s, { type: 'undo' }));
  });
  test.each([true, false])('preserva preferência de som dos pontos: %s', pointSound => {
    const session = fiveThree();
    const saved = decodeGame(encodeGame({ ...DEFAULT_SETTINGS, pointSound }, session));
    expect(saved.settings.pointSound).toBe(pointSound);
    expect(saved.session).toEqual(session);
  });
  test('recupera partidas anteriores à preferência de som sem perder o histórico', () => {
    const session = fiveThree();
    const data = JSON.parse(encodeGame(DEFAULT_SETTINGS, session));
    delete data.settings.pointSound;
    const saved = decodeGame(JSON.stringify(data));
    expect(saved.settings.pointSound).toBe(true);
    expect(saved.session).toEqual(session);
  });
  test('rejeita preferência de som dos pontos com tipo inválido', () => {
    const data = JSON.parse(encodeGame(DEFAULT_SETTINGS, newSession()));
    data.settings.pointSound = 'false';
    expect(() => decodeGame(JSON.stringify(data))).toThrow();
  });
  test('todos os estados de uma partida completa podem ser recuperados', () => {
    let s = started();
    for (let i = 0; i < 3; i++) {
      const winner = i === 1 ? 'B' : 'A';
      for (let j = 0; j < 11; j++) {
        s = act(s, 'point', winner);
        expect(decodeGame(encodeGame(DEFAULT_SETTINGS, s)).session).toEqual(s);
        if (s.current.pending === 'deciding') s = confirm(s);
      }
      if (s.current.pending) s = confirm(s);
    }
    expect(s.current.winner).toBe('A');
    expect(decodeGame(encodeGame(DEFAULT_SETTINGS, s)).session).toEqual(s);
  });
  test.each(['{}', 'null', '{', '{"schema":2}', '{"schema":1,"settings":{}}'])('rejeita dados corrompidos: %s', raw => {
    expect(() => decodeGame(raw)).toThrow();
  });
  test('rejeita pontuação negativa e histórico inválido', () => {
    const s = fiveThree();
    s.current.points.A = -1;
    expect(() => decodeGame(encodeGame(DEFAULT_SETTINGS, s))).toThrow();
    const valid = started();
    valid.history[0]!.sets.B = 1;
    expect(() => decodeGame(encodeGame(DEFAULT_SETTINGS, valid))).toThrow();
  });
  test('rejeita regras incompletas na partida salva', () => {
    const data = JSON.parse(encodeGame(DEFAULT_SETTINGS, newSession()));
    data.session.current.rules = {};
    expect(() => decodeGame(JSON.stringify(data))).toThrow();
  });
  test('nova partida preserva regras escolhidas e limpa todo o estado', () => {
    const s = newSession({ target: 21, bestOf: 5, decidingSwitch: false });
    expect(s.current.rules).toEqual({ target: 21, bestOf: 5, decidingSwitch: false });
    expect(s.history).toEqual([]);
    expect(s.current.firstServer).toBeNull();
    expect(s.current.points).toEqual({ A: 0, B: 0 });
  });
  test('invariantes em sequências variadas e desfazer completo', () => {
    let s = started({ bestOf: 7 });
    let seed = 42;
    for (let i = 0; i < 500 && !s.current.winner; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const previous = s;
      s = act(s, 'point', seed % 7 < 4 ? 'A' : 'B');
      expect(previous.current.points).not.toBe(s.current.points);
      expect(s.current.points.A).toBeGreaterThanOrEqual(0);
      expect(s.current.points.B).toBeGreaterThanOrEqual(0);
      expect(s.current.sets.A + s.current.sets.B).toBe(s.current.completed.length);
      expect(decodeGame(encodeGame(DEFAULT_SETTINGS, s)).session).toEqual(s);
      if (s.current.pending) s = confirm(s);
    }
    while (s.history.length) s = reduceSession(s, { type: 'undo' });
    expect(s).toEqual(newSession({ ...DEFAULT_SETTINGS, bestOf: 7 }));
  });
});

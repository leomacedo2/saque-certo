import { DEFAULT_SETTINGS, Match, Session, Settings, other } from '../domain/match';

export interface SavedGame { schema: 1; settings: Settings; session: Session }
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const integer = (value: unknown, min = 0, max = 1_000_000): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
const player = (value: unknown): value is 'A' | 'B' => value === 'A' || value === 'B';
function pair(value: unknown): value is { A: number; B: number } {
  return record(value) && integer(value.A) && integer(value.B);
}
export function validSettings(value: unknown): value is Settings {
  return record(value) && integer(value.target, 2, 99)
    && [1, 3, 5, 7].includes(value.bestOf as number)
    && ['decidingSwitch', 'haptics', 'doubleTapGuard', 'highContrast', 'sound'].every(key => typeof value[key] === 'boolean')
    && integer(value.warmupSeconds, 10, 3600);
}
function validMatch(value: unknown): value is Match {
  if (!record(value) || !record(value.rules)) return false;
  const rules = value.rules;
  if (!validSettings({ ...DEFAULT_SETTINGS, target: rules.target, bestOf: rules.bestOf, decidingSwitch: rules.decidingSwitch }) || !pair(value.points) || !pair(value.sets)
    || !player(value.left) || !(value.firstServer === null || player(value.firstServer))
    || typeof value.decidingSwitched !== 'boolean' || ![null, 'manual', 'betweenSets', 'deciding'].includes(value.pending as null)
    || !(value.winner === null || player(value.winner)) || !Array.isArray(value.completed)) return false;
  const target = rules.target as number;
  const bestOf = rules.bestOf as number;
  const needed = Math.floor(bestOf / 2) + 1;
  if (value.completed.length > bestOf) return false;
  const tally = { A: 0, B: 0 };
  for (const set of value.completed) {
    if (!record(set) || !pair(set.points) || !player(set.winner)) return false;
    const won = set.points[set.winner];
    const lost = set.points[other(set.winner)];
    if (won < target || won - lost < 2 || (won > target && won - lost !== 2)
      || tally.A >= needed || tally.B >= needed) return false;
    tally[set.winner]++;
  }
  if (tally.A !== value.sets.A || tally.B !== value.sets.B) return false;
  const winner = tally.A === needed ? 'A' : tally.B === needed ? 'B' : null;
  if (winner !== value.winner || (winner && value.pending !== null)) return false;
  if (!value.firstServer && (value.points.A || value.points.B || value.completed.length || value.winner
    || (value.pending !== null && value.pending !== 'manual'))) return false;
  if (value.pending === 'betweenSets' || winner) {
    const last = value.completed.at(-1);
    if (!last || !record(last) || !pair(last.points) || last.points.A !== value.points.A || last.points.B !== value.points.B) return false;
  } else if (Math.max(value.points.A, value.points.B) >= target && Math.abs(value.points.A - value.points.B) >= 2) return false;
  const deciding = tally.A === needed - 1 && tally.B === needed - 1;
  if (value.pending === 'deciding' && (!deciding || !rules.decidingSwitch || value.decidingSwitched || Math.max(value.points.A, value.points.B) !== 5)) return false;
  if (value.decidingSwitched && (!deciding || !rules.decidingSwitch || Math.max(value.points.A, value.points.B) < 5)) {
    // At match end, tally already contains the final set.
    if (!winner) return false;
  }
  return true;
}
export function encodeGame(settings: Settings, session: Session): string {
  return JSON.stringify({ schema: 1, settings, session } satisfies SavedGame);
}
export function decodeGame(raw: string): SavedGame {
  const data: unknown = JSON.parse(raw);
  if (!record(data) || data.schema !== 1 || !validSettings(data.settings) || !record(data.session)
    || !validMatch(data.session.current) || !Array.isArray(data.session.history)
    || !data.session.history.every(validMatch)) throw new Error('Arquivo de partida inválido ou incompatível.');
  return data as unknown as SavedGame;
}

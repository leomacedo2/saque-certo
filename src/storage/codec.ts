import { DEFAULT_SETTINGS, Match, Session, Settings, other } from '../domain/match';
import { canRequestTimeout, DEFAULT_TIMEOUT_CONFIG, newTimeouts, timeoutPlayers, Timeouts } from '../domain/timeouts';
import { DEFAULT_ATHLETE_COLORS, DEFAULT_PLAYER_COLORS, validAthleteColors, validPlayerColors } from '../domain/colors';
import { inferPreparation, Preparation } from '../domain/game';
import { advanceOrder, isAthlete, partner, receiverForNextSet, ServiceOrder, teamOf } from '../domain/doubles';

export interface SavedGame extends Preparation { schema: 5; settings: Settings; session: Session; timeouts: Timeouts }
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
    && ['decidingSwitch', 'haptics', 'pointSound', 'doubleTapGuard', 'highContrast', 'sound'].every(key => typeof value[key] === 'boolean')
    && integer(value.warmupSeconds, 10, 3600)
    && validTimeoutConfig(value) && validPlayerColors(value.colors) && validAthleteColors(value.athleteColors)
    && ['singles', 'doubles'].includes(value.mode as string);
}
function validTimeoutConfig(value: unknown): boolean {
  return record(value) && integer(value.timeoutSeconds, 1, 3600) && integer(value.timeoutLimit, 0, 3);
}
function validTimeouts(value: unknown, match: Match): value is Timeouts {
  const who = (v: unknown) => player(v) || v === 'both';
  if (!record(value) || !validTimeoutConfig(value.config) || !record(value.config) || !pair(value.used)
    || value.used.A > (value.config.timeoutLimit as number) || value.used.B > (value.config.timeoutLimit as number)
    || !(value.request === null || who(value.request)) || !(value.correction === null || player(value.correction))) return false;
  if ([value.request, value.active, value.correction].filter(v => v !== null).length > 1) return false;
  if (value.active !== null) {
    const active = value.active;
    if (!record(active) || !who(active.who) || !record(active.timer) || typeof active.started !== 'boolean'
      || !integer(active.timer.remainingMs, 0, (value.config.timeoutSeconds as number) * 1000)
      || !(active.timer.deadline === null || (typeof active.timer.deadline === 'number' && Number.isSafeInteger(active.timer.deadline) && active.timer.deadline >= 0))
      || !timeoutPlayers(active.who as 'A' | 'B' | 'both').every(id => (value.used as { A: number; B: number })[id] >= 1)
      || !match.firstServer || match.pending || match.winner) return false;
    if (!active.started && (active.timer.deadline !== null || active.timer.remainingMs !== (value.config.timeoutSeconds as number) * 1000)) return false;
  }
  if (value.request !== null && !canRequestTimeout(value as unknown as Timeouts, match, value.request as 'A' | 'B' | 'both')) return false;
  if (value.correction !== null && (match.pending || value.used[value.correction as 'A' | 'B'] <= 0)) return false;
  return true;
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
  return validDoublesMatch(value as unknown as Match);
}
function validOrder(value: unknown): value is ServiceOrder {
  return record(value) && isAthlete(value.server) && isAthlete(value.receiver) && teamOf(value.server) !== teamOf(value.receiver);
}
function sameOrder(first: ServiceOrder | null, second: ServiceOrder | null): boolean {
  return first === null || second === null ? first === second : first.server === second.server && first.receiver === second.receiver;
}
function validDoublesMatch(match: Match): boolean {
  if (match.mode === 'singles') return match.doubles === null;
  if (match.mode !== 'doubles' || !record(match.doubles)) return false;
  const d = match.doubles;
  if (!(d.server === null || isAthlete(d.server)) || !(d.receiver === null || isAthlete(d.receiver))
    || typeof d.confirmed !== 'boolean' || !(d.previous === null || validOrder(d.previous))) return false;
  if (d.server && teamOf(d.server) !== match.firstServer) return false;
  if (d.receiver && (!d.server || teamOf(d.receiver) === teamOf(d.server))) return false;
  if (d.confirmed && (!d.server || !d.receiver)) return false;
  if ((!d.confirmed && (match.points.A || match.points.B || match.winner || match.pending === 'betweenSets' || match.pending === 'deciding'))
    || (!match.firstServer && (d.server || d.receiver || d.confirmed))) return false;
  if (d.previous && d.server && d.receiver !== receiverForNextSet(d.previous, d.server)) return false;
  for (let i = 0; i < match.completed.length; i++) {
    const metadata = match.completed[i]!.doubles;
    if (!metadata || !validOrder(metadata.initial) || !(metadata.receptionChange === null || validOrder(metadata.receptionChange))) return false;
    if (i > 0) {
      const prior = match.completed[i - 1]!.doubles!;
      if (teamOf(metadata.initial.server) === teamOf(prior.initial.server)
        || metadata.initial.receiver !== receiverForNextSet(prior.receptionChange ?? prior.initial, metadata.initial.server)) return false;
    }
  }
  const closed = !!match.winner || match.pending === 'betweenSets';
  const prior = match.completed.at(closed ? -2 : -1)?.doubles;
  if (!sameOrder(d.previous, prior ? prior.receptionChange ?? prior.initial : null)) return false;
  if (prior && match.firstServer !== other(teamOf(prior.initial.server))) return false;
  if (closed) {
    const last = match.completed.at(-1)!.doubles!;
    if (last.initial.server !== d.server || last.initial.receiver !== d.receiver || !sameOrder(last.receptionChange, d.receptionChange?.order ?? null)) return false;
  }
  if (d.receptionChange !== null) {
    const change = d.receptionChange;
    if (!record(change) || !integer(change.turn, 0, 8) || !validOrder(change.order) || !d.server || !d.receiver
      || !match.rules.decidingSwitch || Math.max(match.points.A, match.points.B) < 5 || !(match.decidingSwitched || match.pending === 'deciding')) return false;
    const before = advanceOrder({ server: d.server, receiver: d.receiver }, change.turn);
    if (change.order.server !== before.server || change.order.receiver !== partner(before.receiver)) return false;
  } else if (match.decidingSwitched || match.pending === 'deciding') return false;
  return true;
}
export function encodeGame(settings: Settings, session: Session, timeouts: Timeouts = newTimeouts(settings), preparation: Preparation = inferPreparation(session)): string {
  return JSON.stringify({ schema: 5, settings, session, timeouts, phase: preparation.phase, warmup: preparation.warmup } satisfies SavedGame);
}
function validPreparation(value: Record<string, unknown>, session: Session, timeouts: Timeouts): value is Record<string, unknown> & Preparation {
  const match = session.current;
  const expected = inferPreparation(session).phase;
  if (value.phase === 'warmupPrompt' || value.phase === 'warmup') {
    if (expected !== 'playing' || !match.firstServer || match.winner || match.pending || match.completed.length || match.points.A || match.points.B
      || timeoutBusy(timeouts)) return false;
  } else if (value.phase !== expected) return false;
  if (value.phase !== 'warmup') return value.warmup === null;
  const warmup = value.warmup;
  return record(warmup) && integer(warmup.seconds, 10, 3600) && record(warmup.timer)
    && integer(warmup.timer.remainingMs, 0, warmup.seconds * 1000)
    && (warmup.timer.deadline === null || integer(warmup.timer.deadline, 0, Number.MAX_SAFE_INTEGER));
}
const timeoutBusy = (timeouts: Timeouts) => !!(timeouts.active || timeouts.request || timeouts.correction);
export function decodeGame(raw: string): SavedGame {
  const data: unknown = JSON.parse(raw);
  if (!record(data) || ![1, 2, 3, 4, 5].includes(data.schema as number) || !record(data.settings)) throw new Error('Arquivo de partida inválido ou incompatível.');
  // Old saves predate timeouts: keep the match/history and grant the default rights.
  const pointPreferences = { pointSound: DEFAULT_SETTINGS.pointSound, ...data.settings };
  const legacySettings = data.schema === 1 ? { ...DEFAULT_TIMEOUT_CONFIG, ...pointPreferences } : pointPreferences;
  const legacyColors = (data.schema as number) >= 3 ? legacySettings : { colors: DEFAULT_PLAYER_COLORS, ...legacySettings };
  const settings = data.schema === 5 ? legacyColors : { mode: 'singles', athleteColors: DEFAULT_ATHLETE_COLORS, ...legacyColors };
  if (data.schema !== 5 && record(data.session) && Array.isArray(data.session.history)) {
    const migrate = (match: unknown) => record(match) ? { mode: 'singles', doubles: null, ...match } : match;
    data.session = { current: migrate(data.session.current), history: data.session.history.map(migrate) };
  }
  if (!validSettings(settings) || !record(data.session)
    || !validMatch(data.session.current) || !Array.isArray(data.session.history)
    || !data.session.history.every(validMatch)) throw new Error('Arquivo de partida inválido ou incompatível.');
  const timeouts = data.schema === 1 ? newTimeouts(settings) : data.timeouts;
  if (!validTimeouts(timeouts, data.session.current)) throw new Error('Estado de tempo técnico inválido.');
  const session = data.session as unknown as Session;
  if (session.history.some(snapshot => snapshot.mode !== session.current.mode)) throw new Error('Modalidade inconsistente no histórico.');
  if ((data.schema as number) >= 4 && !validPreparation(data, session, timeouts)) throw new Error('Fase de preparação inválida.');
  const preparation = (data.schema as number) >= 4 ? { phase: data.phase, warmup: data.warmup } as Preparation : inferPreparation(session);
  return { schema: 5, settings, session, timeouts, ...preparation };
}

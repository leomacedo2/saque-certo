import type { Match, Pair, TeamId } from './match';

export type Mode = 'singles' | 'doubles';
export type AthleteId = 'A1' | 'A2' | 'B1' | 'B2';
export const ATHLETES = ['A1', 'A2', 'B1', 'B2'] as const;
export const teamOf = (athlete: AthleteId): TeamId => athlete[0] as TeamId;
export const athletesOf = (team: TeamId): readonly AthleteId[] => team === 'A' ? ['A1', 'A2'] : ['B1', 'B2'];
export const partner = (athlete: AthleteId): AthleteId => `${athlete[0]}${athlete[1] === '1' ? '2' : '1'}` as AthleteId;
export const isAthlete = (value: unknown): value is AthleteId => ATHLETES.includes(value as AthleteId);
export interface ServiceOrder { server: AthleteId; receiver: AthleteId }
export interface ReceptionChange { turn: number; order: ServiceOrder }
export interface DoublesState {
  server: AthleteId | null;
  receiver: AthleteId | null;
  confirmed: boolean;
  previous: ServiceOrder | null;
  receptionChange: ReceptionChange | null;
}
export const newDoubles = (previous: ServiceOrder | null = null): DoublesState => ({ server: null, receiver: null, confirmed: false, previous, receptionChange: null });
export function serviceTurn(points: Pair<number>, target: number): number {
  const deuce = target - 1;
  return points.A >= deuce && points.B >= deuce ? deuce + points.A + points.B - 2 * deuce : Math.floor((points.A + points.B) / 2);
}
/** ITTF 2.13.5: receiver serves next, partner of old server receives. */
export function advanceOrder(order: ServiceOrder, turns: number): ServiceOrder {
  let result = order;
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++) result = { server: result.receiver, receiver: partner(result.server) };
  return result;
}
/** ITTF 2.13.4: next set's receiver is whoever served to the chosen server. */
export function receiverForNextSet(previous: ServiceOrder, server: AthleteId): AthleteId {
  for (let i = 0; i < 4; i++) {
    const order = advanceOrder(previous, i);
    if (order.receiver === server) return order.server;
  }
  throw new Error('Atleta fora da ordem de duplas.');
}
export function doublesService(match: Match): ServiceOrder | null {
  const d = match.doubles;
  if (!d?.server || !d.receiver || match.winner || match.pending === 'betweenSets') return null;
  const turn = serviceTurn(match.points, match.rules.target);
  const anchor = d.receptionChange;
  return anchor ? advanceOrder(anchor.order, turn - anchor.turn) : advanceOrder({ server: d.server, receiver: d.receiver }, turn);
}
export const teamName = (match: Pick<Match, 'mode'>, team: TeamId): string => `${match.mode === 'doubles' ? 'Dupla' : 'Jogador'} ${team}`;

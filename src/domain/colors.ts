import type { Pair, PlayerId } from './match';
import { ATHLETES, AthleteId, Mode } from './doubles';

export const PLAYER_PALETTE = {
  blue: { name: 'Azul', hex: '#62B5FF' },
  orange: { name: 'Laranja', hex: '#FFAE65' },
  red: { name: 'Vermelho', hex: '#FF6B75' },
  green: { name: 'Verde', hex: '#72D6A3' },
  yellow: { name: 'Amarelo', hex: '#F3DC70' },
  purple: { name: 'Roxo', hex: '#B59AFF' },
  pink: { name: 'Rosa', hex: '#F68CCB' },
  cyan: { name: 'Ciano', hex: '#56D9E4' },
} as const;
export type ColorId = keyof typeof PLAYER_PALETTE;
export type PlayerColors = Pair<ColorId>;
export type AthleteColors = Record<AthleteId, ColorId>;
export type ColorIdentity = PlayerId | AthleteId;
export const DEFAULT_ATHLETE_COLORS: AthleteColors = { A1: 'blue', A2: 'green', B1: 'orange', B2: 'pink' };
export const DEFAULT_PLAYER_COLORS: PlayerColors = { A: 'blue', B: 'orange' };
export const isColorId = (value: unknown): value is ColorId => typeof value === 'string' && Object.hasOwn(PLAYER_PALETTE, value);
export function distinctColors(a: ColorId, b: ColorId, minimumDistance = 90): boolean {
  const rgb = (color: ColorId) => [1, 3, 5].map(offset => parseInt(PLAYER_PALETTE[color].hex.slice(offset, offset + 2), 16));
  const first = rgb(a), second = rgb(b);
  return Math.hypot(...first.map((value, index) => value - second[index]!)) >= minimumDistance;
}
export function validPlayerColors(value: unknown): value is PlayerColors {
  if (!value || typeof value !== 'object') return false;
  const pair = value as Record<string, unknown>;
  return isColorId(pair.A) && isColorId(pair.B) && distinctColors(pair.A, pair.B);
}
export function changePlayerColor(colors: PlayerColors, player: PlayerId, color: ColorId): PlayerColors {
  const next = { ...colors, [player]: color };
  return validPlayerColors(next) ? next : colors;
}
export const playerHexColors = (colors: PlayerColors): Pair<string> => ({ A: PLAYER_PALETTE[colors.A].hex, B: PLAYER_PALETTE[colors.B].hex });
export function validAthleteColors(value: unknown): value is AthleteColors {
  if (!value || typeof value !== 'object') return false;
  const colors = value as AthleteColors;
  return ATHLETES.every(id => isColorId(colors[id])) && distinctColors(colors.A1, colors.B1)
    && ATHLETES.every((id, index) => ATHLETES.slice(index + 1).every(other => distinctColors(colors[id], colors[other], 60)));
}
export function changeAthleteColor(colors: AthleteColors, athlete: AthleteId, color: ColorId): AthleteColors {
  const next = { ...colors, [athlete]: color };
  return validAthleteColors(next) ? next : colors;
}
export const teamHexColors = (settings: { colors: PlayerColors; athleteColors: AthleteColors }, mode: Mode): Pair<string> =>
  mode === 'doubles' ? playerHexColors({ A: settings.athleteColors.A1, B: settings.athleteColors.B1 }) : playerHexColors(settings.colors);

import type { Pair, PlayerId } from './match';

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
export const DEFAULT_PLAYER_COLORS: PlayerColors = { A: 'blue', B: 'orange' };
export const isColorId = (value: unknown): value is ColorId => typeof value === 'string' && Object.hasOwn(PLAYER_PALETTE, value);
export function distinctColors(a: ColorId, b: ColorId): boolean {
  const rgb = (color: ColorId) => [1, 3, 5].map(offset => parseInt(PLAYER_PALETTE[color].hex.slice(offset, offset + 2), 16));
  const first = rgb(a), second = rgb(b);
  return Math.hypot(...first.map((value, index) => value - second[index]!)) >= 90;
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

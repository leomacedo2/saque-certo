import { Text } from 'react-native';
import { Match, nextServer } from '../domain/match';
import { doublesService, teamName } from '../domain/doubles';
import { AthleteColors, PLAYER_PALETTE } from '../domain/colors';
import { shared } from './Controls';

export function ServiceNotice({ match, colors }: { match: Match; colors: AthleteColors }) {
  if (match.pending === 'betweenSets') return <Text style={shared.strong}>{teamName(match, nextServer(match)!)} começa sacando. Após a troca, escolha o atleta sacador.</Text>;
  const order = doublesService(match);
  return order ? <Text style={shared.strong}>
    <Text style={{ color: PLAYER_PALETTE[colors[order.server]].hex }}>Saque: {order.server}</Text>
    {'  →  '}<Text style={{ color: PLAYER_PALETTE[colors[order.receiver]].hex }}>Recebe: {order.receiver}</Text>
  </Text> : null;
}

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Match, Pair, PlayerId, nextServer, other, playerName } from '../domain/match';
import { palette } from './theme';
import { LargeNumber } from './LargeNumber';

export function Scoreboard({ match, colors, highContrast, blocked, onPlayer }: {
  match: Match; colors: Pair<string>; highContrast: boolean; blocked: boolean; onPlayer: (player: PlayerId) => void;
}) {
  const server = nextServer(match);
  const players = [match.left, other(match.left)];
  return <View style={styles.container}>
    {!match.firstServer && match.completed.length === 0 && match.points.A === 0 && match.points.B === 0 && <View style={styles.caption}>
      <Text style={styles.captionText}>Quem começa sacando? Toque no lado do jogador.</Text>
    </View>}
    <View style={styles.court}>
      {players.map((id, index) => {
        const serving = server === id;
        const color = colors[id];
        return <Pressable key={id} onPress={() => onPlayer(id)} disabled={blocked || !!match.pending || !!match.winner}
          accessibilityRole="button" accessibilityLabel={`${playerName(id)}, ${index === 0 ? 'esquerda' : 'direita'}, ${match.points[id]} pontos, ${match.sets[id]} ${match.sets[id] === 1 ? 'set' : 'sets'}${serving ? ', saque' : ''}. ${match.firstServer ? 'Adicionar ponto' : 'Selecionar primeiro sacador'}`}
          style={({ pressed }) => [styles.player, { borderColor: serving || highContrast ? color : `${color}80`,
            backgroundColor: serving ? `${color}20` : palette.surface }, pressed && { opacity: 0.8 }]}>
          <View style={styles.playerHeader}>
            <View style={styles.nameGroup}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={[styles.name, { color }]}>{playerName(id)}</Text></View>
            <View style={[styles.badge, serving && { backgroundColor: color }]}>
              <Text style={[styles.badgeText, { color: serving ? '#111A24' : palette.muted }]}>{serving ? '● SAQUE' : match.firstServer ? 'RECEBE' : 'ESCOLHER'}</Text>
            </View>
          </View>
          <LargeNumber value={String(match.points[id])} color={highContrast ? '#FFFFFF' : palette.text} />
        </Pressable>;
      })}
    </View>
    <View style={styles.bottom}>
      <Text style={styles.bottomText}>SET {Math.min(match.completed.length + (match.pending === 'betweenSets' || match.winner ? 0 : 1), match.rules.bestOf)}  /  {match.rules.bestOf}</Text>
      <Text style={styles.bottomText}>Partida de {match.rules.target} pontos</Text>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, gap: 8 }, caption: { alignItems: 'center', paddingVertical: 2 },
  captionText: { color: palette.muted, fontSize: 14, textAlign: 'center' },
  court: { flex: 1, flexDirection: 'row', gap: 12 },
  player: { flex: 1, borderWidth: 2, borderRadius: 22, padding: 16, justifyContent: 'space-between', overflow: 'hidden' },
  playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  nameGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5 }, name: { fontSize: 16, fontWeight: '700' },
  badge: { borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5 }, badgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  bottom: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingHorizontal: 8, paddingBottom: 6 },
  bottomText: { color: palette.muted, fontSize: 10, letterSpacing: 0.8 },
});

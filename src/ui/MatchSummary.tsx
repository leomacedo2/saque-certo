import { StyleSheet, Text, View } from 'react-native';
import { Match, Pair } from '../domain/match';
import { palette } from './theme';

/** Columns use player identities, never the current physical ends. */
export function MatchSummary({ match, colors }: { match: Match; colors: Pair<string> }) {
  return <View accessibilityLabel="Resultados por set" style={styles.table}>
    <View style={[styles.row, styles.heading]}>
      <Text style={[styles.label, styles.headerText]}>Set</Text>
      <Text style={[styles.cell, styles.headerText, { color: colors.A }]}>Jogador A</Text>
      <Text style={[styles.cell, styles.headerText, { color: colors.B }]}>Jogador B</Text>
    </View>
    {match.completed.map((set, index) => <View key={index} style={styles.row} accessibilityLabel={`Set ${index + 1}: Jogador A ${set.points.A}, Jogador B ${set.points.B}. Vencedor: Jogador ${set.winner}`}>
      <Text style={styles.label}>{index + 1}</Text>
      {(['A', 'B'] as const).map(player => <Text key={player} style={[styles.cell, set.winner === player && { color: colors[player], fontWeight: '800', backgroundColor: `${colors[player]}12` }]}>{set.points[player]}</Text>)}
    </View>)}
    <View style={[styles.row, styles.total]}>
      <Text style={[styles.label, styles.headerText]}>Sets vencidos</Text>
      <Text style={[styles.cell, styles.headerText, { color: colors.A }]}>{match.sets.A}</Text>
      <Text style={[styles.cell, styles.headerText, { color: colors.B }]}>{match.sets.B}</Text>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  table: { borderWidth: 1, borderColor: palette.line, borderRadius: 10, overflow: 'hidden', marginVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'stretch', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
  heading: { backgroundColor: palette.surface },
  label: { flex: 1.2, color: palette.text, padding: 10, fontSize: 16, textAlignVertical: 'center' },
  cell: { flex: 1, color: palette.text, textAlign: 'center', padding: 10, fontSize: 18, fontVariant: ['tabular-nums'] },
  headerText: { fontWeight: '700', fontSize: 16 },
  total: { borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: palette.surface },
});

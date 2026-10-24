import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Match, other, PlayerId, Pair } from '../domain/match';
import { TimeoutAction, Timeouts } from '../domain/timeouts';
import { TimeoutPlayerButton } from './TimeoutControls';

export function MatchHeader({ match, timeouts, colors, disabled, preMatch, leading, trailing, onColor, dispatch }: {
  match: Match; timeouts: Timeouts; colors: Pair<string>; disabled: boolean; leading: ReactNode; trailing: ReactNode;
  onColor: (player: PlayerId) => void; dispatch: (action: TimeoutAction) => void;
  preMatch: boolean;
}) {
  const players = [match.left, other(match.left)] as const;
  const control = (player: PlayerId) => <View style={styles.control} key={`control-${player}`}>
    {preMatch ? <Pressable accessibilityRole="button" accessibilityLabel={`Cor ${player}`} disabled={disabled || !!match.pending}
      onPress={() => onColor(player)} style={[styles.colorButton, { borderColor: colors[player], opacity: disabled ? 0.4 : 1 }]}>
      <Text style={[styles.label, { color: colors[player] }]}>Cor {player}</Text>
    </Pressable> : timeouts.config.timeoutLimit > 0 && <TimeoutPlayerButton player={player} color={colors[player]} match={match} timeouts={timeouts} disabled={disabled} dispatch={dispatch} />}
  </View>;
  return <View style={styles.header}>
    <View style={styles.edge}>{leading}</View>
    <View style={styles.center}>
      {control(players[0])}
      {players.map(player => <View key={`sets-${player}`} style={[styles.setCell, { backgroundColor: `${colors[player]}18` }]}>
        <Text accessibilityLabel={`${player}: ${match.sets[player]} sets`} style={[styles.setNumber, { color: colors[player] }]}>{match.sets[player]}</Text>
      </View>)}
      {control(players[1])}
    </View>
    <View style={[styles.edge, { alignItems: 'flex-end' }]}>{trailing}</View>
  </View>;
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 6 },
  edge: { flex: 1, minWidth: 0, alignItems: 'flex-start' },
  center: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  control: { width: 96, minHeight: 48 },
  colorButton: { borderWidth: 1, minHeight: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '800' },
  setCell: { width: 30, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  setNumber: { fontSize: 24, fontWeight: '800', includeFontPadding: false },
});

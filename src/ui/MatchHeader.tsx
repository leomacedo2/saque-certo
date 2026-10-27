import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Match, other, PlayerId, Pair } from '../domain/match';
import { TimeoutAction, Timeouts } from '../domain/timeouts';
import { TimeoutPlayerButton } from './TimeoutControls';
import { AthleteColors, ColorIdentity, PLAYER_PALETTE } from '../domain/colors';
import { athletesOf } from '../domain/doubles';

export function MatchHeader({ match, timeouts, colors, athleteColors, disabled, preMatch, leading, trailing, onColor, dispatch }: {
  match: Match; timeouts: Timeouts; colors: Pair<string>; disabled: boolean; leading: ReactNode; trailing: ReactNode;
  onColor: (player: ColorIdentity) => void; dispatch: (action: TimeoutAction) => void;
  athleteColors: AthleteColors;
  preMatch: boolean;
}) {
  const players = [match.left, other(match.left)] as const;
  const control = (player: PlayerId) => <View style={[styles.control, match.mode === 'doubles' && { width: 100 }]} key={`control-${player}`}>
    {preMatch ? <View style={styles.colorGroup}>{(match.mode === 'doubles' ? athletesOf(player) : [player]).map(identity => {
      const color = identity === 'A' || identity === 'B' ? colors[identity] : PLAYER_PALETTE[athleteColors[identity]].hex;
      return <Pressable key={identity} accessibilityRole="button" accessibilityLabel={`Cor ${identity}`} disabled={disabled || !!match.pending}
        onPress={() => onColor(identity)} style={[styles.colorButton, { borderColor: color, opacity: disabled ? 0.4 : 1 }]}>
        <Text style={[styles.label, { color, fontSize: match.mode === 'doubles' ? 11 : 14 }]}>Cor {identity}</Text>
      </Pressable>;
    })}</View> : timeouts.config.timeoutLimit > 0 && <TimeoutPlayerButton player={player} color={colors[player]} match={match} timeouts={timeouts} disabled={disabled} dispatch={dispatch} />}
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
  colorGroup: { flexDirection: 'row', gap: 4 },
  colorButton: { flex: 1, borderWidth: 1, minHeight: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '800' },
  setCell: { width: 30, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  setNumber: { fontSize: 24, fontWeight: '800', includeFontPadding: false },
});

import { StyleSheet, Text, View } from 'react-native';
import { AthleteColors, PLAYER_PALETTE } from '../domain/colors';
import { AthleteId, ServiceOrder } from '../domain/doubles';

export function DoublesAthlete({ athlete, colors, service }: { athlete: AthleteId; colors: AthleteColors; service: ServiceOrder | null }) {
  const color = PLAYER_PALETTE[colors[athlete]].hex;
  const label = service?.server === athlete ? '● SAQUE' : service?.receiver === athlete ? 'RECEBE' : null;
  return <View style={styles.row}>
    <Text style={[styles.name, { color }]}>{athlete}</Text>
    {label && <Text style={[styles.badge, { color: label === '● SAQUE' ? '#111A24' : color, backgroundColor: label === '● SAQUE' ? color : `${color}18` }]}>{label}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 28, gap: 6 },
  name: { fontSize: 20, fontWeight: '800' },
  badge: { fontSize: 11, fontWeight: '900', letterSpacing: 1, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 10 },
});

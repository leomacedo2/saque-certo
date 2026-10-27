import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorId, ColorIdentity, distinctColors, PLAYER_PALETTE } from '../domain/colors';
import { Button, Dialog, shared } from './Controls';

export function ColorPicker({ player, colors, onSelect, onClose }: {
  player: ColorIdentity; colors: Record<string, ColorId>; onSelect: (color: ColorId) => void; onClose: () => void;
}) {
  return <Dialog title={player === 'A' || player === 'B' ? `Cor do Jogador ${player}` : `Cor do atleta ${player}`}>
    <Text style={shared.body}>Cores iguais ou muito próximas às outras identidades ficam indisponíveis.</Text>
    <View style={styles.options}>{(Object.keys(PLAYER_PALETTE) as ColorId[]).map(id => {
      const option = PLAYER_PALETTE[id];
      const disabled = Object.entries(colors).some(([identity, color]) => identity !== player
        && !distinctColors(id, color, Object.keys(colors).length === 4 && !(['A1', 'B1'].includes(player) && ['A1', 'B1'].includes(identity)) ? 60 : 90));
      return <Pressable key={id} accessibilityRole="radio" accessibilityLabel={option.name}
        accessibilityState={{ checked: colors[player] === id, disabled }} disabled={disabled}
        onPress={() => onSelect(id)} style={[styles.option, { borderColor: option.hex, backgroundColor: colors[player] === id ? `${option.hex}25` : 'transparent', opacity: disabled ? 0.3 : 1 }]}>
        <View style={[styles.swatch, { backgroundColor: option.hex }]} /><Text style={{ color: option.hex }}>{option.name}</Text>
      </Pressable>;
    })}</View>
    <Button label="Fechar seletor de cor" onPress={onClose} secondary />
  </Dialog>;
}
const styles = StyleSheet.create({
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 10 },
  option: { minHeight: 48, minWidth: 110, borderWidth: 2, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 18, height: 18, borderRadius: 9 },
});

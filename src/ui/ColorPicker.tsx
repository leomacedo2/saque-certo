import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorId, distinctColors, PLAYER_PALETTE, PlayerColors } from '../domain/colors';
import { other, PlayerId, playerName } from '../domain/match';
import { Button, Dialog, shared } from './Controls';

export function ColorPicker({ player, colors, onSelect, onClose }: {
  player: PlayerId; colors: PlayerColors; onSelect: (color: ColorId) => void; onClose: () => void;
}) {
  return <Dialog title={`Cor do ${playerName(player)}`}>
    <Text style={shared.body}>Cores iguais ou muito próximas à do adversário ficam indisponíveis.</Text>
    <View style={styles.options}>{(Object.keys(PLAYER_PALETTE) as ColorId[]).map(id => {
      const option = PLAYER_PALETTE[id];
      const disabled = !distinctColors(id, colors[other(player)]);
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

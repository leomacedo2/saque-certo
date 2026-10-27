import { Text, View } from 'react-native';
import { Mode } from '../domain/doubles';
import { Button, Dialog, shared } from './Controls';

export function NewMatchDialog({ mode, onMode, onConfirm, onCancel }: { mode: Mode; onMode: (mode: Mode) => void; onConfirm: () => void; onCancel: () => void }) {
  return <Dialog eyebrow="NOVA PARTIDA" title="Iniciar nova partida?">
    <Text style={shared.body}>A partida atual será substituída. Pontos, sets e histórico serão zerados; cores e configurações serão mantidas.</Text>
    <View style={shared.actions}>
      <Button label={`${mode === 'singles' ? '● ' : ''}Individual (1 × 1)`} accessibilityLabel="Individual (1 × 1)" secondary={mode !== 'singles'} onPress={() => onMode('singles')} />
      <Button label={`${mode === 'doubles' ? '● ' : ''}Duplas (2 × 2)`} accessibilityLabel="Duplas (2 × 2)" secondary={mode !== 'doubles'} onPress={() => onMode('doubles')} />
    </View>
    <View style={shared.actions}><Button label="Confirmar nova partida" onPress={onConfirm} /><Button label="Cancelar" secondary onPress={onCancel} /></View>
  </Dialog>;
}

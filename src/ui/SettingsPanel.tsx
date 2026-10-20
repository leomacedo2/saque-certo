import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { BestOf, Settings } from '../domain/match';
import { Button, shared } from './Controls';
import { palette } from './theme';

export function SettingsPanel({ settings, onSave, onClose, onNewMatch, onWarmup, onSwap, swapDisabled }: {
  settings: Settings; onSave: (settings: Settings) => void; onClose: () => void;
  onNewMatch: () => void; onWarmup: () => void; onSwap: () => void; swapDisabled: boolean;
}) {
  const [draft, setDraft] = useState(settings);
  const [target, setTarget] = useState(String(settings.target));
  const [duration, setDuration] = useState(String(settings.warmupSeconds));
  const [error, setError] = useState('');
  const toggle = (key: 'haptics' | 'doubleTapGuard' | 'highContrast' | 'decidingSwitch' | 'sound', label: string) =>
    <View style={styles.row} key={key}><Text style={styles.label}>{label}</Text><Switch accessibilityLabel={label} value={draft[key]} onValueChange={value => setDraft(old => ({ ...old, [key]: value }))} trackColor={{ false: '#344156', true: '#437A64' }} thumbColor={draft[key] ? palette.green : '#A6B4C9'} /></View>;
  const save = () => {
    const points = Number(target);
    const seconds = Number(duration);
    if (!/^\d+$/.test(target) || !Number.isInteger(points) || points < 2 || points > 99
      || !/^\d+$/.test(duration) || !Number.isInteger(seconds) || seconds < 10 || seconds > 3600) {
      setError('Use 2 a 99 pontos e 10 a 3600 segundos.'); return;
    }
    onSave({ ...draft, target: points, warmupSeconds: seconds });
  };
  return <View style={styles.overlay} accessibilityViewIsModal>
    <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Fechar configurações sem salvar" onPress={onClose} />
    <View style={styles.drawer}>
      <View style={styles.top}><Text accessibilityRole="header" style={styles.title}>Configurações</Text><Button label="Fechar" onPress={onClose} secondary /></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Button label="Nova partida" secondary onPress={onNewMatch} />
        <Button label="Aquecimento" secondary onPress={onWarmup} />
        <Text style={styles.section}>FORMATO DA PRÓXIMA PARTIDA</Text>
        <Text style={shared.body}>As regras da partida atual permanecem até iniciar uma nova partida. Preferências valem ao salvar.</Text>
        <View style={styles.row}><Text style={styles.label}>Pontos por set</Text><TextInput accessibilityLabel="Pontos por set" keyboardType="number-pad" value={target} onChangeText={setTarget} maxLength={2} style={styles.input} /></View>
        <View style={styles.options}>{([1, 3, 5, 7] as BestOf[]).map(bestOf => <Pressable key={bestOf} accessibilityRole="radio" accessibilityState={{ checked: draft.bestOf === bestOf }} onPress={() => setDraft(old => ({ ...old, bestOf }))} style={[styles.option, draft.bestOf === bestOf && styles.selected]}><Text style={[styles.optionText, draft.bestOf === bestOf && { color: palette.green }]}>{bestOf === 1 ? 'Set único' : `Melhor de ${bestOf}`}</Text></Pressable>)}</View>
        {toggle('decidingSwitch', 'Troca aos 5 pontos no set decisivo')}
        <Text style={shared.body}>Troca ao final dos sets: obrigatória. Em formatos casuais, o saque passa a alternar a cada ponto no empate em alvo − 1.</Text>
        <Button label="Inverter lados agora" secondary disabled={swapDisabled} onPress={onSwap} />
        <Text style={styles.section}>PREFERÊNCIAS</Text>
        {toggle('haptics', 'Vibração dos toques')}
        {toggle('doubleTapGuard', 'Proteção contra toques duplicados (250 ms)')}
        {toggle('highContrast', 'Alto contraste dos números')}
        <Text style={styles.section}>AQUECIMENTO</Text>
        <View style={styles.row}><Text style={styles.label}>Duração (segundos)</Text><TextInput accessibilityLabel="Duração do aquecimento em segundos" keyboardType="number-pad" value={duration} onChangeText={setDuration} maxLength={4} style={styles.input} /></View>
        {toggle('sound', 'Som ao terminar o aquecimento')}
        {!!error && <Text accessibilityRole="alert" style={{ color: palette.warning }}>{error}</Text>}
        <Button label="Salvar configurações" onPress={save} />
        <Text style={styles.version}>SAQUE CERTO · V1.0.2</Text>
      </ScrollView>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: '#000000AA', zIndex: 10 },
  drawer: { width: '70%', maxWidth: 480, height: '100%', backgroundColor: palette.background, borderRightWidth: 1, borderColor: palette.line },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 8 },
  title: { fontSize: 22, color: palette.text, fontWeight: '800' },
  content: { padding: 18, gap: 14, paddingBottom: 40 },
  section: { fontSize: 11, color: palette.green, letterSpacing: 1.8, fontWeight: '800', marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 48 },
  label: { color: palette.text, fontSize: 15, flex: 1 },
  input: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 10, width: 85, minHeight: 48, color: palette.text, fontSize: 18, padding: 10, textAlign: 'center' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { padding: 12, minHeight: 48, justifyContent: 'center', borderRadius: 10, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  selected: { borderColor: palette.green }, optionText: { color: palette.muted, fontSize: 13 },
  version: { color: palette.muted, fontSize: 10, textAlign: 'center', letterSpacing: 2, marginTop: 14 },
});

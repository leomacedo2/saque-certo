import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { BestOf, PlayerId, Settings } from '../domain/match';
import { Timeouts } from '../domain/timeouts';
import { playerHexColors } from '../domain/colors';
import { Button, Dialog, shared } from './Controls';
import { palette } from './theme';

export function SettingsPanel({ settings, timeouts, onRestore, restoreDisabled, promoteRestore, onColor, onSave, onClose, onNewMatch, onWarmup, onSwap, swapDisabled }: {
  settings: Settings; onSave: (settings: Settings) => void; onClose: () => void;
  timeouts: Timeouts; onRestore: (player: PlayerId) => void; restoreDisabled: boolean;
  promoteRestore: boolean; onColor: (player: PlayerId) => void;
  onNewMatch: () => void; onWarmup: () => void; onSwap: () => void; swapDisabled: boolean;
}) {
  const [draft, setDraft] = useState(settings);
  const [target, setTarget] = useState(String(settings.target));
  const [duration, setDuration] = useState(String(settings.warmupSeconds));
  const [timeoutDuration, setTimeoutDuration] = useState(String(settings.timeoutSeconds));
  const [error, setError] = useState('');
  const [restoring, setRestoring] = useState(false);
  const colors = playerHexColors(settings.colors);
  const restoreEntry = <Button label="Restaurar tempo técnico" secondary disabled={restoreDisabled || timeouts.used.A + timeouts.used.B === 0} onPress={() => setRestoring(true)} />;
  const toggle = (key: 'haptics' | 'doubleTapGuard' | 'highContrast' | 'decidingSwitch', label: string) =>
    <View style={styles.row} key={key}><Text style={styles.label}>{label}</Text><Switch accessibilityLabel={label} value={draft[key]} onValueChange={value => setDraft(old => ({ ...old, [key]: value }))} trackColor={{ false: '#344156', true: '#437A64' }} thumbColor={draft[key] ? palette.green : '#A6B4C9'} /></View>;
  const save = () => {
    const points = Number(target);
    const seconds = Number(duration);
    const timeoutSeconds = Number(timeoutDuration);
    if (!/^\d+$/.test(target) || !Number.isInteger(points) || points < 2 || points > 99
      || !/^\d+$/.test(duration) || !Number.isInteger(seconds) || seconds < 10 || seconds > 3600) {
      setError('Use 2 a 99 pontos e 10 a 3600 segundos.'); return;
    }
    if (!/^\d+$/.test(timeoutDuration) || !Number.isInteger(timeoutSeconds) || timeoutSeconds < 1 || timeoutSeconds > 3600) {
      setError('Use de 1 a 3600 segundos para o tempo técnico.'); return;
    }
    onSave({ ...draft, colors: settings.colors, target: points, warmupSeconds: seconds, timeoutSeconds });
  };
  return <View style={styles.overlay} accessibilityViewIsModal>
    <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Fechar configurações sem salvar" onPress={onClose} />
    <View style={styles.drawer}>
      <View style={styles.top}><Text accessibilityRole="header" style={styles.title}>Configurações</Text><Button label="Fechar" onPress={onClose} secondary /></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {promoteRestore && restoreEntry}
        <Button label="Nova partida" secondary onPress={onNewMatch} />
        <Button label="Aquecimento" secondary onPress={onWarmup} />
        <Text style={styles.section}>FORMATO DA PRÓXIMA PARTIDA</Text>
        <Text style={shared.body}>As regras da partida atual permanecem até iniciar uma nova partida. Preferências valem ao salvar.</Text>
        <View style={styles.row}><Text style={styles.label}>Pontos por set</Text><TextInput accessibilityLabel="Pontos por set" keyboardType="number-pad" value={target} onChangeText={setTarget} maxLength={2} style={styles.input} /></View>
        <View style={styles.options}>{([1, 3, 5, 7] as BestOf[]).map(bestOf => <Pressable key={bestOf} accessibilityRole="radio" accessibilityState={{ checked: draft.bestOf === bestOf }} onPress={() => setDraft(old => ({ ...old, bestOf }))} style={[styles.option, draft.bestOf === bestOf && styles.selected]}><Text style={[styles.optionText, draft.bestOf === bestOf && { color: palette.green }]}>{bestOf === 1 ? 'Set único' : `Melhor de ${bestOf}`}</Text></Pressable>)}</View>
        {toggle('decidingSwitch', 'Troca aos 5 pontos no set decisivo')}
        <Text style={shared.body}>Troca ao final dos sets: obrigatória. Em formatos casuais, o saque passa a alternar a cada ponto no empate em alvo − 1.</Text>
        <Button label="Inverter lados agora" secondary disabled={swapDisabled} onPress={onSwap} />
        <Text style={styles.section}>TEMPO TÉCNICO</Text>
        <Text style={shared.body}>Padrão oficial: 60 segundos e um tempo por jogador na partida inteira. Alterações abaixo valem somente para a próxima partida. Outros valores são formatos casuais.</Text>
        <View style={styles.options}>{[30, 60, 120, 180].map(seconds => <Button key={seconds} label={seconds === 60 ? '1 min (oficial)' : `${seconds} s`} secondary={Number(timeoutDuration) !== seconds} onPress={() => setTimeoutDuration(String(seconds))} />)}</View>
        <View style={styles.row}><Text style={styles.label}>Duração personalizada (segundos)</Text><TextInput accessibilityLabel="Duração do tempo técnico em segundos" keyboardType="number-pad" value={timeoutDuration} onChangeText={setTimeoutDuration} maxLength={4} style={styles.input} /></View>
        <Text style={styles.label}>Quantidade por jogador por partida</Text>
        <View style={styles.options}>{[0, 1, 2, 3].map(limit => <Pressable key={limit} accessibilityRole="radio" accessibilityState={{ checked: draft.timeoutLimit === limit }} onPress={() => setDraft(old => ({ ...old, timeoutLimit: limit }))} style={[styles.option, draft.timeoutLimit === limit && styles.selected]}><Text style={[styles.optionText, draft.timeoutLimit === limit && { color: palette.green }]}>{limit === 0 ? 'Desativado' : limit === 1 ? '1 (oficial)' : String(limit)}</Text></Pressable>)}</View>
        {!promoteRestore && restoreEntry}
        <Text style={styles.section}>CORES DOS JOGADORES</Text>
        <View style={styles.options}>{(['A', 'B'] as PlayerId[]).map(player => <Pressable key={player} accessibilityRole="button" accessibilityLabel={`Cor ${player} no menu`} onPress={() => onColor(player)} style={[styles.option, { borderColor: colors[player] }]}><Text style={{ color: colors[player] }}>Cor {player}</Text></Pressable>)}</View>
        <Text style={styles.section}>PREFERÊNCIAS</Text>
        {toggle('haptics', 'Vibração dos toques')}
        {toggle('doubleTapGuard', 'Proteção contra toques duplicados (250 ms)')}
        {toggle('highContrast', 'Alto contraste dos números')}
        <Text style={styles.section}>AQUECIMENTO</Text>
        <View style={styles.row}><Text style={styles.label}>Duração (segundos)</Text><TextInput accessibilityLabel="Duração do aquecimento em segundos" keyboardType="number-pad" value={duration} onChangeText={setDuration} maxLength={4} style={styles.input} /></View>
        <Text style={shared.body}>Ao terminar, o alarme toca até você pará-lo. A reprodução respeita o áudio e as restrições do dispositivo.</Text>
        {!!error && <Text accessibilityRole="alert" style={{ color: palette.warning }}>{error}</Text>}
        <Button label="Salvar configurações" onPress={save} />
        <Text style={styles.version}>SAQUE CERTO · V1.3.0</Text>
      </ScrollView>
    </View>
    {restoring && <Dialog title="Restaurar tempo técnico">
      <Text style={shared.body}>Selecione o jogador cujo registro foi feito por engano.</Text>
      <View style={shared.actions}>{(['A', 'B'] as PlayerId[]).map(player => <Button key={player} label={`Restaurar para Jogador ${player}`} secondary disabled={restoreDisabled || timeouts.used[player] === 0} onPress={() => onRestore(player)} />)}
        <Button label="Voltar ao menu" secondary onPress={() => setRestoring(false)} />
      </View>
    </Dialog>}
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

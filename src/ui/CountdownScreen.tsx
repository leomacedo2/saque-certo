import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, BackHandler, StyleSheet, Text, View } from 'react-native';
import { createLoopingAlarm } from '../audio/loopingAlarm';
import { formatTime, remainingTime, TimerState } from '../domain/timer';
import { Button, Dialog, shared } from './Controls';
import { LargeNumber } from './LargeNumber';
import { palette } from './theme';

export function CountdownScreen({ timer, initialSeconds, onToggle, onRestart, onClose, technical }: {
  timer: TimerState; initialSeconds: number; onToggle: (now: number) => void;
  onRestart?: () => void; onClose: () => void;
  technical?: { label: string; color: string; secondLabel?: { label: string; color: string }; started: boolean; onCancel: () => void };
}) {
  const [now, setNow] = useState(() => Date.now());
  const [acknowledged, setAcknowledged] = useState(false);
  const [exitPrompt, setExitPrompt] = useState(false);
  const [cancelPrompt, setCancelPrompt] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audio = useAudioPlayer(require('../../assets/whistle.wav'));
  const alarm = useMemo(() => createLoopingAlarm(audio, () => setAudioModeAsync({
    playsInSilentMode: false,
    shouldPlayInBackground: false,
    interruptionMode: 'doNotMix',
  })), [audio]);
  const remaining = remainingTime(timer, now);
  const ended = remaining === 0;
  const ringing = ended && !acknowledged;
  const stopAlarm = () => {
    alarm.stop();
    setAcknowledged(true);
    setAudioError(false);
    setExitPrompt(false);
  };
  const requestExit = useCallback(() => {
    if (cancelPrompt) { setCancelPrompt(false); return; }
    if (exitPrompt) { setExitPrompt(false); return; }
    if (ringing || technical) setExitPrompt(true);
    else { alarm.stop(); onClose(); }
  }, [ringing, alarm, onClose, technical, cancelPrompt, exitPrompt]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') setNow(Date.now()); });
    return () => { clearInterval(interval); subscription.remove(); };
  }, []);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      requestExit();
      return true;
    });
    return () => subscription.remove();
  }, [requestExit]);
  useEffect(() => {
    let cancelled = false;
    if (ringing) void alarm.start().catch(() => { if (!cancelled) setAudioError(true); });
    return () => {
      cancelled = true;
      // useAudioPlayer may already have released its native object on unmount.
      // stop still invalidates asynchronous starts before touching the player.
      try { alarm.stop(); } catch { /* A released player is already silent. */ }
    };
  }, [ringing, alarm]);

  return <View style={styles.container}>
    {technical && <Text style={[styles.identity, { color: technical.color }]}>{technical.label}{technical.secondLabel && <Text style={{ color: technical.secondLabel.color }}>{technical.secondLabel.label}</Text>}</Text>}
    <LargeNumber value={formatTime(remaining)} color={ended ? palette.warning : palette.text} liveRegion={ended ? 'assertive' : 'none'} />
    {audioError && <Text accessibilityRole="alert" style={styles.error}>Não foi possível reproduzir o alarme. Confira o áudio do dispositivo.</Text>}
    <View style={styles.controls}>
      {ringing && !technical ? <View style={styles.stop}><Button label="PARAR ALARME" onPress={stopAlarm} large /></View>
        : !ended && <Button label={timer.deadline !== null ? 'Pausar' : (!technical?.started && remaining === initialSeconds * 1000) ? 'Iniciar' : 'Continuar'} onPress={() => {
          const timestamp = Date.now(); setNow(timestamp);
          onToggle(timestamp);
        }} />}
      {!technical && <Button label="Reiniciar" secondary onPress={() => {
        alarm.stop(); setAcknowledged(false); setAudioError(false); setExitPrompt(false);
        onRestart?.(); setNow(Date.now());
      }} />}
      {technical ? <Button label={ended ? 'ENCERRAR TEMPO' : 'Encerrar tempo'} large={ended} secondary={!ended} onPress={() => { stopAlarm(); onClose(); }} />
        : <Button label="Voltar à partida" secondary onPress={requestExit} />}
      {technical && !technical.started && <Button label="Cancelar solicitação" secondary onPress={() => setCancelPrompt(true)} />}
    </View>
    {exitPrompt && <Dialog title={technical ? 'Encerrar tempo técnico?' : 'Parar o alarme e voltar?'}>
      <Text style={shared.body}>{technical ? 'O pedido continuará consumido. Para devolver um tempo, use a correção específica no menu.' : 'O alarme continua tocando até você confirmar.'}</Text>
      <View style={shared.actions}>
        <Button label={technical ? 'Confirmar encerramento' : 'Parar alarme e voltar'} onPress={() => { stopAlarm(); onClose(); }} />
        <Button label="Continuar aqui" secondary onPress={() => setExitPrompt(false)} />
      </View>
    </Dialog>}
    {cancelPrompt && technical && <Dialog title="Cancelar solicitação por engano?">
      <Text style={shared.body}>A contagem ainda não começou. O tempo será devolvido a quem solicitou, sem alterar o placar.</Text>
      <View style={shared.actions}>
        <Button label="Confirmar cancelamento" onPress={() => { alarm.stop(); technical.onCancel(); }} />
        <Button label="Manter solicitação" secondary onPress={() => setCancelPrompt(false)} />
      </View>
    </Dialog>}
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background, paddingHorizontal: 12, paddingBottom: 8 },
  identity: { textAlign: 'center', fontSize: 14, fontWeight: '700', paddingVertical: 6 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, justifyContent: 'center' },
  stop: { minWidth: 240, paddingVertical: 6 },
  error: { color: palette.warning, textAlign: 'center', fontSize: 14, marginBottom: 8 },
});

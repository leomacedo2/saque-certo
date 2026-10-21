import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, BackHandler, StyleSheet, Text, View } from 'react-native';
import { createLoopingAlarm } from '../audio/loopingAlarm';
import { createTimer, formatTime, pauseTimer, remainingTime, startTimer } from '../domain/timer';
import { Button, Dialog, shared } from './Controls';
import { LargeNumber } from './LargeNumber';
import { palette } from './theme';

export function Warmup({ seconds, onClose }: { seconds: number; onClose: () => void }) {
  const [timer, setTimer] = useState(() => createTimer(seconds));
  const [now, setNow] = useState(() => Date.now());
  const [initialSeconds] = useState(seconds);
  const [acknowledged, setAcknowledged] = useState(false);
  const [exitPrompt, setExitPrompt] = useState(false);
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
    if (ringing) setExitPrompt(true);
    else { alarm.stop(); onClose(); }
  }, [ringing, alarm, onClose]);

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
    <LargeNumber value={formatTime(remaining)} color={ended ? palette.warning : palette.text} liveRegion={ended ? 'assertive' : 'none'} />
    {audioError && <Text accessibilityRole="alert" style={styles.error}>Não foi possível reproduzir o alarme. Confira o áudio do dispositivo.</Text>}
    <View style={styles.controls}>
      {ringing ? <View style={styles.stop}><Button label="PARAR ALARME" onPress={stopAlarm} large /></View>
        : !ended && <Button label={timer.deadline !== null ? 'Pausar' : remaining === initialSeconds * 1000 ? 'Iniciar' : 'Continuar'} onPress={() => {
          const timestamp = Date.now(); setNow(timestamp);
          setTimer(current => current.deadline === null ? startTimer(current, timestamp) : pauseTimer(current, timestamp));
        }} />}
      <Button label="Reiniciar" secondary onPress={() => {
        alarm.stop(); setAcknowledged(false); setAudioError(false); setExitPrompt(false);
        setTimer(createTimer(initialSeconds)); setNow(Date.now());
      }} />
      <Button label="Voltar à partida" secondary onPress={requestExit} />
    </View>
    {exitPrompt && <Dialog title="Parar o alarme e voltar?">
      <Text style={shared.body}>O alarme continua tocando até você confirmar.</Text>
      <View style={shared.actions}>
        <Button label="Parar alarme e voltar" onPress={() => { stopAlarm(); onClose(); }} />
        <Button label="Continuar aqui" secondary onPress={() => setExitPrompt(false)} />
      </View>
    </Dialog>}
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background, paddingHorizontal: 12, paddingBottom: 8 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, justifyContent: 'center' },
  stop: { minWidth: 240, paddingVertical: 6 },
  error: { color: palette.warning, textAlign: 'center', fontSize: 14, marginBottom: 8 },
});

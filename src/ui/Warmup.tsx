import { useAudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { createTimer, formatTime, pauseTimer, remainingTime, startTimer } from '../domain/timer';
import { Button } from './Controls';
import { palette } from './theme';
import { LargeNumber } from './LargeNumber';

export function Warmup({ seconds, sound, onClose }: { seconds: number; sound: boolean; onClose: () => void }) {
  const [timer, setTimer] = useState(() => createTimer(seconds));
  const [now, setNow] = useState(() => Date.now());
  const [initialSeconds] = useState(seconds);
  const notified = useRef(false);
  const audio = useAudioPlayer(require('../../assets/whistle.wav'));
  const remaining = remainingTime(timer, now);
  const ended = remaining === 0;
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') setNow(Date.now()); });
    return () => { clearInterval(interval); subscription.remove(); };
  }, []);
  useEffect(() => {
    if (!ended || notified.current) return;
    notified.current = true;
    if (sound) {
      void audio.seekTo(0).then(() => audio.play()).catch(() => undefined);
    }
  }, [ended, sound, audio]);
  return <View style={[styles.container, ended && { backgroundColor: '#263F32' }]}>
    <View style={styles.top}><Text style={[styles.label, ended && { color: palette.green }]}>{ended ? 'TEMPO ENCERRADO' : 'AQUECIMENTO'}</Text><Button label="Voltar à partida" secondary onPress={onClose} /></View>
    <LargeNumber value={formatTime(remaining)} color={ended ? palette.green : palette.text} liveRegion={ended ? 'assertive' : 'none'} />
    <View style={styles.actions}>
      <Button label={ended ? 'Concluído' : timer.deadline !== null ? 'Pausar' : remaining === initialSeconds * 1000 ? 'Iniciar' : 'Continuar'} disabled={ended} onPress={() => {
        const timestamp = Date.now(); setNow(timestamp);
        setTimer(current => current.deadline === null ? startTimer(current, timestamp) : pauseTimer(current, timestamp));
      }} />
      <Button label="Reiniciar" secondary onPress={() => { notified.current = false; setTimer(createTimer(initialSeconds)); setNow(Date.now()); }} />
    </View>
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, borderRadius: 20, backgroundColor: palette.surface, justifyContent: 'space-between' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: palette.muted, fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  actions: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
});

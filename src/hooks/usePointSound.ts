import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useEffect, useMemo } from 'react';
import { createPointSound } from '../audio/pointSound';

export function usePointSound(enabled: boolean) {
  const player = useAudioPlayer(require('../../assets/point.wav'));
  const sound = useMemo(() => createPointSound(player, () => setAudioModeAsync({
    playsInSilentMode: false,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
  })), [player]);
  useEffect(() => {
    if (!enabled) sound.stop();
    return () => sound.stop();
  }, [enabled, sound]);
  return () => { if (enabled) void sound.play(); };
}

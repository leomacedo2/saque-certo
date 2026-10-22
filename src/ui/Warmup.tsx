import { useState } from 'react';
import { createTimer, pauseTimer, startTimer } from '../domain/timer';
import { CountdownScreen } from './CountdownScreen';

export function Warmup({ seconds, onClose }: { seconds: number; onClose: () => void }) {
  const [initialSeconds] = useState(seconds);
  const [timer, setTimer] = useState(() => createTimer(seconds));
  return <CountdownScreen timer={timer} initialSeconds={initialSeconds} onClose={onClose}
    onToggle={now => setTimer(current => current.deadline === null ? startTimer(current, now) : pauseTimer(current, now))}
    onRestart={() => setTimer(createTimer(initialSeconds))} />;
}

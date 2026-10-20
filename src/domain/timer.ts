export interface TimerState { remainingMs: number; deadline: number | null }
export const createTimer = (seconds: number): TimerState => ({ remainingMs: seconds * 1000, deadline: null });
export const remainingTime = (timer: TimerState, now: number): number =>
  Math.max(0, timer.deadline === null ? timer.remainingMs : timer.deadline - now);
export const startTimer = (timer: TimerState, now: number): TimerState =>
  timer.deadline !== null || timer.remainingMs <= 0 ? timer : { ...timer, deadline: now + timer.remainingMs };
export const pauseTimer = (timer: TimerState, now: number): TimerState =>
  ({ remainingMs: remainingTime(timer, now), deadline: null });
export function formatTime(milliseconds: number): string {
  const seconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

import { createTimer, formatTime, pauseTimer, remainingTime, startTimer } from '../src/domain/timer';
import { createWriteQueue } from '../src/storage/persistence';

test('cronômetro desconta tempo real mesmo sem receber ticks', () => {
  const timer = startTimer(createTimer(120), 1000);
  expect(remainingTime(timer, 61000)).toBe(60000);
  expect(remainingTime(timer, 150000)).toBe(0);
  expect(startTimer(timer, 9999)).toBe(timer);
});
test('pausa e continua sem perder o tempo restante', () => {
  const paused = pauseTimer(startTimer(createTimer(120), 1000), 31000);
  expect(remainingTime(paused, 999000)).toBe(90000);
  const continued = startTimer(paused, 1000000);
  expect(remainingTime(continued, 1010000)).toBe(80000);
});
test('fim, reinício e formatação', () => {
  const ended = pauseTimer(startTimer(createTimer(10), 0), 11000);
  expect(startTimer(ended, 12000)).toBe(ended);
  expect(createTimer(120).remainingMs).toBe(120000);
  expect(formatTime(120000)).toBe('02:00');
  expect(formatTime(1)).toBe('00:01');
  expect(formatTime(-10)).toBe('00:00');
});
test('fila de persistência mantém a ordem e se recupera após falha', async () => {
  const calls: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const write = createWriteQueue(async value => {
    calls.push(value);
    if (value === 'primeiro') { await gate; throw new Error('disco indisponível'); }
  });
  const first = write('primeiro').catch(() => undefined);
  const second = write('segundo');
  await Promise.resolve(); await Promise.resolve();
  expect(calls).toEqual(['primeiro']);
  release();
  await first; await second;
  expect(calls).toEqual(['primeiro', 'segundo']);
});

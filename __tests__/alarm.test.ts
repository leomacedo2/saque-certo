import { createLoopingAlarm } from '../src/audio/loopingAlarm';

function setup(configure: () => Promise<void> = jest.fn(async (): Promise<void> => {})) {
  const player = { loop: false, play: jest.fn(), pause: jest.fn(), seekTo: jest.fn(async (_seconds: number): Promise<void> => {}) };
  return { player, configure, alarm: createLoopingAlarm(player, configure) };
}
test('alarme usa repetição nativa e não inicia reproduções simultâneas', async () => {
  const { player, configure, alarm } = setup();
  await Promise.all([alarm.start(), alarm.start(), alarm.start()]);
  expect(configure).toHaveBeenCalledTimes(1);
  expect(player.seekTo).toHaveBeenCalledWith(0);
  expect(player.loop).toBe(true);
  expect(player.play).toHaveBeenCalledTimes(1);
  await alarm.start();
  expect(player.play).toHaveBeenCalledTimes(1);
});
test('parar interrompe imediatamente, sem esperar seek ou configuração', async () => {
  const { player, alarm } = setup();
  await alarm.start();
  alarm.stop();
  expect(player.pause).toHaveBeenCalledTimes(1);
  expect(player.loop).toBe(false);
});
test('reiniciar permite um novo alarme sem manter o anterior', async () => {
  const { player, alarm } = setup();
  await alarm.start(); alarm.stop(); await alarm.start();
  expect(player.pause).toHaveBeenCalledTimes(1);
  expect(player.play).toHaveBeenCalledTimes(2);
  expect(player.loop).toBe(true);
});
test('sair enquanto configura o áudio cancela a reprodução pendente', async () => {
  let release!: () => void;
  const configure = jest.fn(() => new Promise<void>(resolve => { release = resolve; }));
  const { player, alarm } = setup(configure);
  const pending = alarm.start();
  alarm.stop(); release(); await pending;
  expect(player.play).not.toHaveBeenCalled();
  expect(player.seekTo).not.toHaveBeenCalled();
});
test('parar durante seek não deixa o som voltar depois', async () => {
  const { player, alarm } = setup();
  let release!: () => void;
  player.seekTo.mockImplementation(() => new Promise<void>(resolve => { release = resolve; }));
  const pending = alarm.start();
  await Promise.resolve();
  alarm.stop(); release(); await pending;
  expect(player.play).not.toHaveBeenCalled();
});
test('finalização de uma tentativa antiga não interfere em um novo alarme', async () => {
  const { player, alarm } = setup();
  let release!: () => void;
  player.seekTo.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve; }));
  const old = alarm.start(); await Promise.resolve();
  alarm.stop(); await alarm.start(); release(); await old;
  expect(player.play).toHaveBeenCalledTimes(1);
  expect(player.loop).toBe(true);
});
test('falha de áudio é reportada e permite tentar novamente', async () => {
  const { player, alarm } = setup();
  player.seekTo.mockRejectedValueOnce(new Error('áudio indisponível'));
  await expect(alarm.start()).rejects.toThrow('áudio indisponível');
  expect(player.play).not.toHaveBeenCalled();
  expect(player.loop).toBe(false);
  await alarm.start();
  expect(player.play).toHaveBeenCalledTimes(1);
});

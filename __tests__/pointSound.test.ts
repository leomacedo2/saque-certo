import { createPointSound } from '../src/audio/pointSound';

function setup(configure = () => Promise.resolve()) {
  const player = { volume: 1, pause: jest.fn(), seekTo: jest.fn(async () => {}), play: jest.fn() };
  return { player, sound: createPointSound(player, configure) };
}

test('restarts the short sound at low volume for each accepted point', async () => {
  const { player, sound } = setup();
  await sound.play();
  await sound.play();
  expect(player.volume).toBe(0.75);
  expect(player.seekTo.mock.calls).toEqual([[0], [0]]);
  expect(player.play).toHaveBeenCalledTimes(2);
});

test('leaving the scoreboard cancels a sound still being prepared', async () => {
  let finish!: () => void;
  const { player, sound } = setup(() => new Promise<void>(resolve => { finish = resolve; }));
  const pending = sound.play();
  sound.stop();
  finish();
  await pending;
  expect(player.pause).toHaveBeenCalled();
  expect(player.play).not.toHaveBeenCalled();
});

test('rapid requests only play the most recent pending sound', async () => {
  const { player, sound } = setup();
  await Promise.all([sound.play(), sound.play()]);
  expect(player.play).toHaveBeenCalledTimes(1);
});

test('an audio failure does not escape into point handling', async () => {
  const { player, sound } = setup(async () => { throw new Error('Audio unavailable'); });
  await expect(sound.play()).resolves.toBeUndefined();
  expect(player.play).not.toHaveBeenCalled();
});

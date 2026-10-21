export interface AlarmPlayer {
  loop: boolean;
  play(): void;
  pause(): void;
  seekTo(seconds: number): Promise<void>;
}

/** Owns one player; stopping invalidates pending asynchronous starts. */
export function createLoopingAlarm(player: AlarmPlayer, configure: () => Promise<void>) {
  let active = false;
  let generation = 0;
  let pending: Promise<void> | null = null;
  return {
    start(): Promise<void> {
      if (active) return pending ?? Promise.resolve();
      active = true;
      const run = ++generation;
      pending = (async () => {
        try {
          await configure();
          if (!active || run !== generation) return;
          await player.seekTo(0);
          if (!active || run !== generation) return;
          player.loop = true;
          player.play();
        } catch (error) {
          if (run !== generation) return;
          active = false;
          player.loop = false;
          throw error;
        }
      })();
      return pending;
    },
    stop(): void {
      active = false;
      generation++;
      pending = null;
      player.pause();
      player.loop = false;
    },
  };
}

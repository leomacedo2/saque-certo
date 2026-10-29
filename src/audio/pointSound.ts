interface PointPlayer {
  volume: number;
  pause(): void;
  seekTo(seconds: number): Promise<void>;
  play(): void;
}

/** A newer tap or leaving the scoreboard invalidates any pending playback. */
export function createPointSound(player: PointPlayer, configure: () => Promise<void>) {
  let generation = 0;
  return {
    async play() {
      const run = ++generation;
      try {
        await configure();
        if (run !== generation) return;
        player.volume = 0.25;
        await player.seekTo(0);
        if (run === generation) player.play();
      } catch { /* Sound must never prevent a point from being recorded. */ }
    },
    stop() {
      generation++;
      try { player.pause(); } catch { /* The native player may already be released. */ }
    },
  };
}

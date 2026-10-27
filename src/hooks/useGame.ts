import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Action, DEFAULT_SETTINGS, Settings } from '../domain/match';
import { newGame, PreparationAction, reduceGame } from '../domain/game';
import { TimeoutAction } from '../domain/timeouts';
import { Mode } from '../domain/doubles';
import { SavedGame, decodeGame, encodeGame } from '../storage/codec';
import { createWriteQueue } from '../storage/persistence';

const KEY = '@saque-certo/game-v1';
const write = createWriteQueue(value => AsyncStorage.setItem(KEY, value));
export function useGame() {
  const [game, setGame] = useState(() => newGame());
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<'loading' | 'recover' | 'ready' | 'error'>('loading');
  const [saved, setSaved] = useState<SavedGame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveTick, setSaveTick] = useState(0);
  const [persisted, setPersisted] = useState<string | null>(null);
  const snapshot = useMemo(() => encodeGame(settings, game.session, game.timeouts, game), [settings, game]);
  const revision = useRef(0);
  const load = useCallback(() => {
    return AsyncStorage.getItem(KEY).then(raw => {
      if (raw) {
        setSaved(decodeGame(raw));
        setStatus('recover');
      } else setStatus('ready');
    }).catch(() => {
      setError('Não foi possível ler a partida salva. Tente novamente ou inicie uma nova partida.');
      setStatus('error');
    });
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (status !== 'ready') return;
    const id = ++revision.current;
    void write(snapshot).then(() => {
      if (id === revision.current) { setError(null); setPersisted(snapshot); }
    }).catch(() => {
      if (id === revision.current) {
        setError('A partida ainda não foi salva. Mantenha o app aberto e toque em tentar salvar.');
      }
    });
  }, [snapshot, status, saveTick]);
  return {
    session: game.session, timeouts: game.timeouts, phase: game.phase, warmup: game.warmup, settings, status, saved, error, saving: status === 'ready' && persisted !== snapshot && !error,
    dispatchPreparation: (action: PreparationAction) => setGame(current => reduceGame(current, { kind: 'preparation', action })),
    dispatch: (action: Action) => setGame(current => reduceGame(current, { kind: 'match', action })),
    dispatchTimeout: (action: TimeoutAction) => setGame(current => reduceGame(current, { kind: 'timeout', action })),
    setSettings,
    restart: (mode: Mode = settings.mode) => { const preferences = { ...settings, mode }; setSettings(preferences); setGame(newGame(preferences)); },
    retryLoad: () => { setStatus('loading'); setError(null); return load(); },
    retrySave: () => setSaveTick(tick => tick + 1),
    resume: () => {
      if (!saved) return;
      setGame({ session: saved.session, timeouts: saved.timeouts, phase: saved.phase, warmup: saved.warmup }); setSettings(saved.settings); setStatus('ready');
    },
    discard: (mode?: Mode) => {
      const prior = saved?.settings ?? settings;
      const preferences = { ...prior, mode: mode ?? prior.mode };
      setSettings(preferences); setGame(newGame(preferences));
      setSaved(null); setError(null); setStatus('ready');
    },
  };
}

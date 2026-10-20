import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Action, DEFAULT_SETTINGS, Settings, newSession, reduceSession } from '../domain/match';
import { SavedGame, decodeGame, encodeGame } from '../storage/codec';
import { createWriteQueue } from '../storage/persistence';

const KEY = '@saque-certo/game-v1';
const write = createWriteQueue(value => AsyncStorage.setItem(KEY, value));
export function useGame() {
  const [session, setSession] = useState(() => newSession());
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<'loading' | 'recover' | 'ready' | 'error'>('loading');
  const [saved, setSaved] = useState<SavedGame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveTick, setSaveTick] = useState(0);
  const [persisted, setPersisted] = useState<string | null>(null);
  const snapshot = useMemo(() => encodeGame(settings, session), [settings, session]);
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
    session, settings, status, saved, error, saving: status === 'ready' && persisted !== snapshot && !error,
    dispatch: (action: Action) => setSession(current => reduceSession(current, action)),
    setSettings,
    restart: () => setSession(newSession(settings)),
    retryLoad: () => { setStatus('loading'); setError(null); return load(); },
    retrySave: () => setSaveTick(tick => tick + 1),
    resume: () => {
      if (!saved) return;
      setSession(saved.session); setSettings(saved.settings); setStatus('ready');
    },
    discard: () => {
      const preferences = saved?.settings ?? settings;
      setSettings(preferences); setSession(newSession(preferences));
      setSaved(null); setError(null); setStatus('ready');
    },
  };
}

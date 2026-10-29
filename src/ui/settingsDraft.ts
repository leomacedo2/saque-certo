import { Settings } from '../domain/match';

export function hasUnsavedSettings(settings: Settings, draft: Settings, target: string, duration: string, timeoutDuration: string) {
  return target !== String(settings.target) || duration !== String(settings.warmupSeconds)
    || timeoutDuration !== String(settings.timeoutSeconds)
    || (['bestOf', 'decidingSwitch', 'timeoutLimit', 'haptics', 'pointSound', 'doubleTapGuard', 'highContrast'] as const)
      .some(key => draft[key] !== settings[key]);
}

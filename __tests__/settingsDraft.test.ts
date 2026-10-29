import { DEFAULT_SETTINGS, Settings } from '../src/domain/match';
import { hasUnsavedSettings } from '../src/ui/settingsDraft';

const dirty = (draft: Settings, target = '11', duration = '120', timeoutDuration = '60') =>
  hasUnsavedSettings(DEFAULT_SETTINGS, draft, target, duration, timeoutDuration);

test('unchanged settings and a reverted change do not block closing', () => {
  expect(dirty({ ...DEFAULT_SETTINGS })).toBe(false);
  expect(dirty({ ...DEFAULT_SETTINGS, pointSound: !DEFAULT_SETTINGS.pointSound })).toBe(true);
  expect(dirty({ ...DEFAULT_SETTINGS, pointSound: DEFAULT_SETTINGS.pointSound })).toBe(false);
});
test.each(['haptics', 'pointSound', 'doubleTapGuard', 'highContrast', 'decidingSwitch'] as const)('detects preference %s', key => {
  expect(dirty({ ...DEFAULT_SETTINGS, [key]: !DEFAULT_SETTINGS[key] })).toBe(true);
});
test('detects format, time rights and every text field, including invalid edits', () => {
  expect(dirty({ ...DEFAULT_SETTINGS, bestOf: 1 })).toBe(true);
  expect(dirty({ ...DEFAULT_SETTINGS, timeoutLimit: 2 })).toBe(true);
  expect(dirty(DEFAULT_SETTINGS, '')).toBe(true);
  expect(dirty(DEFAULT_SETTINGS, '11', '60')).toBe(true);
  expect(dirty(DEFAULT_SETTINGS, '11', '120', '30')).toBe(true);
});

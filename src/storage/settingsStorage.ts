import AsyncStorage from '@react-native-async-storage/async-storage';

export type InputMethod = 'voice' | 'manual';

export interface AppSettings {
  scoreInputMethod: InputMethod;
  contentInputMethod: InputMethod;
}

const SETTINGS_KEY = 'app_settings';

const DEFAULT_SETTINGS: AppSettings = {
  scoreInputMethod: 'voice',
  contentInputMethod: 'voice',
};

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as AppSettings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function updateAppSettings(
  partial: Partial<AppSettings>,
): Promise<AppSettings> {
  const current = await getAppSettings();
  const updated = { ...current, ...partial };
  await saveAppSettings(updated);
  return updated;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupportedCharacterId } from '../constants/characters';

export type InputMethod = 'voice' | 'manual';

export interface AppSettings {
  scoreInputMethod: InputMethod;
  contentInputMethod: InputMethod;
  selectedCharacterId: string;
}

const SETTINGS_KEY = 'app_settings';

const DEFAULT_SETTINGS: AppSettings = {
  scoreInputMethod: 'voice',
  contentInputMethod: 'voice',
  selectedCharacterId: 'leon',
};

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    // Validate selectedCharacterId — unsupported or missing IDs (e.g. old 'hana') fall back to leon.
    const storedId = parsed.selectedCharacterId;
    const selectedCharacterId =
      storedId && isSupportedCharacterId(storedId) ? storedId : 'leon';
    return { ...DEFAULT_SETTINGS, ...parsed, selectedCharacterId };
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

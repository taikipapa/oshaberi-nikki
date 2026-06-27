import AsyncStorage from '@react-native-async-storage/async-storage';

export type InputMethod = 'voice' | 'manual';

export interface AppSettings {
  scoreInputMethod: InputMethod;
  contentInputMethod: InputMethod;
  selectedCharacterId: string;
  unlockedCharacterIds: string[];
}

const SETTINGS_KEY = 'app_settings';

// Characters that are always unlocked regardless of stored state.
const DEFAULT_UNLOCKED_IDS = ['leon', 'miria', 'himari', 'chiyobaa'];

const DEFAULT_SETTINGS: AppSettings = {
  scoreInputMethod: 'voice',
  contentInputMethod: 'voice',
  selectedCharacterId: 'leon',
  unlockedCharacterIds: [...DEFAULT_UNLOCKED_IDS],
};

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS, unlockedCharacterIds: [...DEFAULT_UNLOCKED_IDS] };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;

    // Merge stored unlocked IDs with defaults so the 4 base characters
    // are always available even if storage is from an older version.
    const stored = parsed.unlockedCharacterIds;
    const extra = Array.isArray(stored) ? stored : [];
    const unlockedCharacterIds = [...new Set([...DEFAULT_UNLOCKED_IDS, ...extra])];

    // selectedCharacterId must be in the unlocked list; otherwise fall back to leon.
    const storedId = parsed.selectedCharacterId;
    const selectedCharacterId =
      storedId && unlockedCharacterIds.includes(storedId) ? storedId : 'leon';

    return { ...DEFAULT_SETTINGS, ...parsed, selectedCharacterId, unlockedCharacterIds };
  } catch {
    return { ...DEFAULT_SETTINGS, unlockedCharacterIds: [...DEFAULT_UNLOCKED_IDS] };
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

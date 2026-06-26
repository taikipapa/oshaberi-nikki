import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiaryEntry } from '../types';

const DIARY_KEY_PREFIX = 'diary_';
const ALL_IDS_KEY = 'diary_all_ids';

function entryKey(targetDate: string): string {
  return `${DIARY_KEY_PREFIX}${targetDate}`;
}

export async function saveDiaryEntry(entry: DiaryEntry): Promise<void> {
  await AsyncStorage.setItem(entryKey(entry.targetDate), JSON.stringify(entry));

  const raw = await AsyncStorage.getItem(ALL_IDS_KEY);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  if (!ids.includes(entry.targetDate)) {
    ids.push(entry.targetDate);
    await AsyncStorage.setItem(ALL_IDS_KEY, JSON.stringify(ids));
  }
}

export async function getDiaryEntryByDate(
  targetDate: string,
): Promise<DiaryEntry | null> {
  const raw = await AsyncStorage.getItem(entryKey(targetDate));
  if (!raw) return null;
  return JSON.parse(raw) as DiaryEntry;
}

export async function getDiaryEntriesByMonth(
  year: number,
  month: number,
): Promise<DiaryEntry[]> {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const raw = await AsyncStorage.getItem(ALL_IDS_KEY);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  const monthIds = ids.filter((id) => id.startsWith(prefix));

  const entries = await Promise.all(
    monthIds.map((id) => getDiaryEntryByDate(id)),
  );
  return entries.filter((e): e is DiaryEntry => e !== null);
}

export async function updateDiaryEntry(entry: DiaryEntry): Promise<void> {
  const updated = { ...entry, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(entryKey(entry.targetDate), JSON.stringify(updated));
}

export async function deleteDiaryEntry(
  targetDate: string,
): Promise<void> {
  await AsyncStorage.removeItem(entryKey(targetDate));

  const raw = await AsyncStorage.getItem(ALL_IDS_KEY);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  const filtered = ids.filter((id) => id !== targetDate);
  await AsyncStorage.setItem(ALL_IDS_KEY, JSON.stringify(filtered));
}

/**
 * Education worksheet level (1–10). Persisted so user choice and progress are remembered.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const EDUCATION_LEVEL_KEY = '@motustots/education_level';
const MIN_LEVEL = 1;
const MAX_LEVEL = 10;

export function clampLevel(level: number): number {
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, Math.round(level)));
}

export async function getEducationLevel(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(EDUCATION_LEVEL_KEY);
    if (raw == null) return MIN_LEVEL;
    const n = parseInt(raw, 10);
    return clampLevel(Number.isFinite(n) ? n : MIN_LEVEL);
  } catch {
    return MIN_LEVEL;
  }
}

export async function setEducationLevel(level: number): Promise<void> {
  await AsyncStorage.setItem(EDUCATION_LEVEL_KEY, String(clampLevel(level)));
}

export { MIN_LEVEL, MAX_LEVEL };

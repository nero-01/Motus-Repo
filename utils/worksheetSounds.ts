/**
 * Child-friendly success and fail sound effects for educational worksheets.
 * Uses local assets (success.mp3, wrong.mp3) at reduced volume.
 * Victory/defeat sounds use victory.mp3/defeat.mp3 if available, otherwise fall back to success/wrong.
 */

import { Audio } from 'expo-av';

const VOLUME = 0.5;

// Local sound files from assets/sounds/
const SUCCESS_SOUND = require('../assets/sounds/success.mp3');
const WRONG_SOUND = require('../assets/sounds/wrong.mp3');

// Victory/defeat sounds - try to use dedicated files, fallback to success/wrong
let VICTORY_SOUND: number | null = null;
let DEFEAT_SOUND: number | null = null;

try {
  VICTORY_SOUND = require('../assets/sounds/victory.mp3');
} catch {
  VICTORY_SOUND = SUCCESS_SOUND;
}

try {
  DEFEAT_SOUND = require('../assets/sounds/defeat.mp3');
} catch {
  DEFEAT_SOUND = WRONG_SOUND;
}

let audioModeReady = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeReady) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    audioModeReady = true;
  } catch (e) {
    if (__DEV__) console.warn('worksheetSounds: setAudioModeAsync failed', e);
  }
}

async function playLocalSound(source: number): Promise<void> {
  try {
    await ensureAudioMode();
    const { sound } = await Audio.Sound.createAsync(source);
    await sound.setVolumeAsync(VOLUME);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && 'didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
    await sound.playAsync();
  } catch (e) {
    if (__DEV__) console.warn('worksheetSounds: play failed', e);
  }
}

/**
 * Play success sound when the child gets an answer right.
 */
export function playSuccessSound(): void {
  playLocalSound(SUCCESS_SOUND);
}

/**
 * Play wrong sound when the child gets an answer wrong.
 */
export function playFailSound(): void {
  playLocalSound(WRONG_SOUND);
}

/**
 * Play victory sound when completing a worksheet with a good score (>= 70%).
 * Uses victory.mp3 if available, otherwise falls back to success.mp3.
 */
export function playVictorySound(): void {
  playLocalSound(VICTORY_SOUND || SUCCESS_SOUND);
}

/**
 * Play defeat sound when completing a worksheet with a low score (< 70%).
 * Uses defeat.mp3 if available, otherwise falls back to wrong.mp3.
 */
export function playDefeatSound(): void {
  playLocalSound(DEFEAT_SOUND || WRONG_SOUND);
}

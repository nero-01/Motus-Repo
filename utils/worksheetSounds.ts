/**
 * Child-friendly success and fail sound effects for educational worksheets.
 * Uses local assets (success.mp3, wrong.mp3) at reduced volume.
 */

import { Audio } from 'expo-av';

const VOLUME = 0.5;

// Local sound files from assets/sounds/
const SUCCESS_SOUND = require('../assets/sounds/success.mp3');
const WRONG_SOUND = require('../assets/sounds/wrong.mp3');

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
  } catch {
    // ignore
  }
}

async function playLocalSound(source: number): Promise<void> {
  try {
    await ensureAudioMode();
    const { sound } = await Audio.Sound.createAsync(source);
    await sound.setVolumeAsync(VOLUME);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinishAndNotReset) {
        sound.unloadAsync().catch(() => {});
      }
    });
    await sound.playAsync();
  } catch {
    // fail silently
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

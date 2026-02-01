/**
 * Child-friendly success and fail jingles for educational worksheets.
 * Uses expo-speech for reliable, cheerful feedback (works offline).
 */

import * as Speech from 'expo-speech';

/**
 * Play a short success jingle when the child gets an answer right.
 */
export function playSuccessSound(): void {
  Speech.speak('Yay! Well done!', {
    language: 'en',
    rate: 0.85,
    pitch: 1.15,
  });
}

/**
 * Play a short fail jingle when the child gets an answer wrong.
 */
export function playFailSound(): void {
  Speech.speak('Oops! Try again!', {
    language: 'en',
    rate: 0.8,
    pitch: 1,
  });
}

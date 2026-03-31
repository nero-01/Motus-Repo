/**
 * Google Cloud Vision API – text extraction from images for building reminders.
 * Uses DOCUMENT_TEXT_DETECTION for best results on planner/schedule images.
 * Requires EXPO_PUBLIC_GOOGLE_VISION_API_KEY to be set.
 */

import { ENV } from '../config/env';

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

export interface VisionTextResult {
  text: string;
  success: true;
}

export interface VisionErrorResult {
  success: false;
  error: string;
}

export type VisionResult = VisionTextResult | VisionErrorResult;

function toFriendlyVisionError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const normalized = raw.toLowerCase();

  if (normalized.includes('network request failed')) {
    return 'Network request failed. Check your internet connection and confirm Vision API access is enabled for your key.';
  }

  if (normalized.includes('failed to fetch')) {
    return 'Could not reach Google Vision. Check your connection and API key restrictions, then try again.';
  }

  // Avoid surfacing technical "TypeError:" prefixes to users.
  return raw.replace(/^typeerror:\s*/i, '').trim() || 'Network or request failed';
}

/**
 * Extract text from an image using Google Cloud Vision API (DOCUMENT_TEXT_DETECTION).
 * @param base64Image - Raw base64-encoded image (no data URL prefix)
 * @returns Extracted text or error
 */
export async function extractTextFromImage(base64Image: string): Promise<VisionResult> {
  const apiKey = ENV.GOOGLE_VISION_API_KEY?.trim();
  if (!apiKey) {
    return {
      success: false,
      error: 'Google Vision API key is not configured. Add EXPO_PUBLIC_GOOGLE_VISION_API_KEY to your environment.',
    };
  }

  // Strip data URL prefix if present
  const base64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const body = {
    requests: [
      {
        image: { content: base64 },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
      },
    ],
  };

  try {
    const res = await fetch(`${VISION_API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      const message =
        data?.error?.message || data?.error?.status || `HTTP ${res.status}`;
      return { success: false, error: message };
    }

    const responses = data?.responses as Array<{ fullTextAnnotation?: { text?: string }; error?: { message?: string } }> | undefined;
    const first = responses?.[0];

    if (first?.error?.message) {
      return { success: false, error: first.error.message };
    }

    const text = first?.fullTextAnnotation?.text?.trim() ?? '';
    return { success: true, text };
  } catch (e) {
    return { success: false, error: toFriendlyVisionError(e) };
  }
}

import { ENV } from '../config/env';
import type { OCRResult, OCRSpaceResponse } from '../types/ocr';

const OCR_SPACE_ENDPOINT = 'https://api.ocr.space/parse/image';

function getApiKey(): string {
  return ENV.OCR_SPACE_API_KEY || process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY || '';
}

function formatOcrSpaceError(result: OCRSpaceResponse, statusText: string): string {
  const message = result.ErrorMessage;
  if (Array.isArray(message) && message.length > 0) {
    return message.join('; ');
  }
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  const parsedError = result.ParsedResults?.[0]?.ErrorMessage;
  if (parsedError) {
    return parsedError;
  }
  return statusText || 'OCR request failed';
}

function averageConfidence(result: OCRSpaceResponse): number | undefined {
  const lines = result.ParsedResults?.[0]?.TextOverlay?.Lines;
  if (!lines?.length) {
    return undefined;
  }

  const values: number[] = [];
  for (const line of lines) {
    for (const word of line.Words ?? []) {
      const confidence = Number(word.Confidence);
      if (!Number.isNaN(confidence)) {
        values.push(confidence);
      }
    }
  }

  if (values.length === 0) {
    return undefined;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

/**
 * Send a base64-encoded image to OCR.space and return extracted text.
 */
export async function extractTextFromImage(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<OCRResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_OCR_SPACE_API_KEY. Get a free key at https://ocr.space/ocrapi'
    );
  }

  const normalizedBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const payload = new URLSearchParams();
  payload.append('base64Image', `data:${mimeType};base64,${normalizedBase64}`);
  payload.append('language', 'eng');
  payload.append('isOverlayRequired', 'true');
  payload.append('scale', 'true');
  payload.append('isTable', 'true');
  payload.append('OCREngine', '2');

  const response = await fetch(OCR_SPACE_ENDPOINT, {
    method: 'POST',
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  });

  let result: OCRSpaceResponse;
  try {
    result = (await response.json()) as OCRSpaceResponse;
  } catch {
    throw new Error(`OCR failed: ${response.statusText || 'Invalid response from OCR.space'}`);
  }

  if (!response.ok || result.IsErroredOnProcessing || result.OCRExitCode === 4) {
    throw new Error(`OCR failed: ${formatOcrSpaceError(result, response.statusText)}`);
  }

  const parsed = result.ParsedResults?.[0];
  const text = parsed?.ParsedText?.trim() ?? '';

  if (!text) {
    throw new Error('OCR returned no readable text. Try a clearer, well-lit photo.');
  }

  return {
    text,
    confidence: averageConfidence(result),
  };
}

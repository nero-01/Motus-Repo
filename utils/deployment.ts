/**
 * Host detection for web deployment behavior.
 */

export function isVercelPreviewHost(hostname: string): boolean {
  return /-git-[a-z0-9-]+\.vercel\.app$/i.test(hostname);
}

export function isLocalDevHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * PWA features (service worker + install prompt).
 * Set EXPO_PUBLIC_DISABLE_PWA=true to turn off entirely.
 */
export function shouldEnablePwaFeatures(hostname: string): boolean {
  if (process.env.EXPO_PUBLIC_DISABLE_PWA === 'true') {
    return false;
  }
  return isLocalDevHost(hostname) || !isVercelPreviewHost(hostname) || process.env.EXPO_PUBLIC_ENABLE_PWA_ON_PREVIEW === 'true';
}

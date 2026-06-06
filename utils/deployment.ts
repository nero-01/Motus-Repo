/**
 * Host detection for web deployment behavior.
 * Vercel branch preview URLs (`*-git-*-*.vercel.app`) should not register
 * service workers or PWA install prompts — combined with login forms they
 * trigger Safe Browsing false positives.
 */

export function isVercelPreviewHost(hostname: string): boolean {
  return /-git-[a-z0-9-]+\.vercel\.app$/i.test(hostname);
}

export function isLocalDevHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/** Safe to register SW + show install prompt (production or local dev only). */
export function shouldEnablePwaFeatures(hostname: string): boolean {
  if (isLocalDevHost(hostname)) {
    return true;
  }
  if (isVercelPreviewHost(hostname)) {
    return false;
  }
  return true;
}

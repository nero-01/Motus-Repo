/**
 * usePWA — registers the service worker, injects the web manifest link,
 * and manages the PWA install prompt.
 * Safe to call on native (all effects no-op on non-web platforms).
 */

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { shouldEnablePwaFeatures } from '../utils/deployment';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isServiceWorkerReady: boolean;
  promptInstall: () => Promise<boolean>;
}

export function usePWA(): PWAState {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const pwaEnabled = shouldEnablePwaFeatures(window.location.hostname);
    if (!pwaEnabled) {
      console.log('[PWA] Disabled on Vercel preview host to avoid Safe Browsing flags.');
      return;
    }

    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
    }

    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#006A60';
      document.head.appendChild(meta);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[PWA] Service worker registered:', reg.scope);
          setIsServiceWorkerReady(true);

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] Update available — refresh to apply.');
                }
              });
            }
          });
        })
        .catch((err) => console.error('[PWA] SW registration failed:', err));
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const mq = window.matchMedia('(display-mode: standalone)');
    if (mq.matches) setIsInstalled(true);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
    return outcome === 'accepted';
  };

  return { isInstallable: !!installPrompt, isInstalled, isServiceWorkerReady, promptInstall };
}

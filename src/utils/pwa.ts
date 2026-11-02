import { useState, useEffect } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface StorageEstimateInfo {
  usageMB: number;
  quotaMB: number;
  percentUsed: number;
  isPersisted: boolean;
  supported: boolean;
}

/**
 * Custom React hook to manage PWA Installation state and prompt
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkIsStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkIsStandalone();

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(iosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error('Error al solicitar instalación PWA:', err);
    }
    return false;
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    promptInstall,
  };
}

/**
 * Requests persistent storage from the browser
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch (err) {
      console.warn('No se pudo solicitar almacenamiento persistente:', err);
    }
  }
  return false;
}

/**
 * Gets storage quota and usage information
 */
export async function getStorageEstimateInfo(): Promise<StorageEstimateInfo> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const usageMB = Math.round((usage / (1024 * 1024)) * 100) / 100;
      const quotaMB = Math.round((quota / (1024 * 1024)) * 100) / 100;
      const percentUsed = quota > 0 ? Math.round((usage / quota) * 10000) / 100 : 0;

      const isPersisted = navigator.storage.persisted
        ? await navigator.storage.persisted()
        : false;

      return {
        usageMB,
        quotaMB,
        percentUsed,
        isPersisted,
        supported: true,
      };
    } catch (err) {
      console.warn('Error al obtener estimación de almacenamiento:', err);
    }
  }

  return {
    usageMB: 0,
    quotaMB: 0,
    percentUsed: 0,
    isPersisted: false,
    supported: false,
  };
}

/**
 * Helper to share a backup file using Web Share API on mobile
 */
export async function shareBackupFile(jsonString: string, filename: string): Promise<boolean> {
  if (!navigator.share) return false;

  try {
    const file = new File([jsonString], filename, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Respaldo PlazoFijo Pro',
        text: 'Copia de seguridad de mi cartera de plazos fijos e historial.',
        files: [file],
      });
      return true;
    }
  } catch (err: any) {
    // Ignore AbortError if user cancelled the native share sheet
    if (err.name !== 'AbortError') {
      console.warn('No se pudo compartir el archivo mediante Web Share API:', err);
    }
  }
  return false;
}

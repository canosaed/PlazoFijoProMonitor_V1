import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getStorageEstimateInfo, requestPersistentStorage, shareBackupFile } from '../utils/pwa';

describe('PWA Assets & Utilities', () => {
  it('should have all required PWA icons in public directory', () => {
    const publicDir = path.join(process.cwd(), 'public');
    expect(fs.existsSync(path.join(publicDir, 'favicon.svg'))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, 'pwa-192x192.png'))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, 'pwa-512x512.png'))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, 'maskable-icon-512x512.png'))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, 'apple-touch-icon.png'))).toBe(true);
  });

  it('should handle storage estimate info when supported', async () => {
    const mockEstimate = vi.fn().mockResolvedValue({ usage: 1048576, quota: 10485760 });
    const mockPersisted = vi.fn().mockResolvedValue(true);

    Object.defineProperty(navigator, 'storage', {
      value: {
        estimate: mockEstimate,
        persisted: mockPersisted,
        persist: vi.fn().mockResolvedValue(true),
      },
      configurable: true,
      writable: true,
    });

    const info = await getStorageEstimateInfo();
    expect(info.supported).toBe(true);
    expect(info.usageMB).toBe(1);
    expect(info.quotaMB).toBe(10);
    expect(info.percentUsed).toBe(10);
    expect(info.isPersisted).toBe(true);
  });

  it('should request persistent storage safely', async () => {
    const mockPersist = vi.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, 'storage', {
      value: { persist: mockPersist },
      configurable: true,
      writable: true,
    });

    const granted = await requestPersistentStorage();
    expect(granted).toBe(true);
    expect(mockPersist).toHaveBeenCalled();
  });

  it('should safely fallback when Web Share API is not available', async () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const result = await shareBackupFile('{"test": true}', 'test.json');
    expect(result).toBe(false);
  });
});

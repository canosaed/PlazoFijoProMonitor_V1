import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  exportBackupJSON,
  restoreBackupJSON,
  validateBackupJSON,
  saveDeposit,
  getAllDeposits,
  getAllEvents,
  clearAllData,
  CURRENT_BACKUP_VERSION,
  APP_VERSION
} from '../services/db';
import { FixedDeposit } from '../types';

describe('JSON Backup & Restore System', () => {
  beforeEach(async () => {
    await clearAllData(true);
  });

  const sampleDeposit: FixedDeposit = {
    id: 'test_pf_1',
    bank: 'Banco Galicia',
    description: 'Plazo Fijo Galicia 30d',
    type: 'TRADICIONAL_TF',
    capital: 500000,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    days: 30,
    tna: 37,
    estimatedInterest: 15205.48,
    estimatedTotalAmount: 515205.48,
    autoRenewal: false,
    status: 'VIGENTE',
    isDemo: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('should export full backup with required metadata structure', async () => {
    await saveDeposit(sampleDeposit, 'Alta inicial de prueba');

    const backup = await exportBackupJSON();

    expect(backup.backupVersion).toBe(CURRENT_BACKUP_VERSION);
    expect(backup.appVersion).toBe(APP_VERSION);
    expect(typeof backup.exportedAt).toBe('string');
    expect(backup.deposits).toHaveLength(1);
    expect(backup.deposits[0].id).toBe('test_pf_1');
    expect(backup.events.length).toBeGreaterThanOrEqual(1);
  });

  it('should validate a correct JSON backup structure', () => {
    const validData = {
      backupVersion: 1,
      appVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      deposits: [sampleDeposit],
      events: [
        {
          id: 'evt_1',
          depositId: 'test_pf_1',
          timestamp: new Date().toISOString(),
          type: 'ALTA',
          description: 'Alta de plazo fijo',
        },
      ],
    };

    const validation = validateBackupJSON(validData);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.metadata.depositCount).toBe(1);
    expect(validation.metadata.eventCount).toBe(1);
    expect(validation.metadata.activeCapitalTotal).toBe(500000);
  });

  it('should reject invalid JSON backups with missing required fields or negative capital', () => {
    const invalidData = {
      backupVersion: 1,
      deposits: [
        {
          id: 'bad_pf',
          bank: '',
          capital: -100,
          startDate: 'invalid-date',
          endDate: '2026-01-31',
        },
      ],
      events: 'not-an-array',
    };

    const validation = validateBackupJSON(invalidData);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should restore valid backup atomically in REPLACE mode', async () => {
    // Save initial deposit
    await saveDeposit(sampleDeposit);

    // Create a new backup payload with a different deposit
    const newDeposit: FixedDeposit = {
      ...sampleDeposit,
      id: 'test_pf_restored',
      bank: 'Banco Nación',
      capital: 1000000,
    };

    const backupToRestore = {
      backupVersion: 1,
      appVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      deposits: [newDeposit],
      events: [],
    };

    const result = await restoreBackupJSON(backupToRestore, 'REPLACE');

    expect(result.importedDeposits).toBe(1);
    const deposits = await getAllDeposits(true);
    expect(deposits).toHaveLength(1);
    expect(deposits[0].id).toBe('test_pf_restored');
    expect(deposits[0].bank).toBe('Banco Nación');
  });

  it('should abort restoration and preserve existing data if file is invalid', async () => {
    await saveDeposit(sampleDeposit);

    const corruptBackup: any = {
      deposits: [{ id: 'broken', capital: -5000 }],
      events: [],
    };

    await expect(restoreBackupJSON(corruptBackup)).rejects.toThrow();

    // Verify existing database was untouched
    const deposits = await getAllDeposits(true);
    expect(deposits).toHaveLength(1);
    expect(deposits[0].id).toBe('test_pf_1');
  });
});

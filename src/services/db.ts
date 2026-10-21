import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FixedDeposit, InvestmentEvent, BackupData, BackupValidationResult } from '../types';

interface PlazoFijoDB extends DBSchema {
  deposits: {
    key: string;
    value: FixedDeposit;
    indexes: {
      'by-bank': string;
      'by-status': string;
      'by-startDate': string;
      'by-endDate': string;
      'by-isDemo': number; // 0 for false, 1 for true
    };
  };
  events: {
    key: string;
    value: InvestmentEvent;
    indexes: {
      'by-depositId': string;
      'by-timestamp': string;
      'by-type': string;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'plazo_fijo_pro_db';
const DB_VERSION = 1;
export const CURRENT_BACKUP_VERSION = 1;
export const APP_VERSION = '1.0.0';

let dbPromise: Promise<IDBPDatabase<PlazoFijoDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<PlazoFijoDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PlazoFijoDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          // Deposits store
          const depositStore = db.createObjectStore('deposits', { keyPath: 'id' });
          depositStore.createIndex('by-bank', 'bank');
          depositStore.createIndex('by-status', 'status');
          depositStore.createIndex('by-startDate', 'startDate');
          depositStore.createIndex('by-endDate', 'endDate');
          depositStore.createIndex('by-isDemo', 'isDemo');

          // Events store
          const eventStore = db.createObjectStore('events', { keyPath: 'id' });
          eventStore.createIndex('by-depositId', 'depositId');
          eventStore.createIndex('by-timestamp', 'timestamp');
          eventStore.createIndex('by-type', 'type');

          // Settings store
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

// Data Service methods
export async function getAllDeposits(includeDemo: boolean = true): Promise<FixedDeposit[]> {
  const db = await getDB();
  const deposits = await db.getAll('deposits');
  if (includeDemo) return deposits;
  return deposits.filter(d => !d.isDemo);
}

export async function getDepositById(id: string): Promise<FixedDeposit | undefined> {
  const db = await getDB();
  return db.get('deposits', id);
}

export async function saveDeposit(deposit: FixedDeposit, eventDescription?: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['deposits', 'events'], 'readwrite');
  
  const existing = await tx.objectStore('deposits').get(deposit.id);
  const now = new Date().toISOString();
  
  const updatedDeposit: FixedDeposit = {
    ...deposit,
    updatedAt: now,
  };

  await tx.objectStore('deposits').put(updatedDeposit);

  // Record history event
  const eventType = existing ? 'MODIFICACION' : 'ALTA';
  const desc = eventDescription || (existing ? `Modificación de datos de plazo fijo en ${deposit.bank}` : `Alta de plazo fijo en ${deposit.bank}`);

  const event: InvestmentEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    depositId: deposit.id,
    timestamp: now,
    type: eventType,
    description: desc,
    amounts: {
      capital: deposit.capital,
      interest: deposit.estimatedInterest,
      total: deposit.estimatedTotalAmount,
    },
  };

  await tx.objectStore('events').add(event);
  await tx.done;
}

export async function recordEvent(event: Omit<InvestmentEvent, 'id' | 'timestamp'>): Promise<void> {
  const db = await getDB();
  const fullEvent: InvestmentEvent = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  await db.add('events', fullEvent);
}

export async function getEventsByDepositId(depositId: string): Promise<InvestmentEvent[]> {
  const db = await getDB();
  const events = await db.getAllFromIndex('events', 'by-depositId', depositId);
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getAllEvents(): Promise<InvestmentEvent[]> {
  const db = await getDB();
  const events = await db.getAll('events');
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function deleteDeposit(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['deposits', 'events'], 'readwrite');
  await tx.objectStore('deposits').delete(id);
  
  // Clean up associated events
  const events = await tx.objectStore('events').index('by-depositId').getAllKeys(id);
  for (const key of events) {
    await tx.objectStore('events').delete(key);
  }
  
  await tx.done;
}

export async function clearAllData(includeReal: boolean = false): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['deposits', 'events'], 'readwrite');
  if (includeReal) {
    await tx.objectStore('deposits').clear();
    await tx.objectStore('events').clear();
  } else {
    // Clear only demo data
    const allDeposits = await tx.objectStore('deposits').getAll();
    for (const dep of allDeposits) {
      if (dep.isDemo) {
        await tx.objectStore('deposits').delete(dep.id);
        const eventKeys = await tx.objectStore('events').index('by-depositId').getAllKeys(dep.id);
        for (const k of eventKeys) {
          await tx.objectStore('events').delete(k);
        }
      }
    }
  }
  await tx.done;
}

export async function getLastBackupDate(): Promise<string | null> {
  try {
    const db = await getDB();
    const val = await db.get('settings', 'lastBackupAt');
    if (val) return val;
  } catch (err) {
    console.warn('Error leyendo fecha de último respaldo:', err);
  }
  return localStorage.getItem('lastBackupAt');
}

export async function exportBackupJSON(): Promise<BackupData> {
  const db = await getDB();
  const deposits = await db.getAll('deposits');
  const events = await db.getAll('events');
  const now = new Date().toISOString();

  // Save last backup timestamp
  await db.put('settings', now, 'lastBackupAt');
  localStorage.setItem('lastBackupAt', now);

  return {
    backupVersion: CURRENT_BACKUP_VERSION,
    version: DB_VERSION,
    appVersion: APP_VERSION,
    exportedAt: now,
    deposits,
    events,
  };
}

/**
 * Validates a parsed JSON backup object prior to database modification
 */
export function validateBackupJSON(data: any): BackupValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['El archivo seleccionado no contiene un objeto JSON válido.'],
      warnings: [],
      metadata: {
        backupVersion: 0,
        appVersion: 'desconocida',
        exportedAt: '',
        depositCount: 0,
        eventCount: 0,
        activeCapitalTotal: 0,
        banksCount: 0,
      },
    };
  }

  const backupVersion = Number(data.backupVersion || data.version || 0);
  const appVersion = String(data.appVersion || 'desconocida');
  const exportedAt = String(data.exportedAt || '');

  if (!Array.isArray(data.deposits)) {
    errors.push('Estructura inválida: Falta la lista principal de inversiones ("deposits").');
  }

  if (!Array.isArray(data.events)) {
    errors.push('Estructura inválida: Falta la lista de eventos e historial ("events").');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
      metadata: {
        backupVersion,
        appVersion,
        exportedAt,
        depositCount: 0,
        eventCount: 0,
        activeCapitalTotal: 0,
        banksCount: 0,
      },
    };
  }

  const deposits: any[] = data.deposits;
  const events: any[] = data.events;

  const depositIds = new Set<string>();
  let activeCapitalTotal = 0;
  const banks = new Set<string>();

  deposits.forEach((dep, idx) => {
    if (!dep || typeof dep !== 'object') {
      errors.push(`El registro de inversión #${idx + 1} no es un objeto válido.`);
      return;
    }

    if (!dep.id || typeof dep.id !== 'string') {
      errors.push(`La inversión #${idx + 1} no posee un identificador ("id") válido.`);
    } else {
      if (depositIds.has(dep.id)) {
        errors.push(`Se detectó un ID duplicado en las inversiones: "${dep.id}".`);
      }
      depositIds.add(dep.id);
    }

    if (!dep.bank || typeof dep.bank !== 'string') {
      errors.push(`La inversión #${idx + 1} carece de entidad bancaria ("bank") válida.`);
    } else {
      banks.add(dep.bank);
    }

    if (typeof dep.capital !== 'number' || isNaN(dep.capital) || dep.capital < 0) {
      errors.push(`La inversión "${dep.bank || idx + 1}" tiene un capital inválido ($ ${dep.capital}).`);
    } else {
      if (dep.status === 'VIGENTE' || dep.status === 'PROXIMO_A_VENCER' || dep.status === 'VENCIDO_PENDIENTE') {
        activeCapitalTotal += dep.capital;
      }
    }

    if (typeof dep.tna !== 'number' || isNaN(dep.tna) || dep.tna < 0) {
      warnings.push(`La inversión "${dep.bank || idx + 1}" posee TNA no numérica o negativa.`);
    }

    if (!dep.startDate || isNaN(new Date(dep.startDate).getTime())) {
      errors.push(`La inversión "${dep.bank || idx + 1}" tiene fecha de inicio inválida (${dep.startDate}).`);
    }

    if (!dep.endDate || isNaN(new Date(dep.endDate).getTime())) {
      errors.push(`La inversión "${dep.bank || idx + 1}" tiene fecha de vencimiento inválida (${dep.endDate}).`);
    }
  });

  events.forEach((evt, idx) => {
    if (!evt || typeof evt !== 'object') {
      warnings.push(`El evento de historial #${idx + 1} no es válido.`);
      return;
    }
    if (evt.depositId && !depositIds.has(evt.depositId)) {
      warnings.push(`El evento "${evt.id || idx}" hace referencia a una inversión inexistente ("${evt.depositId}").`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata: {
      backupVersion,
      appVersion,
      exportedAt,
      depositCount: deposits.length,
      eventCount: events.length,
      activeCapitalTotal,
      banksCount: banks.size,
    },
  };
}

/**
 * Restores JSON backup data atomically after validation
 */
export async function restoreBackupJSON(
  data: BackupData,
  mode: 'REPLACE' | 'MERGE' = 'REPLACE'
): Promise<{ importedDeposits: number; importedEvents: number }> {
  const validation = validateBackupJSON(data);
  if (!validation.isValid) {
    throw new Error(`Restauración cancelada. Errores de validación:\n- ${validation.errors.join('\n- ')}`);
  }

  const db = await getDB();
  const tx = db.transaction(['deposits', 'events', 'settings'], 'readwrite');

  if (mode === 'REPLACE') {
    await tx.objectStore('deposits').clear();
    await tx.objectStore('events').clear();
  }

  for (const dep of data.deposits) {
    await tx.objectStore('deposits').put(dep);
  }

  for (const evt of data.events) {
    await tx.objectStore('events').put(evt);
  }

  const now = new Date().toISOString();
  await tx.objectStore('settings').put(now, 'lastRestoreAt');

  await tx.done;
  return {
    importedDeposits: data.deposits.length,
    importedEvents: data.events.length,
  };
}

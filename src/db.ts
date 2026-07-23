import type { StorageBox, BoxDraft } from './types';

const DB_NAME = 'boxkeep_db';
const DB_VERSION = 1;
const STORE_NAME = 'boxes';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('code', 'code', { unique: false });
        store.createIndex('room', 'room', { unique: false });
        store.createIndex('priority', 'priority', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('order', 'order', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T = any>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest | Promise<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = fn(store);
        if (request instanceof Promise) {
          request.then(resolve, reject);
        } else {
          (request as IDBRequest).onsuccess = () => resolve((request as IDBRequest<T>).result);
          (request as IDBRequest).onerror = () => reject((request as IDBRequest).error);
        }
      })
  );
}

export function getAllBoxes(): Promise<StorageBox[]> {
  return tx<StorageBox[]>('readonly', (store) => store.getAll() as IDBRequest<StorageBox[]>);
}

export function getBox(id: string): Promise<StorageBox | undefined> {
  return tx<StorageBox | undefined>('readonly', (store) => store.get(id) as IDBRequest<StorageBox | undefined>);
}

export function saveBox(box: StorageBox): Promise<void> {
  return tx('readwrite', (store) => store.put(box)).then(() => {});
}

export function deleteBox(id: string): Promise<void> {
  return tx('readwrite', (store) => store.delete(id)).then(() => {});
}

export function bulkPutBoxes(boxes: StorageBox[]): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        boxes.forEach((b) => store.put(b));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      })
  );
}

export function bulkDeleteBoxes(ids: string[]): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        ids.forEach((id) => store.delete(id));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      })
  );
}

export function clearAll(): Promise<void> {
  return tx('readwrite', (store) => store.clear()).then(() => {});
}

export function generateId(): string {
  return 'box_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export function createBoxFromDraft(draft: BoxDraft, existing?: StorageBox): StorageBox {
  const now = Date.now();
  return {
    id: existing?.id ?? generateId(),
    ...draft,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function exportData(): Promise<string> {
  return getAllBoxes().then((boxes) =>
    JSON.stringify(
      { version: DB_VERSION, exportedAt: new Date().toISOString(), boxes },
      null,
      2
    )
  );
}

export async function importData(json: string): Promise<number> {
  const parsed = JSON.parse(json);
  const boxes: StorageBox[] = Array.isArray(parsed) ? parsed : parsed.boxes;
  if (!Array.isArray(boxes)) throw new Error('JSON 格式不正确：未找到 boxes 数组');
  const sanitized = boxes.map((b) => ({
    id: b.id || generateId(),
    code: String(b.code ?? ''),
    room: String(b.room ?? ''),
    summary: String(b.summary ?? ''),
    weight: (['light', 'medium', 'heavy'] as const).includes(b.weight) ? b.weight : 'medium',
    fragile: Boolean(b.fragile),
    fragileNote: String(b.fragileNote ?? ''),
    priority: (['low', 'normal', 'high', 'urgent'] as const).includes(b.priority) ? b.priority : 'normal',
    order: Number(b.order) || 0,
    status: (['pending', 'confirmed', 'reinforce', 'deferred'] as const).includes(b.status)
      ? b.status
      : 'pending',
    notes: String(b.notes ?? ''),
    createdAt: Number(b.createdAt) || Date.now(),
    updatedAt: Number(b.updatedAt) || Date.now(),
  }));
  await bulkPutBoxes(sanitized);
  return sanitized.length;
}

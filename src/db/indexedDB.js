import { openDB } from 'idb';

const DB_NAME = 'boxkeep-db';
const STORE_NAME = 'boxes';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('code', 'code', { unique: false });
          store.createIndex('room', 'room', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllBoxes() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function saveBox(box) {
  const db = await getDB();
  const now = Date.now();
  const record = { ...box, updatedAt: now };
  if (!record.id) {
    record.id = crypto.randomUUID();
    record.createdAt = now;
  }
  await db.put(STORE_NAME, record);
  return record;
}

export async function saveBoxes(boxes) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const now = Date.now();
  for (const box of boxes) {
    const record = { ...box, updatedAt: now };
    if (!record.id) {
      record.id = crypto.randomUUID();
      record.createdAt = now;
    }
    tx.store.put(record);
  }
  await tx.done;
  return boxes;
}

export async function deleteBox(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function deleteBoxes(ids) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const id of ids) {
    tx.store.delete(id);
  }
  await tx.done;
}

export async function clearAll() {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

export async function exportToJSON() {
  const boxes = await getAllBoxes();
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), boxes }, null, 2);
}

export async function importFromJSON(jsonString) {
  const data = JSON.parse(jsonString);
  if (!data.boxes || !Array.isArray(data.boxes)) {
    throw new Error('无效的 JSON 格式');
  }
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  const now = Date.now();
  for (const b of data.boxes) {
    const record = { ...b, id: b.id || crypto.randomUUID(), updatedAt: now, createdAt: b.createdAt || now };
    tx.store.put(record);
  }
  await tx.done;
  return data.boxes.map(b => ({ ...b, id: b.id || crypto.randomUUID() }));
}

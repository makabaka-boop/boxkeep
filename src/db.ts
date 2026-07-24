// 原生 IndexedDB 存储层：CRUD、批量操作、整表替换、JSON 导入/导出
import type { Box } from './types'

const DB_NAME = 'boxkeep-db'
const DB_VERSION = 1
const STORE = 'boxes'

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(db: IDBDatabase, mode: IDBTransactionMode) {
  return db.transaction(STORE, mode).objectStore(STORE)
}

/** 读取全部收纳盒 */
export async function getAllBoxes(): Promise<Box[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readonly').getAll()
    req.onsuccess = () => resolve((req.result as Box[]) ?? [])
    req.onerror = () => reject(req.error)
  })
}

/** 新增或更新一个收纳盒 */
export async function putBox(box: Box): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').put(box)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/** 批量新增或更新 */
export async function putBoxes(boxes: Box[]): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const store = tx(db, 'readwrite')
    store.transaction.oncomplete = () => resolve()
    store.transaction.onerror = () => reject(store.transaction.error)
    boxes.forEach((b) => store.put(b))
  })
}

/** 删除一个收纳盒 */
export async function deleteBox(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/** 批量删除 */
export async function deleteBoxes(ids: string[]): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const store = tx(db, 'readwrite')
    store.transaction.oncomplete = () => resolve()
    store.transaction.onerror = () => reject(store.transaction.error)
    ids.forEach((id) => store.delete(id))
  })
}

/** 清空并用给定数据整表替换（用于 JSON 导入 / 恢复） */
export async function replaceAll(boxes: Box[]): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const store = tx(db, 'readwrite')
    store.transaction.oncomplete = () => resolve()
    store.transaction.onerror = () => reject(store.transaction.error)
    store.clear()
    boxes.forEach((b) => store.put(b))
  })
}

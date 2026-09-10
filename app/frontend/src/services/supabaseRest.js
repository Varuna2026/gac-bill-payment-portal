// P2 R&D document adapter.
// Git-only test mode: uploaded documents stay outside GitHub in browser IndexedDB.
// A versioned storage name forces every browser to start with an empty document store
// for the fresh-test cycle. GitHub remains source/application storage only.
import { selectRows, insertRows, updateRows, deleteRows, resetRDatabase, supabaseConfigured, RD_MODE } from './gitDatabase'

const FILE_DB = 'p2_document_storage_v2_clean_test'
const FILE_STORE = 'files'
try { indexedDB.deleteDatabase('p2_document_storage_v1') } catch {}

function openFileDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FILE_DB, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(FILE_STORE)) request.result.createObjectStore(FILE_STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Unable to open browser document storage.'))
  })
}

async function putBrowserFile(key, file) {
  const db = await openFileDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readwrite')
    tx.objectStore(FILE_STORE).put({ blob: file, name: file.name, type: file.type, size: file.size }, key)
    tx.oncomplete = () => { db.close(); resolve({ path: `idb://${key}`, name: file.name, size: file.size }) }
    tx.onerror = () => { db.close(); reject(tx.error || new Error('Unable to save document in browser storage.')) }
  })
}

async function getBrowserFile(key) {
  const db = await openFileDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readonly')
    const request = tx.objectStore(FILE_STORE).get(key)
    request.onsuccess = () => { db.close(); resolve(request.result?.blob || null) }
    request.onerror = () => { db.close(); reject(request.error || new Error('Unable to read document from browser storage.')) }
  })
}

export { selectRows, insertRows, updateRows, deleteRows, resetRDatabase, supabaseConfigured, RD_MODE }

export async function uploadStorage(path, file) {
  return putBrowserFile(path, file)
}

export async function readRDFile(filePath) {
  const value = String(filePath || '')
  if (!value.startsWith('idb://')) throw new Error('Git-only R&D storage accepts browser document paths only.')
  const file = await getBrowserFile(value.slice(6))
  if (!file) throw new Error('Document not found in the current browser test storage.')
  return file
}

export function getRDFile(filePath) {
  return String(filePath || '')
}

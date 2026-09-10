// P2 R&D data adapter.
// Database records are Git-controlled seed/configuration data with browser persistence for testing.
// Uploaded documents are kept OUT of GitHub and OUT of Supabase.
// In the GitHub Pages R&D build, files are stored in browser IndexedDB so the portal
// does not depend on a local backend. A VITE_API_BASE_URL can still be supplied later
// when a separately hosted document server is available.
import { selectRows, insertRows, updateRows, deleteRows, resetRDatabase, supabaseConfigured, RD_MODE } from './gitDatabase'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const FILE_DB = 'p2_document_storage_v1'
const FILE_STORE = 'files'

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

async function storageRequest(path, options = {}) {
  if (!API_BASE) throw new Error('No hosted document server configured.')
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const text = await response.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!response.ok) throw new Error(data?.error || `Document storage request failed (${response.status})`)
  return data
}

export { selectRows, insertRows, updateRows, deleteRows, resetRDatabase, supabaseConfigured, RD_MODE }

export async function uploadStorage(path, file) {
  // R&D/GitHub Pages default: browser-local IndexedDB. This is intentionally
  // separate from GitHub source storage and requires no localhost service.
  if (!API_BASE) return putBrowserFile(path, file)

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  try {
    return await storageRequest('/api/uploads', {
      method: 'POST',
      body: JSON.stringify({ path, name: file.name, size: file.size, type: file.type, dataUrl })
    })
  } catch (error) {
    // Keep R&D usable if the optional document server is unavailable.
    if (RD_MODE) return putBrowserFile(path, file)
    throw error
  }
}

export async function readRDFile(filePath) {
  const value = String(filePath || '')
  if (value.startsWith('idb://')) return getBrowserFile(value.slice(6))
  if (!API_BASE) throw new Error('No hosted document server configured for this file.')
  const response = await fetch(`${API_BASE}/${value.replace(/^\//, '')}`)
  if (!response.ok) throw new Error(`Unable to read document (${response.status})`)
  return response.blob()
}

export function getRDFile(filePath) {
  const value = String(filePath || '')
  if (value.startsWith('idb://')) return value
  return API_BASE ? `${API_BASE}/${value.replace(/^\//, '')}` : value
}

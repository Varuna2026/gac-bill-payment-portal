// P2 R&D data adapter.
// Database records are Git-controlled seed/configuration data with browser persistence for testing.
// The own server is used ONLY for invoice/supporting-document storage.
import { selectRows, insertRows, updateRows, deleteRows, resetRDatabase, supabaseConfigured, RD_MODE } from './gitDatabase'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '')

async function storageRequest(path, options = {}) {
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
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  return storageRequest('/api/uploads', { method: 'POST', body: JSON.stringify({ path, name: file.name, size: file.size, type: file.type, dataUrl }) })
}

export function getRDFile(filePath) {
  return `${API_BASE}/${String(filePath).replace(/^\//, '')}`
}

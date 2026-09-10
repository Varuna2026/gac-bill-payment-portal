// P2 data adapter.
// The application database provider is intentionally kept behind this adapter.
// The own server is NOT the database; it is used only for document storage.

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '')

// Compatibility exports retained while the database provider is finalized.
export const supabaseConfigured = false
export const RD_MODE = true

async function storageRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const text = await response.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!response.ok) throw new Error(data?.error || `Storage request failed (${response.status})`)
  return data
}

export async function uploadStorage(path, file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  return storageRequest('/api/uploads', {
    method: 'POST',
    body: JSON.stringify({
      path,
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl,
    }),
  })
}

export async function getRDFile(filePath) {
  return `${API_BASE}/${String(filePath).replace(/^\//, '')}`
}

// Database operations must be implemented by the selected P2 database provider.
// They deliberately do not fall back to GitHub, localStorage, or the document server.
function databaseNotConfigured() {
  throw new Error('P2 database provider is not configured. The own server is document storage only.')
}

export const selectRows = databaseNotConfigured
export const insertRows = databaseNotConfigured
export const updateRows = databaseNotConfigured
export const deleteRows = databaseNotConfigured

export function resetRDSampleData() {
  // No sample/demo database is maintained by this adapter.
}

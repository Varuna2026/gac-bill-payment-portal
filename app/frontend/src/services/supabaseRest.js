const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '')

// P2 R&D: GitHub stores source/version history. Runtime records and uploaded files
// are designed to live on the own-server backend, not in the repository.
export const supabaseConfigured = true
export const RD_MODE = true

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options })
  const text = await response.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!response.ok) throw new Error(data?.error || `Server request failed (${response.status})`)
  return data
}

function queryString(query = '') { return query ? `?${query.replace(/^&/, '')}` : '' }

export async function selectRows(table, query = '') {
  return request(`/api/tables/${encodeURIComponent(table)}${queryString(query)}`)
}

export async function insertRows(table, rows) {
  return request(`/api/tables/${encodeURIComponent(table)}`, { method: 'POST', body: JSON.stringify(rows) })
}

export async function updateRows(table, query, values) {
  return request(`/api/tables/${encodeURIComponent(table)}${queryString(query)}`, { method: 'PATCH', body: JSON.stringify(values) })
}

export async function deleteRows(table, query) {
  return request(`/api/tables/${encodeURIComponent(table)}${queryString(query)}`, { method: 'DELETE' })
}

export async function uploadStorage(path, file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  return request('/api/uploads', { method: 'POST', body: JSON.stringify({ path, name: file.name, size: file.size, type: file.type, dataUrl }) })
}

export async function getRDFile(path) {
  return `${API_BASE}/${String(path).replace(/^\//, '')}`
}

export function resetRDSampleData() {
  // Runtime reset is intentionally a server-side/admin operation; no local demo data is seeded.
}

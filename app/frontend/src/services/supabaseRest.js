const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY

const headers = (token = SUPABASE_KEY) => ({ apikey: SUPABASE_KEY || '', Authorization: `Bearer ${token || ''}`, 'Content-Type': 'application/json' })
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY)

const request = async (path, options = {}, token = SUPABASE_KEY) => {
 if (!supabaseConfigured) throw new Error('Supabase is not configured')
 const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...headers(token), ...(options.headers || {}) } })
 if (!response.ok) { const text = await response.text(); throw new Error(text || `Supabase request failed: ${response.status}`) }
 return response.status === 204 ? [] : response.json()
}

export async function selectRows(table, query = '', token) { return request(`${table}?select=*${query}`, {}, token) }
export async function insertRows(table, rows, token) { return request(table, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(rows) }, token) }
export async function updateRows(table, query, values, token) { return request(`${table}?${query}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(values) }, token) }
export async function deleteRows(table, query, token) { return request(`${table}?${query}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }, token) }

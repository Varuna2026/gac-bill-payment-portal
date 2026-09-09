const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY

const headers = () => ({ apikey: SUPABASE_KEY || '', Authorization: `Bearer ${SUPABASE_KEY || ''}`, 'Content-Type': 'application/json' })

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY)

export async function selectRows(table, query = '') {
  if (!supabaseConfigured) return []
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*${query}`, { headers: headers() })
  if (!response.ok) throw new Error(`Supabase request failed: ${response.status}`)
  return response.json()
}

export async function insertRows(table, rows) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured')
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: 'POST', headers: { ...headers(), Prefer: 'return=representation' }, body: JSON.stringify(rows) })
  if (!response.ok) throw new Error(`Supabase insert failed: ${response.status}`)
  return response.json()
}

export async function updateRows(table, query, values) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured')
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { method: 'PATCH', headers: { ...headers(), Prefer: 'return=representation' }, body: JSON.stringify(values) })
  if (!response.ok) throw new Error(`Supabase update failed: ${response.status}`)
  return response.json()
}

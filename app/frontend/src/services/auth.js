import { selectRows } from './supabaseRest'

const AUTH_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL
const AUTH_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY
const AUTH_EMAIL_DOMAIN = import.meta.env.VITE_AUTH_EMAIL_DOMAIN || 'p2.local'
const ADMIN_AUTH_EMAIL = 'admin@p2.local'

export const authConfigured = Boolean(AUTH_URL && AUTH_KEY)

const authHeaders = (token = AUTH_KEY) => ({
  apikey: AUTH_KEY || '',
  Authorization: `Bearer ${token || ''}`,
  'Content-Type': 'application/json',
})

const storageKey = 'p2v2_auth_session'

export async function loginWithUsername(username, password) {
  const id = username.trim()
  if (!id || !password) throw new Error('Enter ID and Password.')
  if (!authConfigured) throw new Error('Supabase is not configured. Add the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values.')

  // The user-facing credential is ID + Password. Supabase Auth uses an
  // internal email identity; Admin is specifically mapped to admin@p2.local.
  const authEmail = id.toLowerCase() === 'admin'
    ? ADMIN_AUTH_EMAIL
    : `${id.toLowerCase()}@${AUTH_EMAIL_DOMAIN}`

  const response = await fetch(`${AUTH_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email: authEmail, password }),
  })
  if (!response.ok) throw new Error('Invalid ID or Password.')

  const session = await response.json()
  const accessToken = session.access_token
  let rows = []

  // Use the authenticated token for the profile lookup so RLS can be applied
  // correctly. Prefer the Auth UID mapping, then fall back to the visible ID.
  if (session.user?.id) {
    rows = await selectRows(
      'user_role_master',
      `&auth_user_id=eq.${encodeURIComponent(session.user.id)}&select=*`,
      accessToken,
    ).catch(() => [])
  }

  if (!rows.length) {
    rows = await selectRows(
      'user_role_master',
      `&username=eq.${encodeURIComponent(id)}&select=*`,
      accessToken,
    ).catch(() => [])
  }

  let profile = rows[0]

  // Keep Admin usable even if the profile mapping row has not yet been linked;
  // the actual authentication remains controlled by Supabase Auth.
  if (!profile && id.toLowerCase() === 'admin') {
    profile = {
      username: 'Admin',
      display_name: 'Admin',
      role: 'ADMIN',
      auth_user_id: session.user?.id || null,
    }
  }

  if (!profile) {
    await fetch(`${AUTH_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: authHeaders(accessToken),
    }).catch(() => {})
    throw new Error('Login succeeded, but no P2 user profile is mapped to this ID.')
  }

  profile = { ...profile, auth_user_id: profile.auth_user_id || session.user?.id || null }
  localStorage.setItem(storageKey, JSON.stringify({ ...session, profile }))
  return profile
}

export function getStoredSession() {
  try {
    const value = localStorage.getItem(storageKey)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

export async function logout() {
  const session = getStoredSession()
  if (session?.access_token && authConfigured) {
    await fetch(`${AUTH_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: authHeaders(session.access_token),
    }).catch(() => {})
  }
  localStorage.removeItem(storageKey)
}

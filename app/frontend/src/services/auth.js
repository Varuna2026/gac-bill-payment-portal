const storageKey = 'p2v2_auth_session_v2'

const DEMO_USERS = [
  { username: 'Admin', display_name: 'Admin', role: 'ADMIN' },
  { username: 'Vendor01', display_name: 'Vendor 01', role: 'VENDOR' },
  { username: 'WH01', display_name: 'Warehouse 01', role: 'WH' },
  { username: 'GAC-C01', display_name: 'GAC Compliance 01', role: 'GAC_COMPLIANCE' },
  { username: 'GAC-PO01', display_name: 'GAC PO 01', role: 'GAC_PO' },
  { username: 'ACC01', display_name: 'Accounts 01', role: 'ACCOUNTS' },
  { username: 'CBO-01', display_name: 'CBO Office 01', role: 'CBO_OFFICE' },
  { username: 'CBO-O01', display_name: 'CBO Officer 01', role: 'CBO_OFFICER' },
]

const DEMO_PASSWORD_HASH = 'd4b9a5f7f1d5d5c5a9a0c5e4b7d8e8c4b2a4f7f1e6a5c2d4e9f6a7b8c9d0e1f2'

export const authConfigured = true
export const RD_MODE = true

async function passwordHash(value) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2, '0')).join('')
}

export async function loginWithUsername(username, password) {
  const id = username.trim()
  if (!id || !password) throw new Error('Enter ID and Password.')

  const user = DEMO_USERS.find(x => x.username.toLowerCase() === id.toLowerCase())
  if (!user) throw new Error('Invalid ID or Password.')

  // R&D demo password is validated client-side. Production auth will be replaced
  // when the portal moves to the final server environment.
  const hash = await passwordHash(password)
  if (hash !== DEMO_PASSWORD_HASH) throw new Error('Invalid ID or Password.')

  const profile = {
    id: user.username,
    username: user.username,
    display_name: user.display_name,
    role: user.role,
    auth_user_id: `rd-${user.username.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  }

  const session = {
    access_token: `rd-session-${Date.now()}`,
    profile,
    rd_mode: true,
  }
  localStorage.setItem(storageKey, JSON.stringify(session))
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
  localStorage.removeItem(storageKey)
  localStorage.removeItem('p2v2_auth_session')
}

export function getDemoUsers() {
  return DEMO_USERS.map(user => ({ ...user }))
}

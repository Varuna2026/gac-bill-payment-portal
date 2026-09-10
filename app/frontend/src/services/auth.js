const storageKey = 'p2v2_auth_session_v4'

const P2_USERS = [
  { username: 'Admin', display_name: 'System Admin', role: 'ADMIN' },
  { username: 'Vendor01', display_name: 'Jyoti Enterprises', role: 'VENDOR' },
  { username: 'WH01', display_name: 'Apollo Tepla Warehouse', role: 'WH' },
  { username: 'GAC-C01', display_name: 'GAC Compliance 01', role: 'GAC_COMPLIANCE' },
  { username: 'GAC-PO01', display_name: 'GAC PO 01', role: 'GAC_PO' },
  { username: 'ACC01', display_name: 'Accounts 01', role: 'ACCOUNTS' },
  { username: 'CBO-01', display_name: 'CBO Office 01', role: 'CBO_OFFICE' },
  { username: 'CBO-O01', display_name: 'CBO Officer 01', role: 'CBO_OFFICER' },
]

const P2_PASSWORD_HASH = 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7'
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
  const user = P2_USERS.find(x => x.username.toLowerCase() === id.toLowerCase())
  if (!user || await passwordHash(password) !== P2_PASSWORD_HASH) throw new Error('Invalid ID or Password.')
  const profile = { id: user.username, username: user.username, display_name: user.display_name, role: user.role, auth_user_id: `rd-${user.username.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` }
  localStorage.setItem(storageKey, JSON.stringify({ access_token: `rd-session-${Date.now()}`, profile, rd_mode: true }))
  return profile
}

export function getStoredSession() {
  try { const value = localStorage.getItem(storageKey); return value ? JSON.parse(value) : null } catch { return null }
}

export async function logout() {
  localStorage.removeItem(storageKey)
  localStorage.removeItem('p2v2_auth_session')
  localStorage.removeItem('p2v2_auth_session_v2')
  localStorage.removeItem('p2v2_auth_session_v3')
}

export function getDemoUsers() { return P2_USERS.map(x => ({ ...x })) }

import { P2_MASTER_MAPPINGS, P2_USERS as OPERATIONAL_USERS } from './p2Seed'

// R&D login convention: ID = Password for every P2 test user.
function codeBase(name) {
  const words = String(name).trim().match(/[A-Za-z0-9]+/g) || []
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase()
  return String(words[0] || 'U').slice(0, 2).toUpperCase()
}

const usedCodes = new Set()
function makeCode(name) {
  const base = codeBase(name)
  let n = 1
  let code = `${base}${n}`
  while (usedCodes.has(code)) code = `${base}${++n}`
  usedCodes.add(code)
  return code
}

const vendorNames = [...new Set(P2_MASTER_MAPPINGS.map(x => x.vendor))]
const warehouseNames = [...new Set(P2_MASTER_MAPPINGS.map(x => x.warehouse))]

export const P2_VENDOR_LOGIN_USERS = vendorNames.map(name => ({
  username: makeCode(name),
  display_name: name,
  role: 'VENDOR',
  organization: [...new Set(P2_MASTER_MAPPINGS.filter(x => x.vendor === name).map(x => x.organization))][0] || null,
  warehouses: [...new Set(P2_MASTER_MAPPINGS.filter(x => x.vendor === name).map(x => x.warehouse))],
  test_login: true,
}))

export const P2_WH_LOGIN_USERS = warehouseNames.map(name => ({
  username: makeCode(name),
  display_name: name,
  role: 'WH',
  organization: [...new Set(P2_MASTER_MAPPINGS.filter(x => x.warehouse === name).map(x => x.organization))][0] || null,
  warehouses: [name],
  test_login: true,
}))

// All operational R&D accounts use ID as password.
const OTHER_USERS = OPERATIONAL_USERS.filter(x => !['VENDOR', 'WH'].includes(x.role)).map(x => ({
  ...x,
  test_login: true,
}))

export const P2_LOGIN_USERS = [...OTHER_USERS, ...P2_VENDOR_LOGIN_USERS, ...P2_WH_LOGIN_USERS]

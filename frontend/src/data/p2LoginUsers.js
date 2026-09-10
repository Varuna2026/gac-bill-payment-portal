import { P2_MASTER_MAPPINGS, P2_USERS as OPERATIONAL_USERS } from './p2Seed'

// R&D login convention for Vendor and Warehouse testing:
// ID = generated unique short code; Password = same code.
// Vendor and Warehouse namespaces are generated separately so a valid warehouse
// code (for example AK1) can never be displaced by a vendor code.
function codeBase(name) {
  const words = String(name).trim().match(/[A-Za-z0-9]+/g) || []
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase()
  return String(words[0] || 'U').slice(0, 2).toUpperCase()
}

function makeCodes(names) {
  const usedCodes = new Set()
  return names.map(name => {
    const base = codeBase(name)
    let n = 1
    let code = `${base}${n}`
    while (usedCodes.has(code)) code = `${base}${++n}`
    usedCodes.add(code)
    return { name, code }
  })
}

const vendorNames = [...new Set(P2_MASTER_MAPPINGS.map(x => x.vendor))]
const warehouseNames = [...new Set(P2_MASTER_MAPPINGS.map(x => x.warehouse))]
const vendorCodes = makeCodes(vendorNames)
const warehouseCodes = makeCodes(warehouseNames)

export const P2_VENDOR_LOGIN_USERS = vendorCodes.map(({ name, code }) => ({
  username: code,
  password: code,
  display_name: name,
  role: 'VENDOR',
  organization: [...new Set(P2_MASTER_MAPPINGS.filter(x => x.vendor === name).map(x => x.organization))][0] || null,
  warehouses: [...new Set(P2_MASTER_MAPPINGS.filter(x => x.vendor === name).map(x => x.warehouse))],
  test_login: true,
}))

export const P2_WH_LOGIN_USERS = warehouseCodes.map(({ name, code }) => ({
  username: code,
  password: code,
  display_name: name,
  role: 'WH',
  organization: [...new Set(P2_MASTER_MAPPINGS.filter(x => x.warehouse === name).map(x => x.organization))][0] || null,
  warehouses: [name],
  test_login: true,
}))

// Keep the existing non-Vendor/non-WH operational logins and replace the old
// single Vendor/WH demo accounts with the complete master-driven test accounts.
const OTHER_USERS = OPERATIONAL_USERS.filter(x => !['VENDOR', 'WH'].includes(x.role))
export const P2_LOGIN_USERS = [...OTHER_USERS, ...P2_VENDOR_LOGIN_USERS, ...P2_WH_LOGIN_USERS]

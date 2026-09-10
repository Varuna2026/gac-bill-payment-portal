import { P2_MASTER_MAPPINGS, P2_TEST_INVOICES, P2_TEST_HISTORY, P2_TEST_PR_PO_UTR, P2_TEST_DOCUMENTS } from '../data/p2Seed'

const DB_KEY = 'p2_rnd_database_v1'
const clone = value => JSON.parse(JSON.stringify(value))

function initialState() {
  const vendors = [...new Set(P2_MASTER_MAPPINGS.map(x => x.vendor))].map((name, i) => ({ id: `VEN-${String(i+1).padStart(3,'0')}`, name }))
  const warehouses = [...new Set(P2_MASTER_MAPPINGS.map(x => x.warehouse))].map((code, i) => ({ id: `WH-${String(i+1).padStart(3,'0')}`, code }))
  const vendor_warehouse_map = P2_MASTER_MAPPINGS.map(x => ({ id: x.id, organization: x.organization, warehouse: x.warehouse, project_location: x.project_location, vendor: x.vendor, service_type: x.service_type }))
  return { vendors, warehouses, vendor_warehouse_map, invoice_records: clone(P2_TEST_INVOICES), workflow_history: clone(P2_TEST_HISTORY), pr_po_utr: clone(P2_TEST_PR_PO_UTR), document_records: clone(P2_TEST_DOCUMENTS) }
}

function readDb() {
  try {
    const saved = localStorage.getItem(DB_KEY)
    return saved ? JSON.parse(saved) : initialState()
  } catch { return initialState() }
}

function writeDb(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); return db }
function filterRows(rows, query = '') {
  const params = new URLSearchParams(String(query).replace(/^&/, ''))
  return rows.filter(row => [...params.entries()].filter(([k]) => k !== 'order').every(([k,v]) => v.startsWith('eq.') ? String(row[k] ?? '') === decodeURIComponent(v.slice(3)) : true))
}

export async function selectRows(table, query = '') {
  const db = readDb()
  if (!db[table]) throw new Error(`Unknown P2 database table: ${table}`)
  let rows = filterRows(db[table], query)
  if (new URLSearchParams(String(query).replace(/^&/, '')).get('order') === 'created_at.desc') rows = [...rows].sort((a,b) => String(b.created_at||'').localeCompare(String(a.created_at||'')))
  return clone(rows)
}

export async function insertRows(table, rows) {
  const db = readDb(); if (!db[table]) throw new Error(`Unknown P2 database table: ${table}`)
  const input = Array.isArray(rows) ? rows : [rows]
  const inserted = input.map(x => ({ id: x.id || `ID-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, created_at: x.created_at || new Date().toISOString(), ...x }))
  db[table].push(...clone(inserted)); writeDb(db); return clone(inserted)
}

export async function updateRows(table, query, values) {
  const db = readDb(); if (!db[table]) throw new Error(`Unknown P2 database table: ${table}`)
  const matched = []
  db[table] = db[table].map(row => {
    if (!filterRows([row], query).length) return row
    const changed = { ...row, ...values }
    matched.push(changed)
    return changed
  })
  writeDb(db); return clone(matched)
}

export async function deleteRows(table, query) {
  const db = readDb(); if (!db[table]) throw new Error(`Unknown P2 database table: ${table}`)
  db[table] = db[table].filter(row => !filterRows([row], query).length); writeDb(db); return []
}

export function resetRDatabase() { localStorage.removeItem(DB_KEY); return initialState() }
export const supabaseConfigured = true
export const RD_MODE = true

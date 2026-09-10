import { P2_MASTER_MAPPINGS, P2_TEST_INVOICES, P2_TEST_HISTORY, P2_TEST_PR_PO_UTR, P2_TEST_DOCUMENTS, P2_USERS } from '../data/p2Seed'

const DB_KEY = 'p2_rnd_database_v1'
const clone = value => JSON.parse(JSON.stringify(value))

function initialState() {
  const vendors = [...new Set(P2_MASTER_MAPPINGS.map(x => x.vendor))].map((name, i) => ({ id: `VEN-${String(i+1).padStart(3,'0')}`, name }))
  const warehouses = [...new Set(P2_MASTER_MAPPINGS.map(x => x.warehouse))].map((code, i) => ({ id: `WH-${String(i+1).padStart(3,'0')}`, code }))
  const vendor_warehouse_map = P2_MASTER_MAPPINGS.map(x => ({ id: x.id, organization: x.organization, warehouse: x.warehouse, project_location: x.project_location, vendor: x.vendor, service_type: x.service_type }))
  return { users: clone(P2_USERS), vendors, warehouses, vendor_warehouse_map, invoice_records: clone(P2_TEST_INVOICES), workflow_history: clone(P2_TEST_HISTORY), pr_po_utr: clone(P2_TEST_PR_PO_UTR), document_records: clone(P2_TEST_DOCUMENTS) }
}

function readDb() {
  try { const saved = localStorage.getItem(DB_KEY); return saved ? JSON.parse(saved) : initialState() } catch { return initialState() }
}
function writeDb(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); return db }
function filterRows(rows, query = '') {
  const params = new URLSearchParams(String(query).replace(/^&/, ''))
  return rows.filter(row => [...params.entries()].filter(([k]) => k !== 'order').every(([k,v]) => v.startsWith('eq.') ? String(row[k] ?? '') === decodeURIComponent(v.slice(3)) : true))
}

function visibleForSession(table, rows) {
  let session = null
  try { session = JSON.parse(localStorage.getItem('p2v2_auth_session_v4') || 'null') } catch {}
  const user = session?.profile
  if (!user || user.role === 'ADMIN') return rows
  if (table === 'invoice_records') {
    if (user.role === 'VENDOR') return rows.filter(r => String(r.vendor).toLowerCase() === String(user.display_name || user.username).toLowerCase())
    if (user.role === 'WH') return rows.filter(r => (user.warehouses || []).includes(r.warehouse))
  }
  if (table === 'vendors' && user.role === 'VENDOR') return rows.filter(r => r.name === user.display_name)
  if (table === 'warehouses' && user.role === 'WH') return rows.filter(r => (user.warehouses || []).includes(r.code))
  if (table === 'vendor_warehouse_map') {
    if (user.role === 'VENDOR') return rows.filter(r => r.vendor === user.display_name && (user.warehouses || []).includes(r.warehouse))
    if (user.role === 'WH') return rows.filter(r => (user.warehouses || []).includes(r.warehouse))
  }
  return rows
}

function mappingMatches(invoice) {
  return P2_MASTER_MAPPINGS.some(m =>
    m.organization === invoice.organization &&
    m.warehouse === invoice.warehouse &&
    m.project_location === invoice.project_location &&
    m.vendor === invoice.vendor &&
    m.service_type === invoice.service_type
  )
}

function assertInvoiceInsert(db, row) {
  const role = (() => { try { return JSON.parse(localStorage.getItem('p2v2_auth_session_v4') || 'null')?.profile?.role } catch { return null } })()
  if (!row.inv_no || !String(row.inv_no).trim()) throw new Error('Invoice Number is required.')
  const duplicate = db.invoice_records.some(x => String(x.inv_no).trim().toLowerCase() === String(row.inv_no).trim().toLowerCase())
  if (duplicate) throw new Error(`Duplicate Invoice Number rejected: ${row.inv_no}`)
  if (!mappingMatches(row)) throw new Error('Invalid master mapping: Organization, Warehouse, Project/Location, Vendor and Service Type must match the approved P2 master mapping.')
  if (row.route_type && !['WH_INITIATED', 'VENDOR_INITIATED'].includes(row.route_type)) throw new Error('Invalid invoice route.')
  if (role === 'VENDOR' && row.route_type !== 'VENDOR_INITIATED') throw new Error('Vendor can create only Vendor-initiated invoices.')
  if (role === 'WH' && row.route_type !== 'WH_INITIATED') throw new Error('Warehouse can create only WH-initiated invoices.')
  if (row.service_type === 'HK' || row.service_type === 'Security') {
    if (row.contract_type !== 'Minimum Wages') throw new Error(`${row.service_type} is allowed only under Minimum Wages.`)
  }
  if (row.service_type === 'Manpower' && !['Commercial', 'Minimum Wages'].includes(row.contract_type)) throw new Error('Manpower requires Commercial or Minimum Wages contract.')
}

function validStageAction(profileRole, stage, status, action) {
  const roleStage = { WH: 'WH', GAC_COMPLIANCE: 'GAC_COMPLIANCE', GAC_PO: 'GAC_PO', ACCOUNTS: 'ACCOUNTS', CBO_OFFICE: 'CBO_OFFICE', CBO_OFFICER: 'CBO_OFFICER' }
  if (roleStage[profileRole] !== stage) throw new Error('This action is not allowed for your role at the current workflow stage.')
  const allowed = {
    WH: ['Accept','Query','Return','Reject'],
    GAC_COMPLIANCE: ['Accept','Query','Return','Reject','Compliance Checked'],
    GAC_PO: ['Accept','Query','Return','Reject','PO Mapping'],
    ACCOUNTS: ['Accept','Query','Return','Reject','UTR Mapping'],
    CBO_OFFICE: ['Accept','Query','Return','Reject'],
    CBO_OFFICER: ['Approve','Query','Return','Reject']
  }
  if (!allowed[profileRole]?.includes(action)) throw new Error('Invalid workflow action for this role.')
  const validStatusByRole = {
    WH: ['SUBMITTED','QUERY','RETURNED'],
    GAC_COMPLIANCE: ['PR_MAPPED','QUERY','RETURNED'],
    GAC_PO: ['COMPLIANCE_CHECKED','QUERY','RETURNED'],
    ACCOUNTS: ['PO_MAPPED','APPROVED_FOR_PAYMENT','QUERY','RETURNED'],
    CBO_OFFICE: ['SUBMITTED','QUERY','RETURNED'],
    CBO_OFFICER: ['SUBMITTED','QUERY','RETURNED']
  }
  if (!validStatusByRole[profileRole]?.includes(status)) throw new Error(`Stage/status gate failed: ${status} cannot be actioned by ${profileRole}.`)
  if (profileRole === 'ACCOUNTS' && action === 'UTR Mapping' && status !== 'APPROVED_FOR_PAYMENT') throw new Error('UTR Mapping is available only after CBO Officer approval.')
  if (profileRole !== 'ACCOUNTS' && action === 'UTR Mapping') throw new Error('Only final Accounts can map UTR.')
  if (profileRole !== 'GAC_PO' && action === 'PO Mapping') throw new Error('Only GAC PO can perform PO Mapping.')
}

export async function selectRows(table, query = '') {
  const db = readDb(); if (!db[table]) throw new Error(`Unknown P2 database table: ${table}`)
  let rows = visibleForSession(table, filterRows(db[table], query))
  if (new URLSearchParams(String(query).replace(/^&/, '')).get('order') === 'created_at.desc') rows = [...rows].sort((a,b) => String(b.created_at||'').localeCompare(String(a.created_at||'')))
  return clone(rows)
}

export async function insertRows(table, rows) {
  const db = readDb(); if (!db[table]) throw new Error(`Unknown P2 database table: ${table}`)
  const input = Array.isArray(rows) ? rows : [rows]
  for (const row of input) {
    if (table === 'invoice_records') assertInvoiceInsert(db, row)
    if (table === 'pr_po_utr') {
      if (!row.invoice_id) throw new Error('PR/PO/UTR record requires invoice_id.')
      if (row.pr_number && !['WH','ADMIN'].includes(JSON.parse(localStorage.getItem('p2v2_auth_session_v4') || '{}')?.profile?.role)) throw new Error('Only Warehouse can map PR.')
      if (row.po_number && !['GAC_PO','ADMIN'].includes(JSON.parse(localStorage.getItem('p2v2_auth_session_v4') || '{}')?.profile?.role)) throw new Error('Only GAC PO can map PO.')
      if (row.utr_number && !['ACCOUNTS','ADMIN'].includes(JSON.parse(localStorage.getItem('p2v2_auth_session_v4') || '{}')?.profile?.role)) throw new Error('Only final Accounts can map UTR.')
    }
  }
  const inserted = input.map(x => ({ id: x.id || `ID-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, created_at: x.created_at || new Date().toISOString(), ...x }))
  db[table].push(...clone(inserted)); writeDb(db); return clone(inserted)
}

export async function updateRows(table, query, values) {
  const db = readDb(); if (!db[table]) throw new Error(`Unknown P2 database table: ${table}`)
  const matched = []
  if (table === 'invoice_records' && (values.current_stage || values.current_status)) {
    const sessionRole = (() => { try { return JSON.parse(localStorage.getItem('p2v2_auth_session_v4') || 'null')?.profile?.role } catch { return null } })()
    const hits = filterRows(db[table], query)
    if (hits.length !== 1) throw new Error('Workflow update must target exactly one invoice.')
    const row = hits[0]
    const action = (() => { try { return JSON.parse(localStorage.getItem('p2v2_pending_action') || 'null') } catch { return null } })()
    if (action?.action) validStageAction(sessionRole, row.current_stage, row.current_status, action.action)
    if (values.current_stage === 'ACCOUNTS' && values.current_status === 'PAID' && !values.paid_at) throw new Error('PAID requires paid_at timestamp.')
  }
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
export function setPendingWorkflowAction(action) { localStorage.setItem('p2v2_pending_action', JSON.stringify(action || null)) }
export const supabaseConfigured = false
export const RD_MODE = true

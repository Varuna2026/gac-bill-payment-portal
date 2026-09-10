import { P2_MASTER_MAPPINGS, P2_USERS } from '../data/p2Seed'

const DB_KEY = 'p2_rnd_database_v1'
const clone = value => JSON.parse(JSON.stringify(value))
const sessionProfile = () => { try { return JSON.parse(localStorage.getItem('p2v2_auth_session_v4') || 'null')?.profile || null } catch { return null } }

function initialState() {
  const vendors = [...new Set(P2_MASTER_MAPPINGS.map(x => x.vendor))].map((name, i) => ({ id: `VEN-${String(i+1).padStart(3,'0')}`, name }))
  const warehouses = [...new Set(P2_MASTER_MAPPINGS.map(x => x.warehouse))].map((code, i) => ({ id: `WH-${String(i+1).padStart(3,'0')}`, code }))
  const vendor_warehouse_map = P2_MASTER_MAPPINGS.map(x => ({ id: x.id, organization: x.organization, warehouse: x.warehouse, project_location: x.project_location, vendor: x.vendor, service_type: x.service_type }))
  return { users: clone(P2_USERS), vendors, warehouses, vendor_warehouse_map, bill_requests: [], invoice_records: [], workflow_history: [], pr_po_utr: [], document_records: [] }
}

function purgeLegacyTestData(db) {
  const testIds = new Set((db.invoice_records || []).filter(r => String(r.inv_no || '').startsWith('P2-TEST-')).map(r => r.id))
  if (!testIds.size) return db
  db.invoice_records = db.invoice_records.filter(r => !testIds.has(r.id))
  db.workflow_history = (db.workflow_history || []).filter(r => !testIds.has(r.invoice_id))
  db.pr_po_utr = (db.pr_po_utr || []).filter(r => !testIds.has(r.invoice_id))
  db.document_records = (db.document_records || []).filter(r => !testIds.has(r.invoice_id))
  return db
}

function readDb() {
  try {
    const saved = localStorage.getItem(DB_KEY)
    const db = purgeLegacyTestData(saved ? JSON.parse(saved) : initialState())
    if (!db.bill_requests) db.bill_requests = []
    if (!db.invoice_records) db.invoice_records = []
    if (!db.workflow_history) db.workflow_history = []
    if (!db.pr_po_utr) db.pr_po_utr = []
    if (!db.document_records) db.document_records = []
    writeDb(db)
    return db
  } catch { return initialState() }
}
function writeDb(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); return db }
function filterRows(rows, query = '') { const params = new URLSearchParams(String(query).replace(/^&/, '')); return rows.filter(row => [...params.entries()].filter(([k]) => k !== 'order').every(([k,v]) => v.startsWith('eq.') ? String(row[k] ?? '') === decodeURIComponent(v.slice(3)) : true)) }
function visibleForSession(table, rows) {
  const user = sessionProfile(); if (!user || user.role === 'ADMIN') return rows
  if (table === 'invoice_records') { if (user.role === 'VENDOR') return rows.filter(r => String(r.vendor).toLowerCase() === String(user.display_name || user.username).toLowerCase()); if (user.role === 'WH') return rows.filter(r => (user.warehouses || []).includes(r.warehouse)) }
  if (table === 'bill_requests') { if (user.role === 'VENDOR') return rows.filter(r => String(r.vendor).toLowerCase() === String(user.display_name || user.username).toLowerCase()); if (user.role === 'WH') return rows.filter(r => (user.warehouses || []).includes(r.warehouse)) }
  if (table === 'vendors' && user.role === 'VENDOR') return rows.filter(r => r.name === user.display_name)
  if (table === 'warehouses' && user.role === 'WH') return rows.filter(r => (user.warehouses || []).includes(r.code))
  if (table === 'vendor_warehouse_map') { if (user.role === 'VENDOR') return rows.filter(r => r.vendor === user.display_name && (user.warehouses || []).includes(r.warehouse)); if (user.role === 'WH') return rows.filter(r => (user.warehouses || []).includes(r.warehouse)) }
  return rows
}
function mappingMatches(invoice) { return P2_MASTER_MAPPINGS.some(m => m.organization === invoice.organization && m.warehouse === invoice.warehouse && m.project_location === invoice.project_location && m.vendor === invoice.vendor && m.service_type === invoice.service_type) }
function assertInvoiceInsert(db, row) {
  const role = sessionProfile()?.role
  if (!row.inv_no || !String(row.inv_no).trim()) throw new Error('Invoice Number is required.')
  if (db.invoice_records.some(x => String(x.inv_no).trim().toLowerCase() === String(row.inv_no).trim().toLowerCase())) throw new Error(`Duplicate Invoice Number rejected: ${row.inv_no}`)
  if (!mappingMatches(row)) throw new Error('Invalid master mapping: Organization, Warehouse, Project/Location, Vendor and Service Type must match the approved P2 master mapping.')
  if (row.route_type && !['WH_INITIATED','VENDOR_INITIATED'].includes(row.route_type)) throw new Error('Invalid invoice route.')
  if (role === 'VENDOR' && !['WH_INITIATED','VENDOR_INITIATED'].includes(row.route_type)) throw new Error('Invalid Vendor invoice route.')
  if (row.service_type === 'HK' || row.service_type === 'Security') { if (row.contract_type !== 'Minimum Wages') throw new Error(`${row.service_type} is allowed only under Minimum Wages.`) }
  if (row.service_type === 'Manpower' && !['Commercial','Minimum Wages'].includes(row.contract_type)) throw new Error('Manpower requires Commercial or Minimum Wages contract.')
  const maxMonth = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })()
  if (!row.invoice_month || row.invoice_month > maxMonth) throw new Error(`Invoice Month cannot be later than ${maxMonth}.`)
  if (row.route_type === 'WH_INITIATED' && row.invoice_month !== maxMonth) throw new Error(`Invoices before ${maxMonth} must be raised through the Vendor-initiated route without WH operational documents.`)
  if (row.route_type === 'VENDOR_INITIATED' && row.invoice_month >= maxMonth) throw new Error(`Vendor-initiated Route 2 is only for invoices before ${maxMonth}.`)
  const expectedGst = Math.round((Number(row.taxable_amt) || 0) * 0.18 * 100) / 100
  if (Math.abs((Number(row.gst_amt) || 0) - expectedGst) > 0.01) throw new Error('GST must be exactly 18% of the entered invoice amount.')
}
function assertWorkflowTransition(row, values) {
  const user = sessionProfile(); const role = user?.role; if (!role || role === 'ADMIN') return
  const stage = row.current_stage; const status = row.current_status; const ns = values.current_stage; const nst = values.current_status
  const fail = msg => { throw new Error(`Workflow gate failed: ${msg}`) }
  if (stage === 'WH' && role !== 'WH') fail('only Warehouse may action a Warehouse-stage invoice')
  if (stage === 'GAC_COMPLIANCE' && role !== 'GAC_COMPLIANCE') fail('only GAC Compliance may action this stage')
  if (stage === 'GAC_PO' && role !== 'GAC_PO') fail('only GAC PO may action this stage')
  if (stage === 'ACCOUNTS' && role !== 'ACCOUNTS') fail('only Accounts may action this stage')
  if (stage === 'CBO_OFFICE' && role !== 'CBO_OFFICE') fail('only CBO Office may action this stage')
  if (stage === 'CBO_OFFICER' && role !== 'CBO_OFFICER') fail('only CBO Officer may action this stage')
  if (role === 'WH' && status === 'SUBMITTED' && ns === 'GAC_COMPLIANCE' && nst === 'PR_MAPPED') return
  if (role === 'GAC_COMPLIANCE' && status === 'PR_MAPPED' && ns === 'GAC_PO' && nst === 'COMPLIANCE_CHECKED') return
  if (role === 'GAC_PO' && status === 'COMPLIANCE_CHECKED' && ns === 'ACCOUNTS' && nst === 'PO_MAPPED') return
  if (role === 'ACCOUNTS' && status === 'PO_MAPPED' && ns === 'CBO_OFFICE' && nst === 'SUBMITTED') return
  if (role === 'CBO_OFFICE' && status === 'SUBMITTED' && ns === 'CBO_OFFICER' && nst === 'SUBMITTED') return
  if (role === 'CBO_OFFICER' && status === 'SUBMITTED' && ns === 'ACCOUNTS' && nst === 'APPROVED_FOR_PAYMENT') return
  if (role === 'ACCOUNTS' && status === 'APPROVED_FOR_PAYMENT' && ns === 'ACCOUNTS' && nst === 'PAID') return
  const queryReturnReject = ['QUERY','RETURNED','REJECTED'].includes(nst)
  if (queryReturnReject) { const destinations = { WH:['VENDOR'], GAC_COMPLIANCE:['VENDOR','WH'], GAC_PO:['VENDOR','WH'], ACCOUNTS:['GAC_PO'], CBO_OFFICE:['ACCOUNTS','GAC_PO','WH','VENDOR'], CBO_OFFICER:['CBO_OFFICE','ACCOUNTS','GAC_PO','WH','VENDOR'] }[role] || []; if (!destinations.includes(ns)) fail(`invalid correction/rejection destination ${ns}`); return }
  fail(`${role} cannot change ${stage}/${status} to ${ns}/${nst}`)
}
export async function selectRows(table, query = '') { const db = readDb(); if (!db[table]) throw new Error(`Unknown P2 database table: ${table}`); let rows = visibleForSession(table, filterRows(db[table], query)); if (new URLSearchParams(String(query).replace(/^&/, '')).get('order') === 'created_at.desc') rows = [...rows].sort((a,b) => String(b.created_at||'').localeCompare(String(a.created_at||''))); return clone(rows) }
export async function insertRows(table, rows) { const db = readDb(); if (!db[table]) throw new Error(`Unknown P2 database table: ${table}`); const input = Array.isArray(rows) ? rows : [rows]; for (const row of input) { if (table === 'invoice_records') assertInvoiceInsert(db, row); if (table === 'pr_po_utr') { const role = sessionProfile()?.role; if (!row.invoice_id) throw new Error('PR/PO/UTR record requires invoice_id.'); if (row.pr_number && !['WH','ADMIN'].includes(role)) throw new Error('Only Warehouse can map PR.'); if (row.po_number && !['GAC_PO','ADMIN'].includes(role)) throw new Error('Only GAC PO can map PO.'); if (row.utr_number && !['ACCOUNTS','ADMIN'].includes(role)) throw new Error('Only final Accounts can map UTR.') } } const inserted = input.map(x => ({ id: x.id || `ID-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, created_at: x.created_at || new Date().toISOString(), ...x })); db[table].push(...clone(inserted)); writeDb(db); return clone(inserted) }
export async function updateRows(table, query, values) { const db = readDb(); if (!db[table]) throw new Error(`Unknown P2 database table: ${table}`); const hits = filterRows(db[table], query); if (table === 'invoice_records' && (values.current_stage || values.current_status)) { if (hits.length !== 1) throw new Error('Workflow update must target exactly one invoice.'); assertWorkflowTransition(hits[0], values) } const matched = []; db[table] = db[table].map(row => { if (!filterRows([row], query).length) return row; const changed = { ...row, ...values }; matched.push(changed); return changed }); writeDb(db); return clone(matched) }
export async function deleteRows(table, query) { const db = readDb(); if (!db[table]) throw new Error(`Unknown P2 database table: ${table}`); db[table] = db[table].filter(row => !filterRows([row], query).length); writeDb(db); return [] }
export function resetRDatabase() { localStorage.removeItem(DB_KEY); return initialState() }
export const supabaseConfigured = false
export const RD_MODE = true

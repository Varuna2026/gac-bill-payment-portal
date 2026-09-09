const storagePrefix = 'p2v2_rd_'

// Kept true so the existing App shell continues into the portal; all reads/writes
// below are local browser storage and do not contact Supabase.
export const supabaseConfigured = true
export const RD_MODE = true

const seed = {
  invoice_records: [
    { id: 'rd-inv-001', company: 'VIL', project_location: 'R&D Demo Location', vendor: 'Vendor01', contract_type: 'Minimum Wages', service_type: 'Manpower', sub_category: 'Other', inv_no: 'RD-001', taxable_amt: 100000, amt_incl_gst: 118000, current_status: 'SUBMITTED', current_stage: 'WH', current_responsible_user: 'WH01', latest_remarks: 'R&D sample invoice', created_at: new Date().toISOString(), last_action_at: new Date().toISOString() },
    { id: 'rd-inv-002', company: 'VWPL', project_location: 'R&D Demo Location', vendor: 'Vendor01', contract_type: 'Commercial', service_type: 'Manpower', sub_category: 'Other', inv_no: 'RD-002', taxable_amt: 150000, amt_incl_gst: 177000, current_status: 'PR_MAPPED', current_stage: 'GAC_COMPLIANCE', current_responsible_user: 'GAC-C01', latest_remarks: 'PR mapped by Warehouse', created_at: new Date().toISOString(), last_action_at: new Date().toISOString() },
    { id: 'rd-inv-003', company: 'VIL', project_location: 'R&D Demo Location', vendor: 'Vendor01', contract_type: 'Others', service_type: 'Other', sub_category: null, inv_no: 'RD-003', taxable_amt: 50000, amt_incl_gst: 59000, current_status: 'APPROVED_FOR_PAYMENT', current_stage: 'ACCOUNTS', current_responsible_user: 'ACC01', latest_remarks: 'Approved for payment', created_at: new Date().toISOString(), last_action_at: new Date().toISOString() },
  ],
  workflow_history: [],
  pr_po_utr: [],
  document_records: [],
}

function key(table) { return `${storagePrefix}${table}` }
function clone(value) { return JSON.parse(JSON.stringify(value)) }
function ensure(table) {
  const k = key(table)
  const existing = localStorage.getItem(k)
  if (existing) return JSON.parse(existing)
  const value = clone(seed[table] || [])
  localStorage.setItem(k, JSON.stringify(value))
  return value
}
function save(table, rows) { localStorage.setItem(key(table), JSON.stringify(rows)); return clone(rows) }
function parseFilters(query = '') {
  return query.split('&').filter(Boolean).map(x => x.split('=')).filter(([field, op]) => field && op && op.startsWith('eq.')).map(([field, op]) => [field, decodeURIComponent(op.slice(3))])
}
function matches(row, query) { return parseFilters(query).every(([field, value]) => String(row[field] ?? '') === value) }

export async function selectRows(table, query = '') {
  let rows = ensure(table)
  rows = rows.filter(row => matches(row, query))
  if (query.includes('order=created_at.desc')) rows.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
  return clone(rows)
}

export async function insertRows(table, rows) {
  const current = ensure(table)
  const inserted = rows.map(row => ({ id: row.id || `rd-${table}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, created_at: row.created_at || new Date().toISOString(), ...row }))
  save(table, [...current, ...inserted])
  return clone(inserted)
}

export async function updateRows(table, query, values) {
  const current = ensure(table)
  const updated = current.map(row => matches(row, query) ? { ...row, ...values } : row)
  save(table, updated)
  return clone(updated.filter(row => matches(row, query)))
}

export async function deleteRows(table, query) {
  const current = ensure(table)
  save(table, current.filter(row => !matches(row, query)))
  return []
}

export async function uploadStorage(path, file) {
  const reader = new FileReader()
  const dataUrl = await new Promise((resolve, reject) => { reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file) })
  localStorage.setItem(`${storagePrefix}file_${path}`, dataUrl)
  return { path, local: true }
}

export function resetRDSampleData() {
  Object.keys(seed).forEach(table => localStorage.setItem(key(table), JSON.stringify(clone(seed[table]))))
}

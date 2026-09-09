const storagePrefix = 'p2v2_rd_'

// P2 R&D is intentionally Git-only. This module keeps the existing service API
// while using browser localStorage for R&D runtime data; no Supabase calls exist.
export const supabaseConfigured = true
export const RD_MODE = true

const seed = {
  vendors: [
    { id: 'vendor-01', username: 'Vendor01', name: 'Vendor01', active: true },
    { id: 'vendor-02', username: 'Vendor02', name: 'Vendor02', active: true },
  ],
  warehouses: [
    { id: 'wh-01', code: 'WH01', name: 'Warehouse 01', active: true },
    { id: 'wh-02', code: 'WH02', name: 'Warehouse 02', active: true },
  ],
  vendor_warehouse_map: [
    { id: 'map-01', vendor_id: 'vendor-01', warehouse_id: 'wh-01' },
    { id: 'map-02', vendor_id: 'vendor-01', warehouse_id: 'wh-02' },
    { id: 'map-03', vendor_id: 'vendor-02', warehouse_id: 'wh-01' },
    { id: 'map-04', vendor_id: 'vendor-02', warehouse_id: 'wh-02' },
  ],
  invoice_records: [
    { id: 'rd-inv-001', company: 'VIL', project_location: 'R&D Demo Location', vendor: 'Vendor01', vendor_id: 'vendor-01', warehouse: 'WH01', warehouse_id: 'wh-01', contract_type: 'Minimum Wages', service_type: 'Manpower', sub_category: 'Other', inv_no: 'RD-001', invoice_month: '2026-08', invoice_date: '2026-08-31', taxable_amt: 100000, gst_amt: 18000, amt_incl_gst: 118000, current_status: 'SUBMITTED', current_stage: 'WH', current_responsible_user: 'WH01', latest_remarks: 'R&D sample invoice', created_at: new Date().toISOString(), last_action_at: new Date().toISOString() },
    { id: 'rd-inv-002', company: 'VWPL', project_location: 'R&D Demo Location', vendor: 'Vendor01', vendor_id: 'vendor-01', warehouse: 'WH02', warehouse_id: 'wh-02', contract_type: 'Commercial', service_type: 'Manpower', sub_category: 'Other', inv_no: 'RD-002', invoice_month: '2026-08', invoice_date: '2026-08-31', taxable_amt: 150000, gst_amt: 27000, amt_incl_gst: 177000, current_status: 'PR_MAPPED', current_stage: 'GAC_COMPLIANCE', current_responsible_user: 'GAC-C01', latest_remarks: 'PR mapped by Warehouse', created_at: new Date().toISOString(), last_action_at: new Date().toISOString() },
    { id: 'rd-inv-003', company: 'VIL', project_location: 'R&D Demo Location', vendor: 'Vendor01', vendor_id: 'vendor-01', warehouse: 'WH01', warehouse_id: 'wh-01', contract_type: 'Others', service_type: 'Other', sub_category: 'Other', inv_no: 'RD-003', invoice_month: '2026-08', invoice_date: '2026-08-31', taxable_amt: 50000, gst_amt: 9000, amt_incl_gst: 59000, current_status: 'APPROVED_FOR_PAYMENT', current_stage: 'ACCOUNTS', current_responsible_user: 'ACC01', latest_remarks: 'Approved for payment', created_at: new Date().toISOString(), last_action_at: new Date().toISOString() },
    { id: 'rd-inv-004', company: 'VWPL', project_location: 'R&D Demo Location', vendor: 'Vendor02', vendor_id: 'vendor-02', warehouse: 'WH02', warehouse_id: 'wh-02', contract_type: 'Commercial', service_type: 'Manpower', sub_category: 'Other', inv_no: 'RD-004', invoice_month: '2026-08', invoice_date: '2026-08-31', taxable_amt: 120000, gst_amt: 21600, amt_incl_gst: 141600, current_status: 'QUERY', current_stage: 'VENDOR', current_responsible_user: 'Vendor02', latest_remarks: 'R&D query/resubmission scenario', created_at: new Date().toISOString(), last_action_at: new Date().toISOString() },
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
  let rows = ensure(table).filter(row => matches(row, query))
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
  const updated = current.map(row => matches(row, query) ? { ...row, ...values, last_action_at: new Date().toISOString() } : row)
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
  return { path, local: true, name: file.name, size: file.size, type: file.type }
}

export function getRDFile(path) { return localStorage.getItem(`${storagePrefix}file_${path}`) }

export function resetRDSampleData() {
  Object.keys(seed).forEach(table => localStorage.setItem(key(table), JSON.stringify(clone(seed[table]))))
}

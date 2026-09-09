import { useEffect, useMemo, useState } from 'react'
import { NAVIGATION_BY_ROLE } from './config/navigation'
import { ROLE_LABELS, ROLES } from './config/roles'
import { CONTRACT_TYPES, ROUTES, WORKFLOW_STATUS } from './config/workflow'
import { getStoredSession, loginWithUsername, logout } from './services/auth'
import { insertRows, selectRows, supabaseConfigured, updateRows, uploadStorage } from './services/supabaseRest'
import './App.css'

const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0))
const stageLabel = { VENDOR: 'Vendor', WH: 'Warehouse', GAC_COMPLIANCE: 'GAC — Compliance', GAC_PO: 'GAC — PO', ACCOUNTS: 'Accounts', CBO_OFFICE: 'CBO Office', CBO_OFFICER: 'CBO Officer' }
const roleStage = { WH: 'WH', GAC_COMPLIANCE: 'GAC_COMPLIANCE', GAC_PO: 'GAC_PO', ACCOUNTS: 'ACCOUNTS', CBO_OFFICE: 'CBO_OFFICE', CBO_OFFICER: 'CBO_OFFICER' }

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true)
    try { onLogin(await loginWithUsername(username, password)) } catch (err) { setError(err.message || 'Invalid ID or Password.') } finally { setBusy(false) }
  }
  return <div className="login-shell"><div className="login-card"><div className="login-brand">GAC</div><div className="login-title">GAC Bill Payment Portal</div><p className="login-subtitle">P2V2 secure sign-in</p>{error && <div className="notice login-error">{error}</div>}<form onSubmit={submit}><label>User ID<input autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter User ID" autoFocus /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter Password" /></label><button className="primary login-button" disabled={busy || !username || !password}>{busy ? 'Signing in…' : 'Login'}</button></form></div></div>
}

function App() {
  const [session, setSession] = useState(() => getStoredSession())
  const [active, setActive] = useState('Dashboard')
  const [search, setSearch] = useState('')
  const [company, setCompany] = useState('All')
  const [type, setType] = useState('All')
  const [data, setData] = useState([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  const profile = session?.profile
  const token = session?.access_token
  const role = profile?.role
  const nav = NAVIGATION_BY_ROLE[role] || NAVIGATION_BY_ROLE[ROLES.ADMIN]

  useEffect(() => {
    if (!profile || !supabaseConfigured) return
    let cancelled = false
    const load = async () => {
      setBusy(true); setError('')
      try {
        const rows = await selectRows('invoice_records', '&order=created_at.desc', token)
        if (!cancelled) setData(rows)
      } catch (err) { if (!cancelled) setError(err.message || 'Unable to load invoice records.') }
      finally { if (!cancelled) setBusy(false) }
    }
    load()
    return () => { cancelled = true }
  }, [profile, token, refresh])

  if (!profile) return <Login onLogin={p => setSession(getStoredSession() || { profile: p })} />
  if (!supabaseConfigured) return <div className="login-shell"><div className="login-card"><div className="login-brand">GAC</div><div className="login-title">GAC Bill Payment Portal</div><div className="notice login-error">Supabase is not configured. Add the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values to the deployment environment.</div></div></div>

  const canSee = (row) => {
    if (role === ROLES.ADMIN) return true
    if (role !== ROLES.VENDOR) return true
    const candidates = [profile.username, profile.display_name].filter(Boolean).map(String).map(x => x.toLowerCase())
    return candidates.includes(String(row.vendor || '').toLowerCase())
  }
  const filtered = useMemo(() => data.filter(canSee).filter(x => `${x.inv_no} ${x.vendor} ${x.project_location}`.toLowerCase().includes(search.toLowerCase()) && (company === 'All' || x.company === company) && (type === 'All' || x.contract_type === type)), [data, search, company, type, role, profile])

  const handleLogout = async () => { await logout(); setSession(null) }

  const refreshData = () => setRefresh(x => x + 1)
  const action = async (invoice, selectedAction) => {
    const now = new Date().toISOString()
    let nextStage = invoice.current_stage
    let status = invoice.current_status
    let extra = {}
    let remarks = window.prompt(`Remarks for ${selectedAction} (optional):`, '') || ''

    if (selectedAction === 'Accept') {
      status = WORKFLOW_STATUS.ACCEPTED
      if (role === ROLES.WH) { nextStage = 'WH'; const pr = window.prompt('PR Number (required after WH acceptance):', ''); if (!pr) return; extra = { pr_number: pr, pr_mapped_by: profile.id, pr_mapped_at: now }; status = WORKFLOW_STATUS.PR_MAPPED; nextStage = 'GAC_COMPLIANCE' }
      else if (role === ROLES.GAC_COMPLIANCE) { status = WORKFLOW_STATUS.IN_Q; nextStage = 'GAC_COMPLIANCE' }
      else if (role === ROLES.GAC_PO) { nextStage = 'GAC_PO' }
      else if (role === ROLES.ACCOUNTS) { nextStage = 'CBO_OFFICE' }
      else if (role === ROLES.CBO_OFFICE) { nextStage = 'CBO_OFFICER' }
      else if (role === ROLES.CBO_OFFICER) { status = WORKFLOW_STATUS.APPROVED_FOR_PAYMENT; nextStage = 'ACCOUNTS' }
    } else if (selectedAction === 'Compliance Checked') {
      status = WORKFLOW_STATUS.COMPLIANCE_CHECKED; nextStage = 'GAC_PO'
    } else if (selectedAction === 'PO Mapping') {
      const po = window.prompt('PO Number (required):', ''); if (!po) return
      status = WORKFLOW_STATUS.PO_MAPPED; nextStage = 'ACCOUNTS'; extra = { po_number: po, po_mapped_by: profile.id, po_mapped_at: now }
    } else if (selectedAction === 'Approve') {
      status = WORKFLOW_STATUS.APPROVED_FOR_PAYMENT; nextStage = 'ACCOUNTS'
    } else if (selectedAction === 'UTR Mapping') {
      const utr = window.prompt('UTR Number (required):', ''); if (!utr) return
      status = WORKFLOW_STATUS.PAID; nextStage = 'ACCOUNTS'; extra = { utr_number: utr, utr_mapped_by: profile.id, utr_mapped_at: now }
    } else if (selectedAction === 'Query' || selectedAction === 'Return' || selectedAction === 'Reject') {
      status = selectedAction === 'Query' ? WORKFLOW_STATUS.QUERY : selectedAction === 'Return' ? WORKFLOW_STATUS.RETURNED : WORKFLOW_STATUS.REJECTED
      const destinations = { WH: 'VENDOR', GAC_COMPLIANCE: 'VENDOR', GAC_PO: 'VENDOR', ACCOUNTS: 'GAC_PO', CBO_OFFICE: 'ACCOUNTS', CBO_OFFICER: 'CBO_OFFICE' }
      nextStage = window.prompt(`Route ${selectedAction} to:`, destinations[role] || 'VENDOR') || destinations[role] || invoice.current_stage
    } else return

    try {
      setBusy(true); setError('')
      await updateRows('invoice_records', `id=eq.${invoice.id}`, { current_status: status, current_stage: nextStage, current_responsible_user: null, latest_remarks: remarks })
      await insertRows('workflow_history', [{ invoice_id: invoice.id, from_stage: invoice.current_stage, to_stage: nextStage, action: selectedAction, actor_user: profile.id, remarks, action_at: now }], token)
      if (Object.keys(extra).length) {
        const existing = await selectRows('pr_po_utr', `&invoice_id=eq.${invoice.id}`, token)
        if (existing.length) await updateRows('pr_po_utr', `invoice_id=eq.${invoice.id}`, extra, token)
        else await insertRows('pr_po_utr', [{ invoice_id: invoice.id, ...extra }], token)
      }
      setNotice(`${selectedAction} recorded for ${invoice.inv_no}.`); refreshData()
    } catch (err) { setError(err.message || 'Workflow action failed.') }
    finally { setBusy(false) }
  }

  const submit = async (payload) => {
    try {
      setBusy(true); setError('')
      const created = await insertRows('invoice_records', [{ ...payload, current_status: WORKFLOW_STATUS.SUBMITTED, current_stage: 'WH', current_responsible_user: null, latest_remarks: payload.remarks || null }], token)
      const invoice = created[0]
      if (invoice) await insertRows('workflow_history', [{ invoice_id: invoice.id, from_stage: 'VENDOR', to_stage: 'WH', action: 'Submit', actor_user: profile.id, remarks: payload.remarks || null }], token)
      setNotice('Invoice submitted to Warehouse.'); setActive('Submitted'); refreshData()
    } catch (err) { setError(err.message || 'Invoice submission failed.') }
    finally { setBusy(false) }
  }

  return <div className="app-shell"><header className="topbar"><div className="brand-mark">GAC</div><div className="portal-title">GAC Bill Payment Portal</div><div className="user-area">{profile.display_name || profile.username} • {ROLE_LABELS[role] || role}<button className="logout" onClick={handleLogout}>Logout</button></div></header>
    <div className="workspace"><aside className="sidebar"><div className="side-label">MENU</div>{nav.map(x => <button key={x} className={`nav-item ${active === x ? 'active' : ''}`} onClick={() => setActive(x)}>{x}</button>)}</aside>
      <main className="content"><div className="toolbar"><input placeholder="Search invoice, vendor, project or location" value={search} onChange={e => setSearch(e.target.value)} /><select value={company} onChange={e => setCompany(e.target.value)}><option>All</option><option>VIL</option><option>VWPL</option></select><select value={type} onChange={e => setType(e.target.value)}><option>All</option>{CONTRACT_TYPES.map(x => <option key={x}>{x}</option>)}</select></div>{busy && <div className="notice">Working…</div>}{notice && <div className="notice">{notice}<button onClick={() => setNotice('')}>×</button></div>}{error && <div className="notice login-error">{error}<button onClick={() => setError('')}>×</button></div>}
        {active === 'Dashboard' ? <Dashboard data={filtered} role={role} onAction={action} /> : active === 'Submit Invoice' ? <SubmitInvoice onSubmit={submit} /> : <InvoiceTable title={active} data={filtered} role={role} onAction={action} />}
      </main></div><footer>All Rights Reserved © 2026 GAC Bill Payment Portal</footer></div>
}

const actionsByRole = { WH: ['Accept', 'Query', 'Return', 'Reject'], GAC_COMPLIANCE: ['Accept', 'Query', 'Return', 'Reject', 'Compliance Checked'], GAC_PO: ['Accept', 'Query', 'Return', 'Reject', 'PO Mapping'], ACCOUNTS: ['Accept', 'Query', 'Return', 'Reject', 'UTR Mapping'], CBO_OFFICE: ['Accept', 'Query', 'Return', 'Reject'], CBO_OFFICER: ['Approve', 'Query', 'Return', 'Reject'] }

function Dashboard({ data, role, onAction }) {
  const count = s => data.filter(x => x.current_status === s).length
  return <><section className="hero-panel"><div><span className="eyebrow">P2V2 WORKFLOW</span><h1>Invoice & Bill Payment Dashboard</h1><p>Live Supabase invoice status, workflow actions and payment visibility.</p></div><div className="stage-chip">Live data</div></section><div className="cards"><Metric label="Submitted" value={count(WORKFLOW_STATUS.SUBMITTED)} /><Metric label="Pending" value={count(WORKFLOW_STATUS.PENDING)} /><Metric label="Approved for Payment" value={count(WORKFLOW_STATUS.APPROVED_FOR_PAYMENT)} /><Metric label="Paid" value={count(WORKFLOW_STATUS.PAID)} /><Metric label="Query / Returned / Rejected" value={data.filter(x => [WORKFLOW_STATUS.QUERY, WORKFLOW_STATUS.RETURNED, WORKFLOW_STATUS.REJECTED].includes(x.current_status)).length} /><Metric label="TAT" value="Live" /></div><InvoiceTable data={data} role={role} onAction={onAction} /></>
}
function Metric({ label, value }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small>View details →</small></div> }

function InvoiceTable({ data, role, onAction, title = 'Current Invoice Status' }) {
  const actions = actionsByRole[role] || []
  return <section className="panel"><div className="panel-heading"><div><h2>{title}</h2><p>{data.length} record(s) in current view</p></div><button className="secondary">Bulk view</button></div><div className="table-wrap"><table><thead><tr><th>Inv No</th><th>Company</th><th>Project / Location</th><th>Vendor</th><th>Service</th><th>Amount</th><th>Status</th><th>Stage</th><th>Action</th></tr></thead><tbody>{data.map(x => <tr key={x.id}><td><b>{x.inv_no}</b></td><td>{x.company}</td><td>{x.project_location}</td><td>{x.vendor}</td><td>{x.service_type}<br /><small>{x.contract_type}</small></td><td>{money(x.amt_incl_gst)}</td><td><span className="status">{x.current_status}</span></td><td>{stageLabel[x.current_stage] || x.current_stage}</td><td>{actions.length && x.current_stage === roleStage[role] ? <select defaultValue="" onChange={e => e.target.value && onAction(x, e.target.value)}><option value="">Select</option>{actions.map(a => <option key={a}>{a}</option>)}</select> : <button className="link-btn">View</button>}</td></tr>)}</tbody></table>{!data.length && <div className="empty-state">No invoice records found for the current view.</div>}</div></section>
}

function SubmitInvoice({ onSubmit }) {
  const [f, setF] = useState({ company: 'VIL', project_location: '', vendor: '', inv_no: '', taxable_amt: '', amt_incl_gst: '', remarks: '' })
  const [file, setFile] = useState(null)
  const u = (k, v) => setF(x => ({ ...x, [k]: v }))
  const ok = f.company && f.project_location && f.vendor && f.inv_no && f.taxable_amt && f.amt_incl_gst && file
  const submit = async () => {
    await onSubmit({ company: f.company, project_location: f.project_location, vendor: f.vendor, contract_type: 'Others', service_type: 'Other', sub_category: null, inv_no: f.inv_no, taxable_amt: Number(f.taxable_amt), amt_incl_gst: Number(f.amt_incl_gst), remarks: f.remarks, _file: file })
  }
  return <section className="panel form-panel"><h2>Submit Invoice — Others</h2><p>Vendor-initiated Others route. Invoice is mandatory; supporting documents are optional.</p><div className="form-grid"><label>Company<select value={f.company} onChange={e => u('company', e.target.value)}><option>VIL</option><option>VWPL</option></select></label><label>Project & Location<input value={f.project_location} onChange={e => u('project_location', e.target.value)} /></label><label>Vendor<input value={f.vendor} onChange={e => u('vendor', e.target.value)} /></label><label>Inv No<input value={f.inv_no} onChange={e => u('inv_no', e.target.value)} /></label><label>Taxable Amt<input type="number" value={f.taxable_amt} onChange={e => u('taxable_amt', e.target.value)} /></label><label>Amt (Incl GST)<input type="number" value={f.amt_incl_gst} onChange={e => u('amt_incl_gst', e.target.value)} /></label><label>Invoice — mandatory<input type="file" onChange={e => setFile(e.target.files?.[0] || null)} /></label><label>Remarks — optional<textarea value={f.remarks} onChange={e => u('remarks', e.target.value)} /></label></div><div className="form-actions"><button disabled={!ok} onClick={submit}>Upload Invoice & Submit</button></div></section>
}

export default App

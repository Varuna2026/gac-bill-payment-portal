import { useMemo, useState } from 'react'
import { NAVIGATION_BY_ROLE } from './config/navigation'
import { ROLE_LABELS, ROLES } from './config/roles'
import { CONTRACT_TYPES } from './config/workflow'
import './App.css'

const DEMO_DATA = [
  { id: 1, company: 'VIL', project: 'Project A', location: 'Warehouse 01', vendor: 'Demo Vendor', service: 'Manpower', contract: 'Minimum Wages', invNo: 'INV-001', amount: 118000, status: 'Pending', stage: 'Warehouse' },
  { id: 2, company: 'VWPL', project: 'Project B', location: 'Warehouse 02', vendor: 'Demo Vendor 2', service: 'Housekeeping', contract: 'Minimum Wages', invNo: 'INV-002', amount: 88500, status: 'Submitted', stage: 'GAC — Compliance' },
  { id: 3, company: 'VIL', project: 'Project C', location: 'Warehouse 03', vendor: 'Demo Vendor 3', service: 'Manpower', contract: 'Commercial', invNo: 'INV-003', amount: 177000, status: 'Approved for Payment', stage: 'Accounts' },
  { id: 4, company: 'VWPL', project: 'Project D', location: 'Warehouse 04', vendor: 'Other Vendor', service: 'Other', contract: 'Others', invNo: 'INV-004', amount: 59000, status: 'Paid', stage: 'Accounts', utr: 'UTR-DEMO-004' },
]

const ACTIONS = { WH: ['Accept', 'Query', 'Return', 'Reject'], GAC_COMPLIANCE: ['Accept', 'Query', 'Return', 'Reject', 'Compliance Checked'], GAC_PO: ['Accept', 'Query', 'Return', 'Reject', 'PO Mapping'], ACCOUNTS: ['Accept', 'Query', 'Return', 'Reject'], CBO_OFFICE: ['Accept', 'Approve', 'Query', 'Return', 'Reject'], CBO_OFFICER: ['Approve', 'Query', 'Return', 'Reject'] }

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

function App() {
  const [role, setRole] = useState(ROLES.WH)
  const [active, setActive] = useState('Dashboard')
  const [search, setSearch] = useState('')
  const [company, setCompany] = useState('All')
  const [type, setType] = useState('All')
  const [data, setData] = useState(DEMO_DATA)
  const [message, setMessage] = useState('')
  const nav = NAVIGATION_BY_ROLE[role]
  const filtered = useMemo(() => data.filter((x) => `${x.invNo} ${x.vendor} ${x.project} ${x.location}`.toLowerCase().includes(search.toLowerCase()) && (company === 'All' || x.company === company) && (type === 'All' || x.contract === type)), [data, search, company, type])
  const count = (status) => data.filter((x) => x.status === status).length
  const actions = ACTIONS[role] || []
  const apply = (id, action) => { const status = action === 'Approve' || action === 'Compliance Checked' ? 'Approved for Payment' : action; setData(data.map((x) => x.id === id ? { ...x, status } : x)); setMessage(`${action} recorded. Exact action time, remarks and TAT belong to workflow history.`) }

  return <div className="app-shell">
    <header className="topbar"><div className="brand-mark">GAC</div><div className="portal-title">GAC Bill Payment Portal</div><div className="user-area">Demo User • {ROLE_LABELS[role]} <button className="logout" onClick={() => setMessage('Logout is ready for Supabase Auth integration.')}>Logout</button></div></header>
    <div className="workspace">
      <aside className="sidebar"><div className="side-label">MENU</div>{nav.map((item) => <button key={item} className={`nav-item ${active === item ? 'active' : ''}`} onClick={() => setActive(item)}>{item}</button>)}<div className="role-switcher"><label>Demo role</label><select value={role} onChange={(e) => { setRole(e.target.value); setActive('Dashboard') }}>{Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div></aside>
      <main className="content"><div className="toolbar"><input placeholder="Search invoice, vendor, project or location" value={search} onChange={(e) => setSearch(e.target.value)} /><select value={company} onChange={(e) => setCompany(e.target.value)}><option>All</option><option>VIL</option><option>VWPL</option></select><select value={type} onChange={(e) => setType(e.target.value)}><option>All</option>{CONTRACT_TYPES.map((x) => <option key={x}>{x}</option>)}</select></div>{message && <div className="notice">{message}<button onClick={() => setMessage('')}>×</button></div>}{active === 'Dashboard' ? <><section className="hero-panel"><div><span className="eyebrow">P2V2 WORKFLOW</span><h1>Invoice & Bill Payment Dashboard</h1><p>Track submissions, compliance, approvals and payment status.</p></div><div className="stage-chip">Current stage: <strong>{ROLE_LABELS[role]}</strong></div></section><div className="cards"><Metric label="Submitted" value={data.filter((x) => ['Submitted', 'Pending'].includes(x.status)).length} /><Metric label="Pending" value={count('Pending')} /><Metric label="Approved for Payment" value={count('Approved for Payment')} /><Metric label="Paid" value={count('Paid')} /><Metric label="Query / Returned / Rejected" value={data.filter((x) => ['Query','Return','Reject'].includes(x.status)).length} /><Metric label="TAT" value="Live" /></div><InvoiceTable data={filtered} actions={actions} onAction={apply} /></> : <InvoiceTable data={filtered} actions={actions} onAction={apply} title={active} />}</main>
    </div><footer>All Rights Reserved © 2026 GAC Bill Payment Portal</footer>
  </div>
}

function Metric({ label, value }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small>View details →</small></div> }
function InvoiceTable({ data, actions, onAction, title = 'Current Invoice Status' }) { return <section className="panel"><div className="panel-heading"><div><h2>{title}</h2><p>{data.length} record(s) in current view</p></div><button className="secondary">Bulk view</button></div><div className="table-wrap"><table><thead><tr><th>Inv No</th><th>Company</th><th>Project / Location</th><th>Vendor</th><th>Service</th><th>Amount</th><th>Status</th><th>Stage</th><th>Action</th></tr></thead><tbody>{data.map((x) => <tr key={x.id}><td><b>{x.invNo}</b></td><td>{x.company}</td><td>{x.project}<br/><small>{x.location}</small></td><td>{x.vendor}</td><td>{x.service}<br/><small>{x.contract}</small></td><td>{money(x.amount)}</td><td><span className="status">{x.status}</span>{x.utr && <small className="utr">UTR: {x.utr}</small>}</td><td>{x.stage}</td><td>{actions.length ? <select defaultValue="" onChange={(e) => e.target.value && onAction(x.id, e.target.value)}><option value="">Select</option>{actions.map((a) => <option key={a}>{a}</option>)}</select> : <button className="link-btn">View</button>}</td></tr>)}</tbody></table></div></section> }
export default App

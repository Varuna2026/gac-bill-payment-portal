import { useMemo, useState } from 'react'

const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
const monthOf=x=>String(x?.invoice_month||'').trim()
const monthLabel=m=>{if(!m)return '—';return new Date(`${m}-01T00:00:00`).toLocaleString('en-IN',{month:'short',year:'2-digit'})}
const dateOnly=v=>{if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('en-IN')}
const historyFor=(history,id)=>history.filter(h=>h.invoice_id===id).sort((a,b)=>new Date(a.action_at||0)-new Date(b.action_at||0))

function complianceHistory(history,id){
  const h=historyFor(history,id)
  const compliance=h.filter(x=>x.from_stage==='GAC_COMPLIANCE'||x.actor_user==='GAC-C01'||x.to_stage==='GAC_PO')
  const accepts=compliance.filter(x=>x.from_stage==='GAC_COMPLIANCE'&&x.action==='Accept')
  const outcomes=compliance.filter(x=>x.from_stage==='GAC_COMPLIANCE'&&['Compliance Check OK','Compliance Check Rejected','Query','Return','Reject'].includes(x.action))
  const queries=compliance.filter(x=>x.from_stage==='GAC_COMPLIANCE'&&x.action==='Query')
  const navision=compliance.filter(x=>x.from_stage==='GAC_COMPLIANCE'&&x.to_stage==='GAC_PO'&&x.action==='Submit')
  const lastQuery=queries.at(-1)
  let queryResolved=''
  if(lastQuery){
    const qAt=new Date(lastQuery.action_at||0).getTime()
    const next=h.find(x=>new Date(x.action_at||0).getTime()>qAt&&((x.to_stage==='GAC_COMPLIANCE'&&['Vendor Resubmit','Resubmit to GAC Compliance','Submit'].includes(x.action))||['VENDOR','WH'].includes(x.from_stage)&&x.to_stage==='GAC_COMPLIANCE'))
    queryResolved=next?.action_at||''
  }
  const finalOutcome=outcomes.at(-1)
  let status=finalOutcome?.action||''
  if(status==='Compliance Check OK')status='OK'
  else if(status==='Compliance Check Rejected')status='Rejected'
  else if(status==='Return')status='Returned'
  else if(status==='Reject')status='Rejected'
  else if(status==='Query')status='Query'
  else if(!status&&accepts.length)status='Accepted'
  return {billRec:accepts.at(-1)?.action_at||'',status,query:lastQuery?.remarks||'',queryResolved,navision:navision.at(-1)?.action_at||''}
}

export default function P2Reports({data,role,history=[]}){
  const [f,setF]=useState({month:'All',company:'All',warehouse:'All',project:'All',vendor:'All',service:'All',compliance:'All'})
  const scopeRows=useMemo(()=>data.filter(x=>{
    if(role==='VENDOR'&&x.vendor_scope_allowed===false)return false
    if(role==='WH'&&x.warehouse_scope_allowed===false)return false
    return true
  }),[data,role])
  const enriched=useMemo(()=>scopeRows.map(x=>{
    const ch=complianceHistory(history,x.id)
    return {...x,_compliance:ch}
  }),[scopeRows,history])
  const vals=k=>[...new Set(enriched.map(x=>k==='month'?monthOf(x):k==='compliance'?x._compliance.status:x[k]).filter(Boolean))].sort().reverse()
  const rows=useMemo(()=>enriched.filter(x=>{
    const m=monthOf(x)
    return (f.month==='All'||m===f.month)&&(f.company==='All'||x.company===f.company)&&(f.warehouse==='All'||x.warehouse===f.warehouse)&&(f.project==='All'||x.project_location===f.project)&&(f.vendor==='All'||x.vendor===f.vendor)&&(f.service==='All'||x.service_type===f.service)&&(f.compliance==='All'||x._compliance.status===f.compliance)
  }),[enriched,f])
  const reportRows=rows.map((x,i)=>({
    sl:i+1,month:monthOf(x),company:x.company,warehouse:x.warehouse,project:x.project_location,vendor:x.vendor,service:x.service_type,
    invoice:x.inv_no,taxable:x.taxable_amt??x.taxable_amount??x.amount_before_gst??'',incl:x.amt_incl_gst??x.amount_incl_gst??'',
    billRec:x._compliance.billRec,status:x._compliance.status,query:x._compliance.query,queryResolved:x._compliance.queryResolved,navision:x._compliance.navision
  }))
  const download=()=>{
    const headers=['Sl No','Month','Company','Warehouse','Project','Vendor','Service Type','Invoice No','Taxable Amt','Amt (Incl GST)','Bill Rec @ HO','Compliance Status','Query Details','Query resolved on','H/O for Navision (Date)']
    const body=reportRows.map(r=>[r.sl,monthLabel(r.month),r.company,r.warehouse,r.project,r.vendor,r.service,r.invoice,r.taxable,r.incl,dateOnly(r.billRec),r.status,r.query,dateOnly(r.queryResolved),dateOnly(r.navision)])
    const html=`<html><head><meta charset="utf-8"></head><body><table><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${body.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</table></body></html>`
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'application/vnd.ms-excel'}));a.download='GAC_Vendor_Bill_Payment_Tracker.xls';a.click()
  }
  const select=(label,key,options)=><label>{label}<select value={f[key]} onChange={e=>setF({...f,[key]:e.target.value})}><option value="All">All</option>{options.map(v=><option key={v} value={v}>{key==='month'?monthLabel(v):v}</option>)}</select></label>
  return <section className="panel"><div className="panel-heading"><div><h2>Reports</h2><p>Generate, view and download the applicable invoice report • {role==='VENDOR'||role==='WH'?'restricted to your mapped Vendor ↔ Warehouse scope':'all accessible invoices'}</p></div><button className="primary" onClick={download}>GAC Vendor Bill Payment Tracker</button></div><div className="report-filters">{select('Month','month',vals('month'))}{select('Company','company',vals('company'))}{select('Warehouse','warehouse',vals('warehouse'))}{select('Project','project',vals('project'))}{select('Vendor','vendor',vals('vendor'))}{select('Service Type','service',vals('service_type'))}{select('Compliance Status','compliance',vals('compliance'))}</div><div className="report-summary"><div><b>Month</b><span>{f.month==='All'?'All':monthLabel(f.month)}</span></div><div><b>Records</b><span>{rows.length}</span></div></div><div className="table-wrap"><table><thead><tr><th>Sl No</th><th>Month</th><th>Company</th><th>Warehouse</th><th>Project</th><th>Vendor</th><th>Service Type</th><th>Invoice No</th><th>Taxable Amt</th><th>Amt (Incl GST)</th><th>Bill Rec @ HO</th><th>Compliance Status</th><th>Query Details</th><th>Query resolved on</th><th>H/O for Navision (Date)</th></tr></thead><tbody>{reportRows.map(r=><tr key={`${r.invoice}-${r.sl}`}><td>{r.sl}</td><td>{monthLabel(r.month)}</td><td>{r.company||'—'}</td><td>{r.warehouse||'—'}</td><td>{r.project||'—'}</td><td>{r.vendor||'—'}</td><td>{r.service||'—'}</td><td>{r.invoice||'—'}</td><td>{r.taxable||'—'}</td><td>{r.incl||'—'}</td><td>{dateOnly(r.billRec)||'—'}</td><td>{r.status||'—'}</td><td>{r.query||'—'}</td><td>{dateOnly(r.queryResolved)||'—'}</td><td>{dateOnly(r.navision)||'—'}</td></tr>)}</tbody></table>{!rows.length&&<div className="empty-state">No report records match the selected filters.</div>}</div></section>
}

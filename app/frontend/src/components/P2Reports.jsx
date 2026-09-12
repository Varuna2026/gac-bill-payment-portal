import { useMemo, useState } from 'react'
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
const monthOf=x=>x.invoice_month||''
const monthLabel=m=>{if(!m)return '—';return new Date(`${m}-01T00:00:00`).toLocaleString('en-IN',{month:'short',year:'2-digit'})}
const dateOnly=v=>v?new Date(v).toLocaleDateString('en-IN'):''
export default function P2Reports({data,role}){
  const latestInvoiceMonth=useMemo(()=>[...new Set(data.map(monthOf).filter(Boolean))].sort().reverse()[0]||'',[data])
  const [f,setF]=useState({month:'AUTO',company:'All',warehouse:'All',project:'All',vendor:'All',service:'All',compliance:'All'})
  const vals=k=>[...new Set(data.map(x=>k==='month'?monthOf(x):x[k]).filter(Boolean))].sort().reverse()
  const selectedMonth=f.month==='AUTO'?latestInvoiceMonth:f.month
  const scopeRows=useMemo(()=>data.filter(x=>{
    if(role==='VENDOR' && x.vendor_scope_allowed===false)return false
    if(role==='WH' && x.warehouse_scope_allowed===false)return false
    return true
  }),[data,role])
  const rows=useMemo(()=>scopeRows.filter(x=>{
    const m=monthOf(x)
    return (selectedMonth==='All'||m===selectedMonth)&&(f.company==='All'||x.company===f.company)&&(f.warehouse==='All'||x.warehouse===f.warehouse)&&(f.project==='All'||x.project_location===f.project)&&(f.vendor==='All'||x.vendor===f.vendor)&&(f.service==='All'||x.service_type===f.service)&&(f.compliance==='All'||x.compliance_status===f.compliance)
  }),[scopeRows,f,selectedMonth])
  const reportRows=rows.map((x,i)=>({
    sl:i+1,month:monthOf(x),company:x.company,warehouse:x.warehouse,project:x.project_location,vendor:x.vendor,service:x.service_type,
    invoice:x.inv_no,taxable:x.taxable_amt??x.taxable_amount??x.amount_before_gst??'',incl:x.amt_incl_gst??x.amount_incl_gst??'',
    billRec:x.compliance_accept_at??x.compliance_accepted_at??'',status:x.compliance_status??'',query:x.compliance_query??x.query_details??'',
    queryResolved:x.query_resolved_on??x.resubmitted_at??x.vendor_resubmitted_at??x.wh_resubmitted_at??'',navision:x.gac_po_submitted_at??x.compliance_to_po_at??''
  }))
  const download=()=>{const headers=['Sl No','Month','Company','Warehouse','Project','Vendor','Service Type','Invoice No','Taxable Amt','Amt (Incl GST)','Bill Rec @ HO','Compliance Status','Query Details','Query resolved on','H/O for Navision (Date)'];const body=reportRows.map(r=>[r.sl,monthLabel(r.month),r.company,r.warehouse,r.project,r.vendor,r.service,r.invoice,r.taxable,r.incl,dateOnly(r.billRec),r.status,r.query,dateOnly(r.queryResolved),dateOnly(r.navision)]);const html=`<html><head><meta charset="utf-8"></head><body><table><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${body.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</table></body></html>`;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'application/vnd.ms-excel'}));a.download='GAC_Bill_Payment_Report.xls';a.click()}
  const select=(label,key,options)=><label>{label}<select value={key==='month'?(f.month==='AUTO'?latestInvoiceMonth||'All':f.month):f[key]} onChange={e=>setF({...f,[key]:e.target.value})}>{key==='month'&&<option value="All">All</option>}{key!=='month'&&<option>All</option>}{options.map(v=><option key={v} value={v}>{key==='month'?monthLabel(v):v}</option>)}</select></label>
  return <section className="panel"><div className="panel-heading"><div><h2>Reports</h2><p>Generate, view and download the applicable invoice report • {role==='VENDOR'||role==='WH'?'restricted to your mapped Vendor ↔ Warehouse scope':'all accessible invoices'}</p></div><button className="primary" onClick={download}>Generate / View / Download</button></div><div className="report-filters">{select('Month','month',vals('month'))}{select('Company','company',vals('company'))}{select('Warehouse','warehouse',vals('warehouse'))}{select('Project','project',vals('project'))}{select('Vendor','vendor',vals('vendor'))}{select('Service Type','service',vals('service_type'))}{select('Compliance Status','compliance',vals('compliance_status'))}</div><div className="report-summary"><div><b>Month</b><span>{selectedMonth?monthLabel(selectedMonth):'All'}</span></div><div><b>Records</b><span>{rows.length}</span></div></div><div className="table-wrap"><table><thead><tr><th>Sl No</th><th>Month</th><th>Company</th><th>Warehouse</th><th>Project</th><th>Vendor</th><th>Service Type</th><th>Invoice No</th><th>Taxable Amt</th><th>Amt (Incl GST)</th><th>Bill Rec @ HO</th><th>Compliance Status</th><th>Query Details</th><th>Query resolved on</th><th>H/O for Navision (Date)</th></tr></thead><tbody>{reportRows.map(r=><tr key={`${r.invoice}-${r.sl}`}><td>{r.sl}</td><td>{monthLabel(r.month)}</td><td>{r.company||'—'}</td><td>{r.warehouse||'—'}</td><td>{r.project||'—'}</td><td>{r.vendor||'—'}</td><td>{r.service||'—'}</td><td>{r.invoice||'—'}</td><td>{r.taxable||'—'}</td><td>{r.incl||'—'}</td><td>{dateOnly(r.billRec)||'—'}</td><td>{r.status||'—'}</td><td>{r.query||'—'}</td><td>{dateOnly(r.queryResolved)||'—'}</td><td>{dateOnly(r.navision)||'—'}</td></tr>)}</tbody></table>{!rows.length&&<div className="empty-state">No report records match the selected filters.</div>}</div></section>
}

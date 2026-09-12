import { useMemo, useState } from 'react'
import { P2_SUB_SERVICES } from '../data/p2Seed'
import { insertRows, uploadStorage } from '../services/supabaseRest'

export default function WHUpload({ profile, mapping, token, onDone }) {
  const [company, setCompany] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [project, setProject] = useState('')
  const [vendor, setVendor] = useState('')
  const [contract, setContract] = useState('')
  const [service, setService] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [files, setFiles] = useState([])
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const companies = useMemo(() => [...new Set(mapping.map(x => x.organization).filter(Boolean))], [mapping])
  const warehouses = useMemo(() => [...new Set(mapping.filter(x => x.organization === company).map(x => x.warehouse).filter(Boolean))], [mapping, company])
  const projects = useMemo(() => [...new Set(mapping.filter(x => x.organization === company && x.warehouse === warehouse).map(x => x.project_location).filter(Boolean))], [mapping, company, warehouse])
  const vendors = useMemo(() => [...new Set(mapping.filter(x => x.organization === company && x.warehouse === warehouse && x.project_location === project).map(x => x.vendor).filter(Boolean))], [mapping, company, warehouse, project])
  const services = useMemo(() => [...new Set(mapping.filter(x => x.organization === company && x.warehouse === warehouse && x.project_location === project && x.vendor === vendor).map(x => x.service_type).filter(Boolean))], [mapping, company, warehouse, project, vendor])
  const contracts = service === 'HK' || service === 'Security' ? ['Minimum Wages'] : service === 'Manpower' ? ['Commercial', 'Minimum Wages'] : service === 'Machine' ? ['Commercial'] : []
  const subCategories = P2_SUB_SERVICES[service] || []

  const resetAfterCompany = value => { setCompany(value); setWarehouse(''); setProject(''); setVendor(''); setContract(''); setService(''); setSubCategory(''); setMessage('') }
  const resetAfterWarehouse = value => { setWarehouse(value); setProject(''); setVendor(''); setContract(''); setService(''); setSubCategory(''); setMessage('') }
  const resetAfterProject = value => { setProject(value); setVendor(''); setContract(''); setService(''); setSubCategory(''); setMessage('') }
  const resetAfterVendor = value => { setVendor(value); setContract(''); setService(''); setSubCategory(''); setMessage('') }
  const resetAfterContract = value => { setContract(value); setService(''); setSubCategory(''); setMessage('') }
  const resetAfterService = value => { setService(value); setSubCategory(''); setMessage('') }

  const submit = async () => {
    if (!company || !warehouse || !project || !vendor || !contract || !service || !subCategory || !files.length || !remarks.trim()) {
      setMessage('Complete all mapped selections, upload document(s), and enter Remarks before Submit.')
      return
    }
    try {
      setBusy(true)
      setMessage('')
      const now = new Date().toISOString()
      const req = (await insertRows('bill_requests', [{
        organization: company,
        company,
        warehouse,
        project_location: project,
        vendor,
        contract_type: contract,
        service_type: service,
        sub_service: subCategory,
        remarks: remarks.trim(),
        status: 'PENDING_VENDOR',
        created_at: now,
        created_by: profile.id,
      }], token))[0]
      for (const file of files) {
        const stored = await uploadStorage(`requests/${req.id}/${file.name}`, file)
        await insertRows('document_records', [{
          request_id: req.id,
          document_type: 'WH Operational Document',
          document_name: file.name,
          storage_path: stored.path,
          source: 'browser document storage',
          uploaded_by: profile.id,
        }], token)
      }
      setMessage('Submitted to Vendor.')
      setCompany(''); setWarehouse(''); setProject(''); setVendor(''); setContract(''); setService(''); setSubCategory(''); setFiles([]); setRemarks('')
      onDone?.()
    } catch (e) {
      setMessage(e.message || 'Unable to submit Warehouse documents.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="panel form-panel">
    <h2>Warehouse — Upload Docs</h2>
    <div className="table-wrap">
      <table className="p2-horizontal-table">
        <thead><tr><th>Upload Docs</th><th>Company</th><th>Warehouse</th><th>Project / Location</th><th>Vendor</th><th>Contract Type</th><th>Service Type</th><th>Sub-category</th></tr></thead>
        <tbody><tr>
          <td><input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.csv" onChange={e => setFiles(Array.from(e.target.files || []))} /></td>
          <td><select value={company} onChange={e => resetAfterCompany(e.target.value)}><option value="">Select Company</option>{companies.map(v => <option key={v}>{v}</option>)}</select></td>
          <td><select value={warehouse} disabled={!company} onChange={e => resetAfterWarehouse(e.target.value)}><option value="">Select Warehouse</option>{warehouses.map(v => <option key={v}>{v}</option>)}</select></td>
          <td><select value={project} disabled={!warehouse} onChange={e => resetAfterProject(e.target.value)}><option value="">Select Project / Location</option>{projects.map(v => <option key={v}>{v}</option>)}</select></td>
          <td><select value={vendor} disabled={!project} onChange={e => resetAfterVendor(e.target.value)}><option value="">Select Vendor</option>{vendors.map(v => <option key={v}>{v}</option>)}</select></td>
          <td><select value={contract} disabled={!vendor} onChange={e => resetAfterContract(e.target.value)}><option value="">Select Contract Type</option>{contracts.map(v => <option key={v}>{v}</option>)}</select></td>
          <td><select value={service} disabled={!contract} onChange={e => resetAfterService(e.target.value)}><option value="">Select Service Type</option>{services.map(v => <option key={v}>{v}</option>)}</select></td>
          <td><select value={subCategory} disabled={!service} onChange={e => { setSubCategory(e.target.value); setMessage('') }}><option value="">Select Sub-category</option>{subCategories.map(v => <option key={v}>{v}</option>)}</select></td>
        </tr></tbody>
      </table>
    </div>
    <div className="selected-docs"><b>Selected Documents:</b> {files.length ? files.map(f => f.name).join(', ') : 'None'}</div>
    <label>Remarks<textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Enter remarks" /></label>
    <button className="primary" disabled={busy || !files.length || !company || !warehouse || !project || !vendor || !contract || !service || !subCategory || !remarks.trim()} onClick={submit}>{busy ? 'Submitting…' : 'Submit to Vendor'}</button>
    {message && <div className="notice">{message}</div>}
  </section>
}

import { calculateTat, getStageTimestamps } from './services/tat'

const API = import.meta.env.VITE_API_BASE_URL || '/api'
const stageNames = { VENDOR:'Vendor', WH:'Warehouse', GAC_COMPLIANCE:'GAC — Compliance', GAC_PO:'GAC — PO', ACCOUNTS:'Accounts', CBO_OFFICE:'CBO Office', CBO_OFFICER:'CBO Officer' }
const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))

async function get(path) { const r = await fetch(`${API}${path}`); if (!r.ok) throw new Error(`TAT API ${r.status}`); return r.json() }
function currentTat(invoice, history) {
  const { currentStart } = getStageTimestamps(invoice, history)
  return calculateTat({ startedAt: invoice.created_at, endedAt: invoice.current_status === 'PAID' ? invoice.last_action_at : null, stageStartedAt: currentStart })
}
function ensureStyle() {
  if (document.getElementById('p2-tat-style')) return
  const s = document.createElement('style'); s.id='p2-tat-style'; s.textContent = `
    #p2-tat-panel{position:fixed;right:18px;bottom:18px;z-index:9999;width:min(460px,calc(100vw - 36px));max-height:55vh;overflow:auto;background:#fff;border:1px solid #d7dde8;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.16);font:13px/1.4 Arial,sans-serif;color:#172033}
    #p2-tat-panel .tat-head{padding:12px 14px;background:#0b2346;color:#fff;border-radius:12px 12px 0 0;font-weight:700}
    #p2-tat-panel .tat-sub{font-weight:400;font-size:11px;opacity:.8;margin-top:2px}
    #p2-tat-panel .tat-row{padding:11px 14px;border-bottom:1px solid #edf0f5}.tat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:7px}.tat-box{background:#f6f8fb;padding:7px;border-radius:7px}.tat-label{font-size:10px;color:#647084;text-transform:uppercase}.tat-value{font-weight:700}.tat-special{font-size:10px;color:#647084;margin-top:5px}.tat-stage{font-weight:700}.tat-error{padding:10px 14px;color:#a32121}
    .p2-tat-cell{font-size:11px;line-height:1.35}.p2-tat-cell b{font-size:12px}.p2-tat-cell small{color:#647084}
  `; document.head.appendChild(s)
}
function render(invoices, history) {
  ensureStyle(); let panel=document.getElementById('p2-tat-panel')
  if(!panel){ panel=document.createElement('div'); panel.id='p2-tat-panel'; document.body.appendChild(panel) }
  const rows=invoices.slice(0,20).map(i=>{const t=currentTat(i,history); const sunday=t.cumulative.sundays.length; const nh=t.cumulative.nationalHolidays.length; return `<div class="tat-row"><div><b>${esc(i.inv_no)}</b> — ${esc(i.vendor||'')}</div><div class="tat-stage">Individual: ${esc(stageNames[i.current_stage]||i.current_stage)} — ${t.individual.duration} (${t.individual.calendarDays} calendar day${t.individual.calendarDays===1?'':'s'})</div><div class="tat-grid"><div class="tat-box"><div class="tat-label">Cumulative TAT</div><div class="tat-value">${t.cumulative.duration}</div></div><div class="tat-box"><div class="tat-label">Individual TAT</div><div class="tat-value">${t.individual.duration}</div></div></div><div class="tat-special">${sunday?`${sunday} Sunday${sunday===1?'':'s'} — ${t.cumulative.sundays.join(', ')}`:'Sunday Count: 0'} · ${nh?`${nh} NH — ${t.cumulative.nationalHolidays.map(x=>x.date).join(', ')}`:'NH Count: 0'}</div></div>`}).join('')
  panel.innerHTML=`<div class="tat-head">P2 TAT — Universal View<div class="tat-sub">Individual = current user/stage · Cumulative = invoice start → current/final stage</div></div>${rows||'<div class="tat-error">No invoice records in the current view.</div>'}`
}
async function refresh(){ try { const [invoices,history]=await Promise.all([get('/tables/invoice_records?order=created_at.desc'),get('/tables/workflow_history')]); render(invoices,history) } catch(e){ ensureStyle(); let p=document.getElementById('p2-tat-panel'); if(!p){p=document.createElement('div');p.id='p2-tat-panel';document.body.appendChild(p)} p.innerHTML=`<div class="tat-head">P2 TAT — Universal View</div><div class="tat-error">TAT service is not reachable yet. The panel will retry automatically.</div>` } }
refresh(); setInterval(refresh,15000)

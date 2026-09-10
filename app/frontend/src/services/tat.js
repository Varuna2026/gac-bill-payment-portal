export const P2_NATIONAL_HOLIDAYS = {
  '2026-01-26': 'Republic Day',
  '2026-08-15': 'Independence Day',
  '2026-10-02': 'Mahatma Gandhi Birthday',
}

const DAY = 86400000
const pad = n => String(n).padStart(2, '0')

export function formatDuration(ms = 0) {
  const safe = Math.max(0, Number(ms) || 0)
  const totalMinutes = Math.floor(safe / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  return `${days}d ${pad(hours)}h ${pad(minutes)}m`
}

export function calendarDayCount(start, end = new Date()) {
  const a = new Date(start); const b = new Date(end)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.max(0, Math.floor((db - da) / DAY))
}

export function specialDays(start, end = new Date()) {
  const a = new Date(start); const b = new Date(end)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return { sundays: [], nationalHolidays: [] }
  const sundays = []; const nationalHolidays = []
  for (let d = new Date(a.getFullYear(), a.getMonth(), a.getDate()); d <= new Date(b.getFullYear(), b.getMonth(), b.getDate()); d.setDate(d.getDate() + 1)) {
    const iso = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    const label = P2_NATIONAL_HOLIDAYS[iso]
    if (d.getDay() === 0) sundays.push(iso)
    if (label) nationalHolidays.push({ date: iso, name: label })
  }
  return { sundays, nationalHolidays }
}

export function calculateTat({ startedAt, endedAt = null, stageStartedAt = null, stageEndedAt = null }) {
  const end = endedAt ? new Date(endedAt) : new Date()
  const start = new Date(startedAt)
  const individualStart = new Date(stageStartedAt || startedAt)
  const individualEnd = stageEndedAt ? new Date(stageEndedAt) : end
  const cumulativeMs = Math.max(0, end - start)
  const individualMs = Math.max(0, individualEnd - individualStart)
  const cumulativeSpecial = specialDays(start, end)
  const individualSpecial = specialDays(individualStart, individualEnd)
  return {
    cumulative: { calendarDays: calendarDayCount(start, end), duration: formatDuration(cumulativeMs), ...cumulativeSpecial },
    individual: { calendarDays: calendarDayCount(individualStart, individualEnd), duration: formatDuration(individualMs), ...individualSpecial },
  }
}

export function getStageTimestamps(invoice, history = []) {
  const events = history.filter(x => x.invoice_id === invoice.id && x.action_at).sort((a,b) => new Date(a.action_at) - new Date(b.action_at))
  const currentStage = invoice.current_stage
  let currentStart = invoice.created_at
  const completed = {}
  for (const e of events) {
    const entered = e.to_stage
    if (entered === currentStage) currentStart = e.action_at
    if (e.from_stage && e.to_stage && e.from_stage !== e.to_stage) {
      const previousStart = completed[e.from_stage]?.start || invoice.created_at
      completed[e.from_stage] = { start: previousStart, end: e.action_at }
    }
    if (entered && !completed[entered]) completed[entered] = { start: e.action_at, end: null }
  }
  return { currentStart, completed }
}

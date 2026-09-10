import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(ROOT, 'server-data')
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads')
const PORT = Number(process.env.PORT || 4000)
const TABLES = ['vendors','warehouses','vendor_warehouse_map','invoice_records','workflow_history','pr_po_utr','document_records']

await fs.mkdir(UPLOAD_DIR, { recursive: true })

async function tablePath(table) { return path.join(DATA_DIR, `${table}.json`) }
async function readTable(table) {
  if (!TABLES.includes(table)) throw new Error('Invalid table')
  try { return JSON.parse(await fs.readFile(await tablePath(table), 'utf8')) } catch (e) {
    if (e.code !== 'ENOENT') throw e
    await writeTable(table, [])
    return []
  }
}
async function writeTable(table, rows) { await fs.writeFile(await tablePath(table), JSON.stringify(rows, null, 2) + '\n', 'utf8') }
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS', ...headers })
  res.end(JSON.stringify(body))
}
async function body(req) { let raw = ''; for await (const chunk of req) raw += chunk; return raw ? JSON.parse(raw) : {} }
function filters(url) { return [...url.searchParams.entries()].filter(([k,v]) => k !== 'order').map(([k,v]) => ({ field:k, value:v.startsWith('eq.') ? decodeURIComponent(v.slice(3)) : null })).filter(x => x.value !== null) }
function matches(row, fs) { return fs.every(f => String(row[f.field] ?? '') === f.value) }

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {})
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    if (url.pathname === '/api/health') return send(res, 200, { ok:true, service:'p2-backend', storage:'own-server' })
    if (url.pathname.startsWith('/api/tables/')) {
      const table = url.pathname.split('/')[3]
      if (!TABLES.includes(table)) return send(res, 404, { error:'Unknown table' })
      const fs = filters(url)
      let rows = await readTable(table)
      if (fs.length) rows = rows.filter(r => matches(r, fs))
      if (url.searchParams.get('order') === 'created_at.desc') rows.sort((a,b) => String(b.created_at||'').localeCompare(String(a.created_at||'')))
      if (req.method === 'GET') return send(res, 200, rows)
      if (req.method === 'POST') {
        const input = await body(req); const items = Array.isArray(input) ? input : [input]
        const inserted = items.map(x => ({ id:x.id || randomUUID(), created_at:x.created_at || new Date().toISOString(), ...x }))
        await writeTable(table, [...(await readTable(table)), ...inserted]); return send(res, 201, inserted)
      }
      if (req.method === 'PATCH') {
        const values = await body(req); const all = await readTable(table); const changed = all.map(r => matches(r, fs) ? {...r,...values,last_action_at:new Date().toISOString()} : r); await writeTable(table, changed); return send(res, 200, changed.filter(r => matches(r, fs)))
      }
      if (req.method === 'DELETE') { const all = await readTable(table); await writeTable(table, all.filter(r => !matches(r, fs))); return send(res, 200, []) }
    }
    if (url.pathname === '/api/uploads' && req.method === 'POST') {
      const input = await body(req)
      if (!input.name || !input.dataUrl) return send(res, 400, {error:'name and dataUrl are required'})
      const safe = path.basename(input.name).replace(/[^a-zA-Z0-9._-]/g, '_')
      const fileName = `${Date.now()}-${randomUUID()}-${safe}`
      const target = path.join(UPLOAD_DIR, fileName)
      const base64 = String(input.dataUrl).replace(/^data:[^;]+;base64,/, '')
      await fs.writeFile(target, Buffer.from(base64, 'base64'))
      return send(res, 201, { path:`uploads/${fileName}`, name:input.name, size:(await fs.stat(target)).size, type:input.type || 'application/octet-stream' })
    }
    return send(res, 404, {error:'Not found'})
  } catch (e) { console.error(e); return send(res, 500, {error:e.message || 'Server error'}) }
})
server.listen(PORT, () => console.log(`P2 backend listening on :${PORT}`))

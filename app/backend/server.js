import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = path.join(ROOT, 'uploads')
const PORT = Number(process.env.PORT || 4000)

await fs.mkdir(UPLOAD_DIR, { recursive: true })

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  })
  res.end(JSON.stringify(body))
}

async function readJsonBody(req) {
  let raw = ''
  for await (const chunk of req) raw += chunk
  return raw ? JSON.parse(raw) : {}
}

async function saveDataUrl({ name, dataUrl }) {
  if (!name || !dataUrl) throw new Error('name and dataUrl are required')

  const safeName = path.basename(String(name)).replace(/[^a-zA-Z0-9._-]/g, '_')
  const fileName = `${Date.now()}-${randomUUID()}-${safeName}`
  const target = path.join(UPLOAD_DIR, fileName)
  const base64 = String(dataUrl).replace(/^data:[^;]+;base64,/, '')

  await fs.writeFile(target, Buffer.from(base64, 'base64'))
  const stat = await fs.stat(target)

  return {
    path: `uploads/${fileName}`,
    name: name,
    size: stat.size,
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {})

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

    // This server is ONLY for P2 document storage. It does not store
    // vendors, warehouses, mappings, invoices, workflow history, PR/PO/UTR,
    // users, or any other application database records.
    if (url.pathname === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, service: 'p2-document-storage', storage: 'own-server-documents-only' })
    }

    if (url.pathname === '/api/uploads' && req.method === 'POST') {
      const input = await readJsonBody(req)
      const result = await saveDataUrl(input)
      return sendJson(res, 201, result)
    }

    if (url.pathname.startsWith('/uploads/') && req.method === 'GET') {
      const requested = path.basename(url.pathname.slice('/uploads/'.length))
      if (!requested) return sendJson(res, 400, { error: 'File name required' })
      const filePath = path.join(UPLOAD_DIR, requested)
      const file = await fs.readFile(filePath)
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      })
      return res.end(file)
    }

    return sendJson(res, 404, { error: 'Not found' })
  } catch (error) {
    console.error(error)
    const status = error?.code === 'ENOENT' ? 404 : 500
    return sendJson(res, status, { error: error?.code === 'ENOENT' ? 'Document not found' : (error?.message || 'Server error') })
  }
})

server.listen(PORT, () => console.log(`P2 document storage listening on :${PORT}`))

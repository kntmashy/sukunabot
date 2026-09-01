import { promisify } from 'util'

const sleep = promisify(setTimeout)

const MIN_DELAY = 1200
const MAX_RETRIES = 5
const RETRY_BASE = 4000

const queues = new Map()
const patched = new WeakSet()

function getQueue(jid) {
  if (!queues.has(jid)) queues.set(jid, { items: [], running: false, lastSend: 0 })
  return queues.get(jid)
}

async function processQueue(jid) {
  const q = getQueue(jid)
  if (q.running) return
  q.running = true
  while (q.items.length > 0) {
    const item = q.items[0]
    const wait = Math.max(0, MIN_DELAY - (Date.now() - q.lastSend))
    if (wait > 0) await sleep(wait)
    try {
      const result = await item.fn()
      q.lastSend = Date.now()
      q.items.shift()
      item.resolve(result)
    } catch (e) {
      const isRateLimit = e?.data === 429 || e?.message?.includes('rate-overlimit')
      if (isRateLimit && item.retries < MAX_RETRIES) {
        item.retries++
        const backoff = RETRY_BASE * Math.pow(2, item.retries - 1)
        await sleep(backoff)
      } else {
        q.items.shift()
        item.reject(e)
      }
    }
  }
  q.running = false
  queues.delete(jid)
}

function enqueue(jid, fn) {
  const q = getQueue(jid)
  return new Promise((resolve, reject) => {
    q.items.push({ fn, resolve, reject, retries: 0 })
    processQueue(jid)
  })
}

export function applyRateLimit(conn) {
  if (!conn || patched.has(conn)) return conn
  patched.add(conn)
  const _sendMessage = conn.sendMessage.bind(conn)
  conn.sendMessage = (jid, content, options) =>
    enqueue(jid, () => _sendMessage(jid, content, options))
  return conn
}

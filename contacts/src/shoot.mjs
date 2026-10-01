// Rend chaque <article class="ab"> de artboards.html en JPEG 2×, en clair puis en sombre.
// Usage : node shoot.mjs <dossier de profil Chrome> <port>
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const profile = process.argv[2]
const port = Number(process.argv[3] ?? 9351)
const chrome = spawn(
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--hide-scrollbars', 'about:blank'],
  { stdio: 'ignore' }
)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let target
for (let attempt = 0; attempt < 50 && !target; attempt++) {
  await sleep(200)
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
    target = list.find((entry) => entry.type === 'page')
  } catch {}
}
if (!target) throw new Error('Chrome sans écran ne répond pas')

const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }))
let id = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message)
    pending.delete(message.id)
  }
})
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const callId = ++id
    pending.set(callId, (message) => (message.error ? reject(new Error(message.error.message)) : resolve(message.result)))
    socket.send(JSON.stringify({ id: callId, method, params }))
  })
const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 2, mobile: false })
await send('Page.navigate', { url: pathToFileURL(join(here, 'artboards.html')).href })
await sleep(1500)
await evaluate('document.fonts.ready.then(() => [...document.fonts].filter((f) => f.status === "loaded").length)')
await evaluate('Promise.all([...document.images].map((img) => img.complete ? 1 : new Promise((r) => { img.onload = img.onerror = r; setTimeout(r, 4000) })))')

const report = []
for (const [theme, suffix] of [['light', 'clair'], ['dark', 'sombre']]) {
  await evaluate(`document.documentElement.dataset.theme = ${JSON.stringify(theme)}`)
  await sleep(150)
  const boxes = await evaluate(
    'JSON.stringify([...document.querySelectorAll("article.ab")].map((a) => { const r = a.getBoundingClientRect(); return { id: a.id, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height } }))'
  )
  for (const box of JSON.parse(boxes)) {
    const shot = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 90,
      captureBeyondViewport: true,
      clip: { x: box.x, y: box.y, width: box.w, height: box.h, scale: 1 },
    })
    const file = join(here, '..', 'img', `${box.id}-${suffix}.jpg`)
    writeFileSync(file, Buffer.from(shot.data, 'base64'))
    report.push(`${box.id}-${suffix}`)
  }
}
const fonts = await evaluate('[...document.fonts].filter((f) => f.status === "loaded").map((f) => f.weight).join(",")')
console.log(`${report.length} images ; graisses Inter chargées : ${fonts}`)
socket.close()
chrome.kill()
process.exit(0)

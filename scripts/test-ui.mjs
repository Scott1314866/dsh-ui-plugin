/** Browser contract tests use controlled Host-shaped fixtures, not production demo behavior. */
import { build } from 'esbuild'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
await mkdir('.runtime', { recursive: true })
await mkdir('artifacts/screenshots', { recursive: true })
const root = resolve('.').replaceAll('\\', '/')
const fixture = `
import React,{useSyncExternalStore} from 'react';import{createRoot}from'react-dom/client';
import{EvidencePanel,WorkBar}from'${root}/src/client.tsx';import{BrandMark,BrandName}from'${root}/src/brand.tsx';import{theme}from'${root}/src/theme.ts';import{workState}from'${root}/src/model.ts';
let events={entries:[],hasMore:false,revision:0,change:{kind:'replace',entries:[]}},snapshot={sessionId:'fixture',running:false,openState:'open',removed:false,pendingSubmissions:[],awaitingFirstTurn:false,promptError:null,lastAgentError:null,loadingOlder:false},config={status:'ready',value:{chip:'HPM6200',sdkVersion:'1.13.0'},writable:true};
const listeners=new Set(),subscribe=f=>{listeners.add(f);return()=>listeners.delete(f)},publish=()=>listeners.forEach(f=>f()),eventsSource={subscribe,getSnapshot:()=>events},status=new Map();
const form={subscribe,getSnapshot:()=>config,mutate:async ops=>{window.lastConfigOps=ops;config={...config,value:{...config.value,...Object.fromEntries(ops.map(o=>[o.path[0],o.value]))}};publish();return true}};
window.fixture={set:(entries,changes={})=>{events={...events,entries,revision:events.revision+1};snapshot={...snapshot,...changes};publish()},source:eventsSource,config,form};
const useSession=selector=>selector(useSyncExternalStore(subscribe,()=>snapshot));
function App(){const session=useSession(v=>v),windowData=useSyncExternalStore(subscribe,()=>events);const work=workState(session,windowData.entries);return <div style={{maxWidth:1100,margin:'20px auto',display:'grid',gridTemplateColumns:'220px minmax(0,1fr)',height:'calc(100vh - 40px)',border:'1px solid #dce6f6',borderRadius:24,overflow:'hidden',background:'#fff'}}><aside style={{padding:25,background:'#f7f9fe'}}><BrandMark size={42}/><BrandName/><div style={{marginTop:32}}><WorkBar state={work}/></div><div data-composer-card style={{padding:18,marginTop:30}}><button className="native_primary" aria-label="发送" style={{background:'#002fa7',color:'#fff',border:0}}>↑</button></div></aside><EvidencePanel sessionId="fixture" events={eventsSource} form={form} useSession={useSession} useSessionStatus={selector=>selector(status)} useTabInfo={()=>({tab:{navigation:{revision:0,params:undefined}}})} openLocal={path=>window.openedSource=path} loadOlder={async()=>{}}/></div>}
document.body.classList.add('xien-ui');document.head.append(Object.assign(document.createElement('style'),{textContent:theme}));createRoot(document.getElementById('root')).render(<App/>);
`
await writeFile('.runtime/ui-fixture.tsx', fixture)
await build({
  entryPoints: ['.runtime/ui-fixture.tsx'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  outfile: '.runtime/ui-fixture.js',
  define: { 'process.env.NODE_ENV': '"production"' },
})
const server = createServer(async (req, res) => {
  try {
    res.setHeader(
      'Content-Type',
      req.url === '/fixture.js' ? 'text/javascript' : 'text/html; charset=utf-8',
    )
    res.end(
      req.url === '/fixture.js'
        ? await readFile('.runtime/ui-fixture.js')
        : '<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#f3f6fb;font-family:Helvetica,"Microsoft YaHei",sans-serif}</style><div id="root"></div><script src="/fixture.js"></script></html>',
    )
  } catch {
    res.writeHead(500)
    res.end()
  }
})
await new Promise((done) => server.listen(0, '127.0.0.1', done))
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
})
const page = await browser.newPage({
  viewport: { width: 1400, height: 1000 },
  reducedMotion: 'reduce',
})
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
const event = (seq, type, data) => ({
  type: 'event',
  event: { seq, time: Date.now() + seq, type, data },
})
const source = {
  source_id: 'sdk-1',
  type: 'sdk',
  title: '本地 SDK 例程',
  original_url: 'hpm-source:example',
  version: '1.13.0',
  status: 'read',
  applicability: 'unconfirmed',
  locator: { path: 'samples/drivers/uart/main.c', line_start: 10, line_end: 30 },
  snippet: '可观测 SDK 读取结果',
  open_path: 'samples/drivers/uart/main.c',
}
const entries = [
  event(1, 'turn/start', { turn: 1 }),
  event(2, 'tool/call', {
    turn: 1,
    callId: 'a',
    name: 'hpm_read',
    arguments: { source_id: 'sdk-1' },
  }),
  event(3, 'tool/result', {
    turn: 1,
    message: { toolCallId: 'a', content: [{ type: 'text', text: 'read' }] },
    meta: { sources: [source] },
  }),
  event(4, 'turn/end', { turn: 1, reason: { kind: 'completed' } }),
]
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.waitForSelector('.xien-panel')
  assert.match(await page.locator('.xien-empty').innerText(), /暂无工程证据/)
  await page.evaluate((entries) => window.fixture.set(entries), entries)
  await page.waitForSelector('.xien-source')
  assert.match(await page.locator('.xien-source').innerText(), /1.13.0/)
  await page.locator('.xien-source-foot button').click()
  assert.equal(await page.evaluate(() => window.openedSource), 'samples/drivers/uart/main.c')
  await page.locator('.xien-tabs button').nth(1).click()
  await page.locator('.xien-call summary').click()
  assert.match(await page.locator('.xien-call').innerText(), /sdk-1/)
  await page.locator('.xien-tabs button').nth(2).click()
  await page.getByLabel('默认芯片', { exact: true }).fill('HPM5300')
  await page.getByRole('button', { name: '保存到个人 Host' }).click()
  assert.deepEqual(await page.evaluate(() => window.lastConfigOps), [
    { op: 'set', path: ['chip'], value: 'HPM5300' },
  ])
  assert.equal(await page.locator('input[type=password]').inputValue(), '')
  await page.locator('.xien-tabs button').first().click()
  await page.evaluate(
    (entries) =>
      window.fixture.set(
        [
          ...entries,
          {
            type: 'event',
            event: { seq: 5, time: Date.now(), type: 'turn/start', data: { turn: 2 } },
          },
        ],
        { running: true },
      ),
    entries,
  )
  assert.equal(await page.locator('.xien-source').count(), 0)
  assert.match(await page.locator('.xien-workbar').first().innerText(), /工作中/)
  await page.locator('.xien-turn-picker select').selectOption('1')
  assert.equal(await page.locator('.xien-source').count(), 1)
  const bad = JSON.parse(JSON.stringify(entries))
  bad[2].event.data.meta.sources = [
    {
      ...source,
      source_id: 'bad',
      type: 'kb',
      original_url: 'javascript:alert(1)',
      open_path: undefined,
      locator: {},
    },
  ]
  await page.evaluate((entries) => window.fixture.set(entries, { running: false }), bad)
  assert.equal(await page.locator('.xien-source a').count(), 0)
  assert.equal(
    await page
      .locator('[data-composer-card] button')
      .evaluate((el) => getComputedStyle(el).borderRadius),
    '50%',
  )
  await page.evaluate((entries) => window.fixture.set(entries, { running: false }), entries)
  await page.screenshot({ path: 'artifacts/screenshots/ui-contract.png', fullPage: true })
  await page.setViewportSize({ width: 600, height: 950 })
  await page.locator('.xien-panel').screenshot({ path: 'artifacts/screenshots/evidence-panel.png' })
  assert.deepEqual(errors, [])
  console.log(
    'Browser contracts passed: event updates, round isolation, native file action, trace, Host config writes, URL filtering and circular native submit.',
  )
} finally {
  await browser.close()
  server.closeAllConnections()
  await new Promise((done) => server.close(done))
}

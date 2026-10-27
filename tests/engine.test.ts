import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Engine, htmlText, errorCode } from '../src/engine.ts'
import { selectSdk } from '../src/sdk.ts'

const signal = () => AbortSignal.timeout(10000)
async function sdk() {
  const root = await mkdtemp(join(tmpdir(), 'hpm-sdk-'))
  await mkdir(join(root, 'samples', 'uart'), { recursive: true })
  await writeFile(join(root, 'VERSION'), 'VERSION_MAJOR = 1\nVERSION_MINOR = 13\nPATCHLEVEL = 0\n')
  await writeFile(
    join(root, 'samples', 'uart', 'main.c'),
    '// local example\nvoid setup(void) {\n  uart_init();\n}\n',
  )
  return root
}
test('SDK follows project root, actual version and true lines; survives engine restart', async () => {
  const root = await sdk(),
    project = await mkdtemp(join(tmpdir(), 'hpm-project-'))
  try {
    await writeFile(join(project, '.hpm-knowledge.json'), JSON.stringify({ sdkRoot: root }))
    const config = { sdkRoots: ['missing'], sdkVersion: '1.12.0' }
    const found = await new Engine(config).search(
      { query: 'uart_init', type: 'sdk' },
      project,
      signal(),
    )
    assert.equal(found.sources[0]?.version, '1.13.0')
    assert.equal(found.sources[0]?.applicability, 'conflict')
    const read = await new Engine(config).read(
      { source_id: found.sources[0]!.source_id, line_start: 2, line_end: 4 },
      project,
      signal(),
    )
    assert.match(read.text!, /3:   uart_init/)
    assert.equal(read.sources[0]?.status, 'read')
    assert.ok(read.warnings.some((x) => x.includes('conflict')))
  } finally {
    await rm(root, { recursive: true, force: true })
    await rm(project, { recursive: true, force: true })
  }
})
test('multiple versions are not silently resolved to highest', async () => {
  const a = await sdk(),
    b = await sdk()
  try {
    assert.equal((await selectSdk({ sdkRoots: [a, b] }, undefined)).root, undefined)
  } finally {
    await rm(a, { recursive: true, force: true })
    await rm(b, { recursive: true, force: true })
  }
})
test('cross-version reads retain their own SDK version after a new engine is created', async () => {
  const a = await sdk(),
    b = await sdk()
  try {
    await writeFile(join(b, 'VERSION'), 'VERSION_MAJOR = 1\nVERSION_MINOR = 14\nPATCHLEVEL = 0\n')
    const found = await new Engine({ sdkRoots: [a, b] }).search(
      { query: 'uart_init', type: 'sdk', version: '1.14.0' },
      undefined,
      signal(),
    )
    assert.equal(found.sources[0]?.version, '1.14.0')
    const read = await new Engine({ sdkRoots: [a, b], sdkVersion: '1.13.0' }).read(
      { source_id: found.sources[0]!.source_id },
      undefined,
      signal(),
    )
    assert.equal(read.sources[0]?.version, '1.14.0')
    assert.equal(read.sources[0]?.applicability, 'conflict')
    assert.ok(read.warnings.some((x) => x.includes('conflict')))
  } finally {
    await rm(a, { recursive: true, force: true })
    await rm(b, { recursive: true, force: true })
  }
})
test('network, interface change, busy, denied and timeout failures stay distinguishable', () => {
  assert.equal(errorCode(new TypeError('fetch failed')), 'network_error')
  assert.equal(errorCode(new SyntaxError('Unexpected token')), 'interface_changed')
  assert.equal(errorCode(new Error('team_http_503')), 'busy')
  assert.equal(errorCode(new Error('team_http_403')), 'access_denied')
  assert.equal(errorCode(new DOMException('Request timed out', 'TimeoutError')), 'timeout')
})
test('manual-only query never goes to public network on missing configuration', async () => {
  let calls = 0
  const network: typeof fetch = async () => {
    calls++
    throw new Error('must not be called')
  }
  const out = await new Engine({}, undefined, network).search(
    { query: 'private board issue', type: 'manual' },
    undefined,
    signal(),
  )
  assert.equal(calls, 0)
  assert.equal(out.status, 'unavailable')
  assert.match(out.warnings.join(' '), /not_configured/)
})
test('KB searches are discovery only; original read and offline cache keep fetch provenance', async () => {
  const cache = await mkdtemp(join(tmpdir(), 'hpm-cache-'))
  let offline = false
  const network: typeof fetch = async (input) => {
    if (offline) throw new Error('offline')
    if (String(input).includes('wp-json'))
      return Response.json([
        {
          link: 'https://kb.hpmicro.com/article',
          title: { rendered: 'ADC' },
          excerpt: { rendered: '<p>clue</p>' },
        },
      ])
    return new Response('<article><p>ADC maximum 3.3 V at 25 C</p></article>', {
      headers: { 'Content-Type': 'text/html' },
    })
  }
  try {
    const engine = new Engine({ cacheDirectory: cache }, undefined, network)
    const found = await engine.search({ query: 'ADC', type: 'kb' }, undefined, signal())
    assert.equal(found.sources[0]?.status, 'search_hit')
    const read = await engine.read(
      { source_id: found.sources[0]!.source_id, limit: 8 },
      undefined,
      signal(),
    )
    assert.equal(read.sources[0]?.status, 'read')
    assert.equal(read.truncated, true)
    offline = true
    const later = await new Engine({ cacheDirectory: cache }, undefined, network).read(
      { source_id: found.sources[0]!.source_id },
      undefined,
      signal(),
    )
    assert.equal(later.cache_hits, 1)
    assert.equal(later.sources[0]?.fetched_at, read.sources[0]?.fetched_at)
    assert.match(later.text!, /3.3 V at 25 C/)
  } finally {
    await rm(cache, { recursive: true, force: true })
  }
})
test('manual service denies credentials without leaking token into result', async () => {
  const network: typeof fetch = async (_url, init) => {
    assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer secret')
    return new Response('', { status: 403 })
  }
  const out = await new Engine(
    { teamUrl: 'http://127.0.0.1:8765', teamToken: 'secret' },
    undefined,
    network,
  ).search({ query: 'ADC', type: 'manual' }, undefined, signal())
  assert.equal(out.status, 'unavailable')
  assert.match(out.warnings.join(' '), /access_denied/)
  assert.ok(!JSON.stringify(out).includes('secret'))
})
test('merged pagination retains candidates beyond first batch from every adapter', async () => {
  const cache = await mkdtemp(join(tmpdir(), 'hpm-merge-'))
  const network: typeof fetch = async (input, init) => {
    if (String(input).includes('wp-json'))
      return Response.json(
        Array.from({ length: 27 }, (_, i) => ({
          link: `https://kb.hpmicro.com/article-${i}`,
          title: { rendered: `Article ${i}` },
          excerpt: { rendered: 'ADC' },
        })),
      )
    const body = JSON.parse(String(init?.body)),
      all = Array.from({ length: 26 }, (_, i) => ({
        source_id: `manual-${i}`,
        original_url: `/v1/sources/manual-${i}/file`,
        type: 'manual',
        title: `Manual ${i}`,
        version: '1.0',
        status: 'search_hit',
        locator: { page: 1 },
      }))
    return Response.json({
      sources: all.slice(body.offset, body.offset + body.limit),
      has_more: body.offset + body.limit < all.length,
    })
  }
  try {
    const engine = new Engine(
      { cacheDirectory: cache, teamUrl: 'http://127.0.0.1', teamToken: 'secret' },
      undefined,
      network,
    )
    const found = []
    let offset = 0
    for (let i = 0; i < 5; i++) {
      const batch = await engine.search(
        { query: 'ADC', type: 'all', offset, limit: 20 },
        undefined,
        signal(),
      )
      found.push(...batch.sources.map((x) => x.source_id))
      if (!batch.has_more) break
      offset = batch.next_offset!
    }
    assert.equal(found.length, 53)
    assert.equal(new Set(found).size, 53)
  } finally {
    await rm(cache, { recursive: true, force: true })
  }
})
test('original HTML excludes active/hidden navigation and preserves table units and numeric entities', () => {
  const text = htmlText(
    '<html><body><nav>menu</nav><article><div class="entry-content"><p>Condition: 25 &#176;C</p><table><tr><th>Max (V)</th></tr><tr><td>3.3</td></tr></table><p hidden>hidden fact</p><script>execute()</script></div></article></body></html>',
  )
  assert.match(text, /25 °C/)
  assert.match(text, /Max \(V\) \|/)
  assert.ok(!text.includes('hidden fact'))
  assert.ok(!text.includes('execute()'))
  assert.ok(!text.includes('menu'))
})
test('SDK remains searchable without ripgrep', async () => {
  const root = await sdk(),
    prior = process.env.HPM_DISABLE_RG
  try {
    process.env.HPM_DISABLE_RG = '1'
    const out = await new Engine({ sdkRoots: [root] }).search(
      { query: 'uart_init', type: 'sdk' },
      undefined,
      signal(),
    )
    assert.equal(out.status, 'ok')
    assert.ok(out.sources.some((s) => s.title.endsWith('main.c')))
  } finally {
    if (prior === undefined) delete process.env.HPM_DISABLE_RG
    else process.env.HPM_DISABLE_RG = prior
    await rm(root, { recursive: true, force: true })
  }
})

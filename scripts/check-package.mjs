import { readFile, mkdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { satisfies } from 'semver'
const manifest = JSON.parse(await readFile('package.json', 'utf8'))
assert.equal(manifest.name, '@xien/dsh-ui-plugin')
const supportedVersions = ['0.2.1-rc.2', '0.2.1-rc.3']
for (const version of supportedVersions) {
  assert.ok(satisfies(version, manifest.engines.dsh), `DSH ${version} must be supported`)
  for (const [name, range] of Object.entries(manifest.peerDependencies)) {
    if (name.startsWith('@deepseek-ai/dsh-')) {
      assert.ok(satisfies(version, range), `${name} must accept DSH ${version}`)
    }
  }
}
assert.ok(!satisfies('0.2.1-rc.1', manifest.engines.dsh))
assert.ok(!satisfies('0.2.2-rc.1', manifest.engines.dsh))
const client = await readFile('lib/client.js', 'utf8'),
  host = await readFile('lib/index.js', 'utf8')
assert.match(client, /window\.__ModuleLoader__\.load/)
assert.ok(client.includes(manifest.name))
assert.ok(
  !client.includes('setTimeout(()=>'),
  'production client must not contain the preview status timer',
)
assert.ok(!/demo-response|示例会话|演示流程|configure_uart\(\)/.test(client))
assert.ok(host.includes('hpm_search') && host.includes('hpm_read'))
const native = await readFile(
  'node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js',
  'utf8',
)
assert.match(native, /data-composer-card/)
assert.match(native, /_primary"/)
await mkdir('artifacts', { recursive: true })
const result =
  process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', 'npm pack --dry-run --json --ignore-scripts'], {
        encoding: 'utf8',
      })
    : spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8' })
if (result.status !== 0) throw new Error(result.stderr || 'npm pack failed')
const files = JSON.parse(result.stdout)[0].files.map((file) => file.path)
for (const needed of [
  'lib/index.js',
  'lib/client.js',
  'skills/hpm-knowledge/SKILL.md',
  'dsh.bundle.patch.yml',
  'assets/xien-agent-logo.svg',
  'README.md',
  'LICENSE',
])
  assert.ok(files.includes(needed), `Missing ${needed}`)
assert.ok(
  files.every(
    (file) =>
      !/(?:node_modules|\.runtime|\.env|credentials|agent-report|catalog\.sqlite|dimensions?\.|drawing\.|preview\.html)/.test(
        file,
      ),
  ),
)
console.log(
  JSON.stringify(
    {
      package: manifest.name,
      supportedVersions,
      files: files.length,
      previewDataInProduction: false,
      validated: true,
    },
    null,
    2,
  ),
)

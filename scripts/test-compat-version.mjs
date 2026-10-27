/** CI installs the exact host API set under test; no runtime engine bypass. */
import { readFile, writeFile, access, unlink } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
const version = process.env.XIEN_DSH_TEST_VERSION
if (!['0.2.1-rc.2', '0.2.1-rc.3'].includes(version)) {
  throw new Error('XIEN_DSH_TEST_VERSION must identify a supported DSH release')
}
const manifest = JSON.parse(await readFile('package.json', 'utf8'))
if (
  await access('node_modules').then(
    () => true,
    () => false,
  )
) {
  throw new Error('Run compatibility installation in a fresh checkout without node_modules')
}
for (const name of Object.keys(manifest.devDependencies)) {
  if (name.startsWith('@deepseek-ai/dsh-')) manifest.devDependencies[name] = version
}
for (const name of Object.keys(manifest.peerDependencies)) {
  if (name.startsWith('@deepseek-ai/dsh-')) manifest.devDependencies[name] = version
}
await writeFile('package.json', JSON.stringify(manifest, null, 2) + '\n')
await unlink('package-lock.json').catch((error) => {
  if (error.code !== 'ENOENT') throw error
})
const result =
  process.platform === 'win32'
    ? spawnSync(
        'cmd.exe',
        ['/d', '/s', '/c', 'npm install --ignore-scripts --package-lock=false'],
        { stdio: 'inherit' },
      )
    : spawnSync('npm', ['install', '--ignore-scripts', '--package-lock=false'], {
        stdio: 'inherit',
      })
if (result.status !== 0) process.exit(result.status ?? 1)
console.log(`Compatibility APIs installed for DSH ${version}`)

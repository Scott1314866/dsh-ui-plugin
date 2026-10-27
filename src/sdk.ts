import { readFile, readdir, realpath } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve, relative, isAbsolute, extname, join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { Config, SearchArgs, Source } from './types.ts'

const execute = promisify(execFile)
const suffixes = new Set([
  '.c',
  '.h',
  '.cpp',
  '.hpp',
  '.s',
  '.cmake',
  '.rst',
  '.md',
  '.txt',
  '.yaml',
  '.yml',
])
const ignored = new Set(['.git', 'node_modules', 'build', 'output', '.cache', '__pycache__'])
export const digest = (text: string) => createHash('sha256').update(text).digest('hex')

export function inside(root: string, path: string): boolean {
  const sub = relative(root, path)
  return sub === '' || (!sub.startsWith('..') && !isAbsolute(sub))
}

export async function sdkVersion(root: string): Promise<string | null> {
  for (const file of ['VERSION', 'hpm_sdk/VERSION']) {
    try {
      const text = await readFile(join(root, file), 'utf8')
      const major = /VERSION_MAJOR\s*=\s*(\d+)/.exec(text)?.[1]
      const minor = /VERSION_MINOR\s*=\s*(\d+)/.exec(text)?.[1]
      const patch = /PATCHLEVEL\s*=\s*(\d+)/.exec(text)?.[1]
      if (major && minor && patch) return `${major}.${minor}.${patch}`
    } catch {
      /* Try only explicit version files, never infer from directory name. */
    }
  }
  return null
}

export async function selectSdk(
  config: Config,
  cwd: string | undefined,
  requested?: string,
  rootId?: string,
): Promise<{ root?: string; version?: string | null; warnings: string[] }> {
  let roots = config.sdkRoots ?? []
  const warnings: string[] = []
  if (cwd) {
    let projectSelected = false
    try {
      const project = JSON.parse(await readFile(join(cwd, '.hpm-knowledge.json'), 'utf8'))
      if (typeof project.sdkRoot === 'string') {
        roots = [resolve(cwd, project.sdkRoot)]
        projectSelected = true
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        warnings.push('Project .hpm-knowledge.json could not be parsed; check its sdkRoot.')
    }
    if (!projectSelected)
      try {
        const cmake = await readFile(join(cwd, 'CMakeLists.txt'), 'utf8')
        const literal = /set\(\s*HPM_SDK_BASE\s+["']?([^\s"')]+)["']?\s*\)/i.exec(cmake)?.[1]
        if (literal && !literal.includes('$')) roots = [resolve(cwd, literal)]
        else if (cmake.includes('$ENV{HPM_SDK_BASE}') && process.env.HPM_SDK_BASE)
          roots = [resolve(process.env.HPM_SDK_BASE)]
      } catch {
        /* No CMake SDK reference; retain explicit personal configuration. */
      }
  }
  const candidates = []
  for (const path of roots) {
    try {
      let root = await realpath(path)
      if ((await sdkVersion(root)) !== null) {
        try {
          const child = await realpath(join(root, 'hpm_sdk'))
          if (await sdkVersion(child)) root = child
        } catch {
          /* Already SDK root. */
        }
      }
      candidates.push({ root, version: await sdkVersion(root) })
    } catch {
      warnings.push('Configured SDK directory is inaccessible to this Harness Host.')
    }
  }
  const target = requested ?? config.sdkVersion
  if (rootId) {
    const matched = candidates.find((x) => digest(x.root).slice(0, 16) === rootId)
    if (matched) {
      if (target && matched.version !== target.replace(/^v/, ''))
        warnings.push(
          `SDK version conflict: requested ${target}, local ${matched.version ?? 'unknown'}; do not mix conclusions.`,
        )
      return { ...matched, warnings }
    }
    return {
      warnings: [
        ...warnings,
        'SDK source root is no longer authorized by this project/personal configuration.',
      ],
    }
  }
  if (candidates.length === 1) {
    const chosen = candidates[0]!
    if (target && chosen.version !== target.replace(/^v/, ''))
      warnings.push(
        `SDK version conflict: requested ${target}, local ${chosen.version ?? 'unknown'}; do not mix conclusions.`,
      )
    return { ...chosen, warnings }
  }
  const matched = target ? candidates.filter((x) => x.version === target.replace(/^v/, '')) : []
  if (matched.length === 1) return { ...matched[0], warnings }
  warnings.push(
    candidates.length
      ? 'Multiple SDK roots: choose a project sdkRoot or explicit version; highest version is not selected automatically.'
      : 'No local SDK configured. Native tools and versioned official sources remain available.',
  )
  return { warnings }
}

export async function* files(
  root: string,
  signal: AbortSignal,
  folder = root,
): AsyncGenerator<string> {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    signal.throwIfAborted()
    if (ignored.has(entry.name) || entry.isSymbolicLink()) continue
    const path = join(folder, entry.name)
    if (entry.isDirectory()) yield* files(root, signal, path)
    else if (entry.isFile() && suffixes.has(extname(entry.name).toLowerCase())) yield path
  }
}

async function candidatePaths(
  root: string,
  terms: string[],
  signal: AbortSignal,
): Promise<Map<string, { text: string; line: number }> | undefined> {
  if (process.env.HPM_DISABLE_RG === '1') return undefined
  const flags = [
    '--no-ignore',
    '--hidden',
    '--glob',
    '*.{c,h,cpp,hpp,s,S,cmake,rst,md,txt,yaml,yml}',
    ...Array.from(ignored).flatMap((name) => ['--glob', `!**/${name}/**`]),
  ]
  try {
    const paths = execute('rg', ['--files', ...flags, root], {
      signal,
      maxBuffer: 64 * 1024 * 1024,
    })
    const matches = execute(
      'rg',
      [
        '--json',
        '--max-count=1',
        '--ignore-case',
        '--fixed-strings',
        ...flags,
        ...terms.flatMap((term) => ['-e', term]),
        root,
      ],
      { signal, maxBuffer: 64 * 1024 * 1024 },
    ).catch((error) => {
      if (error.code === 1) return { stdout: '' }
      throw error
    })
    const [all, matched] = await Promise.all([paths, matches])
    const named = all.stdout
      .split(/\r?\n/)
      .filter(
        (path) => path && terms.some((term) => relative(root, path).toLowerCase().includes(term)),
      )
    const records = new Map<string, { text: string; line: number }>()
    for (const line of matched.stdout.split(/\r?\n/)) {
      if (!line) continue
      const event = JSON.parse(line)
      if (event.type === 'match' && event.data.path?.text)
        records.set(event.data.path.text, {
          text: event.data.lines.text,
          line: event.data.line_number,
        })
    }
    for (const path of named)
      if (!records.has(path))
        records.set(path, { text: 'Path/title match; read original file for contents.', line: 1 })
    return records
  } catch (error) {
    if (signal.aborted) throw error
    return undefined
  }
}

export async function searchSdk(
  config: Config,
  cwd: string | undefined,
  args: SearchArgs,
  signal: AbortSignal,
  observe?: (value: { root: string; backend: 'rg' | 'node'; terms: string[] }) => void,
): Promise<{
  sources: Source[]
  warnings: string[]
  root?: string
  terms?: string[]
  backend?: 'rg' | 'node'
  ranking_start?: number
  ranking_ms?: number
}> {
  const selected = await selectSdk(config, cwd, args.version)
  if (!selected.root) return { sources: [], warnings: selected.warnings }
  const root = selected.root
  const aliases: Record<string, string> = {
    串口: 'uart',
    模数: 'adc',
    采样: 'adc',
    定时器: 'gptmr',
    脉宽: 'pwm',
    中断: 'irq',
    时钟: 'clock',
  }
  const terms = [
    ...new Set([
      ...(args.query.match(/[A-Za-z_][A-Za-z0-9_./-]*|[\u3400-\u9fff]{2,}/g) ?? [args.query]),
      ...Object.entries(aliases)
        .filter(([term]) => args.query.includes(term))
        .map(([, term]) => term),
    ]),
  ].map((x) => x.toLowerCase())
  const found: { source: Source; rank: number }[] = []
  const candidates = await candidatePaths(root, terms, signal)
  const backend = candidates ? 'rg' : 'node'
  observe?.({ root, backend, terms })
  async function examine(path: string): Promise<void> {
    signal.throwIfAborted()
    let canonical: string
    try {
      canonical = await realpath(path)
    } catch {
      return
    }
    if (!inside(root, canonical)) return
    const record = candidates?.get(path)
    let text: string
    try {
      text = record?.text ?? (await readFile(canonical, { encoding: 'utf8', signal }))
    } catch {
      signal.throwIfAborted()
      return
    }
    const rel = relative(root, canonical).replaceAll('\\', '/')
    if (
      args.board &&
      rel.startsWith('boards/') &&
      !rel.toLowerCase().includes(args.board.toLowerCase())
    )
      return
    const lower = text.toLowerCase()
    const matched = terms.filter((t) => lower.includes(t) || rel.toLowerCase().includes(t))
    if (!matched.length) return
    const lines = text.split(/\r?\n/)
    const first = record
      ? record.line - 1
      : Math.max(
          0,
          lines.findIndex((line) => matched.some((t) => line.toLowerCase().includes(t))),
        )
    const chipHints = [...new Set(rel.match(/HPM[0-9A-F]{4}/gi) ?? [])]
    const chipConflict =
      !!args.chip &&
      chipHints.length > 0 &&
      !chipHints.some((x) => x.toUpperCase() === args.chip!.toUpperCase())
    if (chipConflict) return
    const source: Source = {
      source_id: `sdk:${digest(root).slice(0, 16)}:${Buffer.from(rel).toString('base64url')}`,
      type: 'sdk',
      title: rel,
      original_url: `hpm-source:${encodeURIComponent(rel)}`,
      version: selected.version ?? null,
      chip: chipHints[0] ?? null,
      fetched_at: new Date().toISOString(),
      snippet: record ? text : lines.slice(Math.max(0, first - 2), first + 5).join('\n'),
      locator: {
        path: rel,
        line_start: first + 1,
        line_end: record ? first + lines.length : Math.min(lines.length, first + 5),
      },
      status: 'search_hit',
      applicability: selected.warnings.some((x) => x.includes('conflict'))
        ? 'conflict'
        : 'unconfirmed',
      ...(record ? {} : { content_id: digest(text) }),
    }
    const peripheral =
      terms.find((term) => /^[a-z][a-z0-9]*_/.test(term))?.split('_')[0] ??
      terms.find((term) =>
        ['uart', 'spi', 'i2c', 'adc', 'pwm', 'dma', 'can', 'gptmr', 'gpio'].includes(term),
      )
    const sample = rel.startsWith('samples/drivers/')
      ? 30 + (peripheral && rel.startsWith(`samples/drivers/${peripheral}/`) ? 25 : 0)
      : rel.startsWith('samples/')
        ? 20
        : rel.endsWith('.md') || rel.endsWith('.rst')
          ? 8
          : 0
    source.open_path = canonical
    found.push({
      source,
      rank:
        matched.length * 10 +
        terms.filter((t) => rel.toLowerCase().includes(t)).length * 15 +
        sample,
    })
  }
  let batch: string[] = []
  async function drain() {
    const work = batch
    batch = []
    const settled = await Promise.allSettled(work.map(examine))
    const failure = settled.find((x) => x.status === 'rejected')
    if (failure?.status === 'rejected') throw failure.reason
  }
  for await (const path of candidates ? candidates.keys() : files(root, signal)) {
    batch.push(path)
    if (batch.length === 32) await drain()
  }
  if (batch.length) await drain()
  const ranking_start = Date.now()
  found.sort((a, b) => b.rank - a.rank || a.source.title.localeCompare(b.source.title))
  return {
    sources: found.map((x) => x.source),
    warnings: selected.warnings,
    root,
    terms,
    backend,
    ranking_start,
    ranking_ms: Date.now() - ranking_start,
  }
}

export async function readSdk(
  source: Source,
  root: string,
  start: number,
  end: number | undefined,
  signal: AbortSignal,
): Promise<{ text: string; source: Source; total_lines: number }> {
  const path = await realpath(resolve(root, source.locator.path!))
  if (!inside(root, path)) throw new Error('SDK source escapes configured root')
  const content = await readFile(path, { encoding: 'utf8', signal })
  const lines = content.split(/\r?\n/)
  const last = Math.min(end ?? start + 159, lines.length)
  if (start > lines.length) throw new Error('Requested line is past end of file')
  let git_commit: string | undefined, git_status: string | undefined
  try {
    // Do not attribute an ignored/untracked SDK to the surrounding application's Git commit.
    await execute('git', ['-C', root, 'ls-files', '--error-unmatch', '--', source.locator.path!], {
      signal,
      timeout: 3000,
    })
    git_commit = (
      await execute('git', ['-C', root, 'rev-parse', 'HEAD'], { signal, timeout: 3000 })
    ).stdout.trim()
    git_status =
      (
        await execute('git', ['-C', root, 'status', '--porcelain', '--', source.locator.path!], {
          signal,
          timeout: 3000,
        })
      ).stdout.trim() || 'clean'
  } catch {
    /* A local SDK need not be a Git checkout. */
  }
  return {
    text: lines
      .slice(start - 1, last)
      .map((x, i) => `${start + i}: ${x}`)
      .join('\n'),
    total_lines: lines.length,
    source: {
      ...source,
      open_path: path,
      status: 'read',
      fetched_at: new Date().toISOString(),
      content_id: digest(content),
      locator: { ...source.locator, line_start: start, line_end: last },
      ...(git_commit ? { git_commit, git_status } : {}),
    },
  }
}

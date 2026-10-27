import { mkdir, readFile, readdir, stat, unlink, writeFile, rename } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { parseHTML } from 'linkedom'
import { digest, readSdk, searchSdk, selectSdk } from './sdk.ts'
import type { Config, EvidenceResult, ReadArgs, SearchArgs, Source } from './types.ts'
import { privateQuestion } from './privacy.ts'
type Web = Pick<import('@deepseek-ai/dsh-web').WebRuntime, 'search' | 'fetch'>

const plain = (html: string) => htmlText(html).replace(/\s+/g, ' ').trim()
const official = (url: string) => {
  try {
    const u = new URL(url)
    return (
      u.protocol === 'https:' &&
      [
        'kb.hpmicro.com',
        'hpm-sdk.readthedocs.io',
        'raw.githubusercontent.com',
        'github.com',
      ].includes(u.hostname) &&
      ((u.hostname !== 'github.com' && u.hostname !== 'raw.githubusercontent.com') ||
        u.pathname.startsWith('/hpmicro/'))
    )
  } catch {
    return false
  }
}
function positive(
  value: number | undefined,
  fallback: number,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (value === undefined) return fallback
  if (!Number.isSafeInteger(value) || value < 1 || value > max)
    throw new Error(`Expected integer between 1 and ${max}`)
  return value
}
function offset(value: number | undefined): number {
  if (value === undefined) return 0
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error('Offset must be a nonnegative integer')
  return value
}

export class Engine {
  readonly config: Config
  private web?: Web
  private network: typeof fetch
  private readonly privateContext: boolean
  constructor(config: Config, web?: Web, network: typeof fetch = fetch, privateContext = false) {
    this.config = config
    this.web = web
    this.network = network
    this.privateContext = privateContext
  }

  private async team(path: string, signal: AbortSignal, body?: unknown): Promise<unknown> {
    if (!this.config.teamUrl || !this.config.teamToken)
      throw new Error('not_configured: team service URL/credential missing')
    const base = new URL(this.config.teamUrl)
    if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password)
      throw new Error('Invalid team URL')
    if (base.protocol !== 'https:' && !['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname))
      throw new Error('Remote team credentials require HTTPS')
    const response = await this.network(new URL(path, base), {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${this.config.teamToken}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
      redirect: 'error',
    })
    if (!response.ok) throw new Error(`team_http_${response.status}`)
    return response.json()
  }

  private async cache(
    url: string,
    load: () => Promise<{ text: string; truncated?: boolean }>,
  ): Promise<{ text: string; fetched_at: string; cached: boolean; truncated?: boolean }> {
    const folder = join(
      this.config.cacheDirectory ?? join(homedir(), '.cache', 'dsh-hpm'),
      'public',
    )
    const path = join(folder, digest(url) + '.json')
    try {
      const loaded = await load()
      if (!loaded.text.trim()) throw new Error('empty_original: source body is unavailable')
      const result = { ...loaded, fetched_at: new Date().toISOString(), cached: false }
      try {
        await mkdir(folder, { recursive: true })
        const temp = path + '.' + randomUUID() + '.tmp'
        await writeFile(temp, JSON.stringify(result))
        await rename(temp, path)
        const entries = await Promise.all(
          (await readdir(folder))
            .filter((x) => x.endsWith('.json'))
            .map(async (name) => ({
              path: join(folder, name),
              stats: await stat(join(folder, name)),
            })),
        )
        let total = entries.reduce((n, x) => n + x.stats.size, 0)
        for (const entry of entries.sort((a, b) => a.stats.mtimeMs - b.stats.mtimeMs)) {
          if (total <= (this.config.cacheBytes ?? 32 * 1024 * 1024)) break
          await unlink(entry.path)
          total -= entry.stats.size
        }
      } catch {
        /* Cache persistence must not discard successful evidence. */
      }
      return result
    } catch (error) {
      try {
        const saved = JSON.parse(await readFile(path, 'utf8'))
        return { ...saved, cached: true }
      } catch {
        throw error
      }
    }
  }

  private async publicText(
    url: string,
    signal: AbortSignal,
  ): Promise<{ text: string; truncated: boolean }> {
    if (this.privateContext)
      throw new Error(
        'private_context: public adapter reads disabled; authorized local/team readers remain available',
      )
    if (!official(url))
      throw new Error('URL is outside this adapter; native readers remain available for other URLs')
    // Reuse the configured Harness fetch service first; a missing provider falls back to ordinary official HTTP.
    if (this.web) {
      try {
        const result = await this.web.fetch({ url }, signal)
        if (result.statusCode < 200 || result.statusCode >= 300)
          throw new Error(`http_${result.statusCode}`)
        if (result.body.kind === 'text')
          return { text: result.body.content, truncated: result.truncated }
        return { text: htmlText(result.body.content), truncated: result.truncated }
      } catch (error) {
        if (signal.aborted) throw error
      }
    }
    const response = await this.network(url, { signal, redirect: 'error' })
    if (!response.ok) throw new Error(`http_${response.status}`)
    const body = await response.text()
    return {
      text: response.headers.get('content-type')?.includes('html') ? htmlText(body) : body,
      truncated: false,
    }
  }

  async search(
    args: SearchArgs,
    cwd: string | undefined,
    signal: AbortSignal,
  ): Promise<EvidenceResult> {
    if (!args.query?.trim()) throw new Error('query must be non-empty')
    if (args.type && !['all', 'kb', 'sdk', 'manual'].includes(args.type))
      throw new Error('Invalid source type')
    if (args.visibility && !['private', 'public'].includes(args.visibility))
      throw new Error('Invalid query visibility')
    const limit = positive(args.limit, this.config.batchSize ?? 20, 200),
      skip = offset(args.offset)
    const query = {
      ...args,
      chip: args.chip ?? this.config.chip,
      board: args.board ?? this.config.board,
      version: args.version ?? this.config.sdkVersion,
    }
    const result: EvidenceResult = {
      status: 'ok',
      sources: [],
      warnings: [],
      trace_id: randomUUID(),
      spans: [],
      external_searches: 0,
      cache_hits: 0,
      searched: query,
    }
    const privateQuery =
      this.privateContext || args.visibility === 'private' || privateQuestion(args.query)
    if (privateQuery) {
      result.warnings.push(
        'Private context: public KB and official SDK network fallback are disabled. Internal-document adapter is deferred; use authorized local SDK/manual sources or native file readers.',
      )
      result.searched = { ...query, visibility: 'private', public_network_allowed: false }
      if (args.type === 'kb') {
        result.status = 'unavailable'
        result.has_more = false
        result.next_offset = null
        result.spans.push({
          span_id: randomUUID(),
          name: 'search.kb',
          start: Date.now(),
          duration_ms: 0,
          status: 'private_context',
          summary: 'No public request or public-cache lookup was performed.',
        })
        return result
      }
    }
    if (args.type === 'sdk')
      result.searched = {
        ...(result.searched as object),
        configured_host_sdk_roots: this.config.sdkRoots ?? [],
        project_directory: cwd ?? null,
      }
    if (args.type === undefined || args.type === 'all') {
      const batches: Source[][] = []
      let more = false
      // Rebuild a deterministic prefix before slicing a merged page. Advancing every
      // adapter by the display limit would silently skip unshown candidates.
      for (const type of (privateQuery ? ['sdk', 'manual'] : ['kb', 'sdk', 'manual']) as (
        | 'kb'
        | 'sdk'
        | 'manual'
      )[]) {
        const sources: Source[] = []
        let position = 0
        while (sources.length < skip + limit + 1) {
          const batch = await this.search(
            {
              ...args,
              type,
              ...(privateQuery ? { visibility: 'private' as const } : {}),
              offset: position,
              limit: Math.min(200, skip + limit + 1 - sources.length),
            },
            cwd,
            signal,
          )
          sources.push(...batch.sources)
          result.warnings.push(...batch.warnings)
          result.spans.push(...batch.spans)
          result.external_searches += batch.external_searches
          result.cache_hits += batch.cache_hits
          if (
            !batch.has_more ||
            !batch.sources.length ||
            batch.next_offset === null ||
            batch.next_offset === undefined ||
            batch.next_offset <= position
          )
            break
          position = batch.next_offset
          if (sources.length >= skip + limit + 1) more = true
        }
        batches.push(sources)
      }
      const seen = new Set<string>(),
        merged: Source[] = []
      for (let rank = 0; rank < Math.max(0, ...batches.map((x) => x.length)); rank++)
        for (const batch of batches) {
          const s = batch[rank]
          if (!s) continue
          const key = s.original_url + '@' + s.version
          if (!seen.has(key)) {
            seen.add(key)
            merged.push(s)
          }
        }
      result.sources = merged.slice(skip, skip + limit)
      result.has_more = more || merged.length > skip + limit
      result.next_offset = result.has_more ? skip + result.sources.length : null
      const adapters = result.spans.filter((x) => x.name.startsWith('search.'))
      result.status = result.sources.length
        ? 'ok'
        : adapters.every((x) => x.status !== 'ok')
          ? 'unavailable'
          : 'no_results'
      result.ranking =
        'Deterministic round-robin across per-adapter ranked candidates; merged pagination retains unshown candidates. Upstream KB/provider recall is limited.'
      return result
    }
    const requested = [args.type]
    const batches: Source[][] = []
    let more = false
    for (const type of requested) {
      const start = Date.now(),
        span_id = randomUUID()
      try {
        if (type === 'sdk') {
          const local = await searchSdk(this.config, cwd, query, signal, (value) => {
            result.searched = {
              ...(result.searched as object),
              host_sdk_root: value.root,
              search_backend: value.backend,
              expanded_terms: value.terms,
            }
            result.spans.push({
              span_id: randomUUID(),
              parent_id: span_id,
              name: 'sdk.discover',
              start,
              duration_ms: Date.now() - start,
              status: 'ok',
              summary: JSON.stringify({ backend: value.backend, expanded_terms: value.terms }),
            })
          })
          result.warnings.push(...local.warnings)
          let sources = local.sources
          if (!sources.length && query.version && this.web && !privateQuery) {
            result.external_searches++
            const remote = await this.web.search(
              {
                query: `site:hpm-sdk.readthedocs.io/en/v${query.version.replace(/^v/, '')}/ ${query.query}`,
                maxResults: skip + limit + 1,
              },
              signal,
            )
            sources = remote.sources
              .filter(
                (x) => x.url.includes(`/v${query.version!.replace(/^v/, '')}/`) && official(x.url),
              )
              .map((x) => this.webSource(x, 'sdk', query.version!))
            more ||= remote.truncated
            result.warnings.push(
              'Official SDK fallback uses provider-controlled recall/ranking; refine the query for further sources.',
            )
          }
          batches.push(sources.slice(skip, skip + limit + 1))
          more ||= sources.length > skip + limit
          if (local.ranking_start !== undefined)
            result.spans.push({
              span_id: randomUUID(),
              parent_id: span_id,
              name: 'ranking.sdk',
              start: local.ranking_start,
              duration_ms: local.ranking_ms ?? 0,
              status: 'ok',
              summary: `${sources.length} matched files; examples then peripheral/title/symbol match, stable path order`,
            })
        } else if (type === 'kb') {
          const pageSize = 100,
            page = Math.floor(skip / pageSize) + 1
          const url = `https://kb.hpmicro.com/wp-json/wp/v2/posts?search=${encodeURIComponent(query.query)}&per_page=${pageSize}&page=${page}&orderby=relevance&_fields=id,link,date,modified,title,excerpt`
          let sources: Source[]
          try {
            result.external_searches++
            const data = await this.cache(url, async () => {
              const response = await this.network(url, { signal, redirect: 'error' })
              if (!response.ok) throw new Error(`kb_http_${response.status}`)
              return { text: await response.text() }
            })
            const posts = JSON.parse(data.text)
            if (!Array.isArray(posts))
              throw new Error('interface_changed: KB response is not an article array')
            sources = posts
              .filter((x) => typeof x.link === 'string' && official(x.link))
              .map((x) => ({
                ...this.webSource(
                  {
                    url: x.link,
                    title: plain(x.title?.rendered ?? ''),
                    snippet: plain(x.excerpt?.rendered ?? ''),
                  },
                  'kb',
                  null,
                ),
                fetched_at: data.fetched_at,
                cached: data.cached,
                published_at: x.date,
                modified_at: x.modified,
              }))
            if (data.cached) {
              result.cache_hits++
              result.warnings.push(`Offline KB search cache from ${data.fetched_at}`)
            }
            more ||= posts.length === pageSize
          } catch (error) {
            // A public query may fall back within the same official site. Manual queries never enter this branch.
            if (signal.aborted) throw error
            const searchUrl = `https://kb.hpmicro.com/?s=${encodeURIComponent(query.query)}&paged=${page}`
            result.warnings.push(
              `KB article API unavailable (${errorCode(error)}); official site search fallback.`,
            )
            try {
              result.external_searches++
              const response = await this.network(searchUrl, { signal, redirect: 'error' })
              if (!response.ok) throw new Error(`kb_http_${response.status}`)
              const html = await response.text()
              sources = [
                ...html.matchAll(
                  /<h[23][^>]*>[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h[23]>/gi,
                ),
              ]
                .filter((x) => official(x[1]!))
                .map((x) => this.webSource({ url: x[1]!, title: plain(x[2]!) }, 'kb', null))
              more ||= /next|下一页/.test(html)
            } catch {
              if (!this.web) throw error
              result.external_searches++
              const remote = await this.web.search(
                { query: `site:kb.hpmicro.com ${query.query}`, maxResults: skip + limit + 1 },
                signal,
              )
              sources = remote.sources
                .filter((x) => new URL(x.url).hostname === 'kb.hpmicro.com')
                .map((x) => this.webSource(x, 'kb', null))
                .slice(skip)
              more ||= remote.truncated
              result.warnings.push(
                'Provider-controlled recall/ranking; no portable search cursor. Refine query for further discovery.',
              )
            }
          }
          batches.push(sources.slice(skip % pageSize, (skip % pageSize) + limit))
        } else {
          const team = (await this.team('/v1/search', signal, {
            query: query.query,
            chip: query.chip,
            version: args.version,
            libraries: args.libraries,
            offset: skip,
            limit,
          })) as { sources: Source[]; has_more: boolean }
          batches.push(
            team.sources.map((x) => ({
              ...x,
              original_url: new URL(x.original_url, this.config.teamUrl).href,
              source_id: 'manual:' + x.source_id,
            })),
          )
          more ||= team.has_more
        }
        result.spans.push({
          span_id,
          name: `search.${type}`,
          start,
          duration_ms: Date.now() - start,
          status: 'ok',
          summary: `${batches.at(-1)?.length ?? 0} candidates before merge`,
        })
      } catch (error) {
        const code = errorCode(error)
        result.warnings.push(
          `${type}: ${code}. Continue with native tools or configure the adapter.`,
        )
        result.spans.push({
          span_id,
          name: `search.${type}`,
          start,
          duration_ms: Date.now() - start,
          status: code,
          summary: 'Adapter unavailable; native tools remain usable.',
        })
      }
    }
    const seen = new Set<string>()
    const mergeStart = Date.now()
    // Round-robin keeps adapters represented; per-adapter order is applicability/title/symbol/text or upstream rank.
    for (let rank = 0; rank < Math.max(0, ...batches.map((x) => x.length)); rank++)
      for (const batch of batches) {
        const source = batch[rank]
        if (!source) continue
        const identity =
          source.type === 'kb' ? source.original_url + '@' + source.version : source.source_id
        if (seen.has(identity)) continue
        seen.add(identity)
        result.sources.push(source)
      }
    more ||= result.sources.length > limit
    result.sources = result.sources.slice(0, limit)
    result.spans.push({
      span_id: randomUUID(),
      name: 'merge.deduplicate',
      start: mergeStart,
      duration_ms: Date.now() - mergeStart,
      status: 'ok',
      summary: `${seen.size} distinct candidates in fetched batch; returned ${result.sources.length}; more=${more}`,
    })
    result.has_more = more
    result.next_offset = more && result.sources.length ? skip + result.sources.length : null
    result.ranking =
      'Round-robin adapter merge; SDK example/title/symbol/text match; KB upstream relevance; manuals FTS5. This batch is not the complete evidence set.'
    const adapters = result.spans.filter((x) => x.name.startsWith('search.'))
    result.status = result.sources.length
      ? adapters.some((x) => x.status !== 'ok')
        ? 'partial'
        : 'ok'
      : adapters.every((x) => x.status !== 'ok')
        ? 'unavailable'
        : 'no_results'
    return result
  }

  private webSource(
    source: { url: string; title?: string; snippet?: string },
    type: 'kb' | 'sdk',
    version: string | null,
  ): Source {
    return {
      source_id: `web:${type}:${Buffer.from(source.url).toString('base64url')}`,
      type,
      title: source.title ?? source.url,
      original_url: source.url,
      version,
      fetched_at: new Date().toISOString(),
      snippet: source.snippet ?? '',
      locator: {},
      status: 'search_hit',
      applicability: 'unconfirmed',
    }
  }

  async read(
    args: ReadArgs,
    cwd: string | undefined,
    signal: AbortSignal,
  ): Promise<EvidenceResult> {
    const start = Date.now(),
      limit = positive(args.limit, 16000, 1000000),
      skip = offset(args.offset)
    const result: EvidenceResult = {
      status: 'ok',
      sources: [],
      warnings: [],
      trace_id: randomUUID(),
      spans: [],
      external_searches: 0,
      cache_hits: 0,
    }
    try {
      if (args.source_id.startsWith('manual:')) {
        const id = args.source_id.slice(7)
        const query = new URLSearchParams({
          offset: String(skip),
          limit: String(limit),
          ...(args.page ? { page: String(positive(args.page, 1)) } : {}),
        })
        const data = (await this.team(
          `/v1/sources/${encodeURIComponent(id)}?${query}`,
          signal,
        )) as {
          source: Source
          text: string
          truncated: boolean
          next_offset: number | null
          table_html?: string
          notes?: string[]
        }
        result.sources = [
          {
            ...data.source,
            original_url: new URL(data.source.original_url, this.config.teamUrl).href,
            source_id: 'manual:' + data.source.source_id,
          },
        ]
        result.text = data.text
        result.truncated = data.truncated
        result.table_html = data.table_html
        result.notes = data.notes
        result.next_read = data.next_offset === null ? null : { ...args, offset: data.next_offset }
      } else if (args.source_id.startsWith('sdk:')) {
        const [, rootId, encoded] = args.source_id.split(':')
        if (!encoded) throw new Error('Invalid SDK source id')
        const selected = await selectSdk(this.config, cwd, undefined, rootId)
        if (!selected.root || digest(selected.root).slice(0, 16) !== rootId)
          throw new Error(
            'SDK root changed or is unavailable; search with current project/version again',
          )
        const rel = Buffer.from(encoded, 'base64url').toString('utf8')
        const source: Source = {
          source_id: args.source_id,
          type: 'sdk',
          title: rel,
          original_url: `hpm-source:${encodeURIComponent(rel)}`,
          version: selected.version ?? null,
          fetched_at: new Date().toISOString(),
          snippet: '',
          locator: { path: rel },
          status: 'search_hit',
          applicability: selected.warnings.some((warning) => warning.includes('conflict'))
            ? 'conflict'
            : 'unconfirmed',
        }
        const first = positive(args.line_start, 1),
          last = args.line_end === undefined ? undefined : positive(args.line_end, first)
        if (last !== undefined && last < first) throw new Error('line_end must be >= line_start')
        const read = await readSdk(source, selected.root, first, last, signal)
        read.source.snippet = read.text.slice(0, 400)
        result.sources = [read.source]
        result.text = read.text
        result.total_lines = read.total_lines
        result.truncated = read.source.locator.line_end! < read.total_lines
        result.next_read = result.truncated
          ? { ...args, line_start: read.source.locator.line_end! + 1, line_end: undefined }
          : null
        result.warnings.push(...selected.warnings)
      } else if (args.source_id.startsWith('web:')) {
        if (this.privateContext)
          throw new Error(
            'private_context: public adapter read/cache lookup disabled for this private question',
          )
        const [, type, encoded] = args.source_id.split(':')
        const url = Buffer.from(encoded ?? '', 'base64url').toString('utf8')
        const data = await this.cache(url, () => this.publicText(url, signal))
        result.external_searches = 0 // Reading an identified URL is not an external search.
        const version = /\/v(\d+\.\d+\.\d+)\//.exec(url)?.[1] ?? null
        result.sources = [
          {
            ...this.webSource({ url }, type === 'sdk' ? 'sdk' : 'kb', version),
            snippet: data.text.slice(skip, skip + 400),
            status: 'read',
            fetched_at: data.fetched_at,
            cached: data.cached,
            content_id: digest(data.text),
          },
        ]
        result.text = data.text.slice(skip, skip + limit)
        result.truncated = skip + limit < data.text.length || data.truncated
        result.next_read =
          skip + limit < data.text.length ? { ...args, offset: skip + limit } : null
        if (data.truncated)
          result.warnings.push(
            'Fetch provider truncated the page; native web_fetch or a more specific URL may be needed.',
          )
        if (data.cached) {
          result.cache_hits++
          result.warnings.push(`Offline cached content from ${data.fetched_at}`)
        }
      } else
        throw new Error(
          'Unknown source identifier; use native readers for user URLs and paths directly',
        )
    } catch (error) {
      result.status = errorCode(error)
      result.warnings.push(
        'Read failed. Use native readers or another source; search snippets are not verified evidence.',
      )
    }
    result.spans.push({
      span_id: randomUUID(),
      name: 'read',
      start,
      duration_ms: Date.now() - start,
      status: result.status,
      summary: `${result.text?.length ?? 0} source characters`,
      source_ids: result.sources.map((x) => x.source_id),
    })
    return result
  }
}

export function errorCode(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'TimeoutError' || /timeout/i.test(error.message)) return 'timeout'
    if (error.name === 'AbortError') return 'cancelled'
    if (error instanceof SyntaxError) return 'interface_changed'
    const cause = error.cause as { code?: string } | undefined
    if (
      /fetch failed|failed to fetch|network error|network request failed|load failed/i.test(
        error.message,
      ) ||
      /ENOTFOUND|ECONNRESET|ECONNREFUSED|ETIMEDOUT/.test(cause?.code ?? '')
    )
      return 'network_error'
    if (/not_configured/.test(error.message)) return 'not_configured'
    const status = /(?:http_)(\d+)/.exec(error.message)?.[1]
    if (status === '429' || status === '503') return 'busy'
    if (status === '401' || status === '403') return 'access_denied'
    if (/interface_changed/.test(error.message)) return 'interface_changed'
    if (status) return `http_${status}`
    return 'unavailable'
  }
  return 'unavailable'
}

export function htmlText(html: string): string {
  // Parse without executing scripts. Prefer the article body over global navigation.
  const { document } = parseHTML(
    /<html[\s>]/i.test(html) ? html : `<html><body>${html}</body></html>`,
  )
  for (const node of document.querySelectorAll(
    'script,style,noscript,svg,template,nav,footer,aside,form,button,input,[hidden],[aria-hidden="true"]',
  ))
    node.remove()
  for (const node of document.querySelectorAll('[style]'))
    if (/display\s*:\s*none|visibility\s*:\s*hidden/i.test(node.getAttribute('style') ?? ''))
      node.remove()
  const root =
    document.querySelector(
      'article .entry-content,article .post-content,.entry-content,main article,article,main,[role="main"]',
    ) ?? document.body
  function render(node: Node): string {
    if (node.nodeType === 3) return node.textContent ?? ''
    const tag = node.nodeName.toLowerCase()
    if (tag === 'br' || tag === 'hr') return '\n'
    const inner = Array.from(node.childNodes).map(render).join('')
    if (tag === 'td' || tag === 'th') return inner + ' | '
    if (/^(?:p|div|section|article|h[1-6]|pre|tr|li|table)$/.test(tag)) return inner + '\n'
    return inner
  }
  return render(root)
    .replace(/\n[\t ]+\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

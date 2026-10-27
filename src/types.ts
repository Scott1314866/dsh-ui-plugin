export type SourceType = 'kb' | 'sdk' | 'manual'
export interface Source {
  source_id: string
  type: SourceType
  title: string
  original_url: string
  version: string | null
  chip?: string | null
  board?: string | null
  fetched_at: string
  snippet: string
  locator: {
    path?: string
    line_start?: number
    line_end?: number
    page?: number
    section?: string
  }
  status: 'search_hit' | 'read'
  applicability: 'unconfirmed' | 'as_documented' | 'conflict'
  content_id?: string
  git_commit?: string
  git_status?: string
  open_path?: string
  cached?: boolean
}
export interface SearchArgs {
  query: string
  type?: SourceType | 'all'
  chip?: string
  board?: string
  version?: string
  libraries?: string[]
  offset?: number
  limit?: number
  visibility?: 'public' | 'private'
}
export interface ReadArgs {
  source_id: string
  line_start?: number
  line_end?: number
  page?: number
  offset?: number
  limit?: number
}
export interface Config {
  chip?: string
  board?: string
  sdkVersion?: string
  sdkRoots?: string[]
  teamUrl?: string
  teamToken?: string
  batchSize?: number
  cacheDirectory?: string
  cacheBytes?: number
  timeoutMs?: number
}
export interface Stage {
  span_id: string
  parent_id?: string
  name: string
  start: number
  duration_ms: number
  status: string
  summary: string
  source_ids?: string[]
}
export interface EvidenceResult {
  status: string
  sources: Source[]
  has_more?: boolean
  next_offset?: number | null
  text?: string
  truncated?: boolean
  next_read?: ReadArgs | null
  warnings: string[]
  searched?: unknown
  ranking?: string
  trace_id: string
  spans: Stage[]
  external_searches: number
  cache_hits: number
  [key: string]: unknown
}

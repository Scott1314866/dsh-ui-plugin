/** Read-side projection of real Harness events. No prompt transport or simulated progress. */
import type { Source } from './types.ts'

export interface EventLike {
  type: string
  seq: number
  time: number
  data: unknown
}
export interface WindowEntry {
  type: 'event' | 'transient'
  event: EventLike
}
export interface Call {
  id: string
  parentId?: string
  name: string
  start: number
  end?: number
  status: 'running' | 'ok' | 'error'
  input: string
  output: string
}
export interface Turn {
  seq: number
  number: number
  start: number
  end?: number
  reason?: string
  question: string
  calls: Call[]
  sources: Source[]
  warnings: string[]
}
export interface Lifecycle {
  running: boolean
  openState: string
  removed: boolean
  pendingSubmissions: readonly unknown[]
  awaitingFirstTurn: boolean
  promptError: unknown
  lastAgentError: string | null
}
export type Phase =
  | 'loading'
  | 'ready'
  | 'sending'
  | 'working'
  | 'searching'
  | 'reading'
  | 'answering'
  | 'waiting'
  | 'completed'
  | 'stopped'
  | 'interrupted'
  | 'error'
export interface WorkState {
  phase: Phase
  label: string
  detail: string
  busy: boolean
  started?: number
  ended?: number
}
export const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
const str = (value: unknown) => (typeof value === 'string' ? value : '')

/** Used only for observable tool inputs/outputs; never exports assistant reasoning. */
export function redact(value: unknown): unknown {
  if (typeof value === 'string')
    return value
      .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]')
      .replace(/([?&](?:token|key|ticket|secret|access|signature)=)[^&#\s]+/gi, '$1[REDACTED]')
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')
  if (Array.isArray(value)) return value.map(redact)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !/thinking|reasoning|chain.?of.?thought|stream/i.test(key))
        .map(([key, v]) => [
          key,
          /secret|password|credential|authorization|api.?key|^token$/i.test(key)
            ? '[REDACTED]'
            : redact(v),
        ]),
    )
  return value
}
const summary = (v: unknown): string =>
  (typeof v === 'string' ? String(redact(v)) : (JSON.stringify(redact(v)) ?? '')).slice(0, 4000)
function text(v: unknown): string {
  return Array.isArray(v)
    ? v
        .filter((x) => record(x).type === 'text')
        .map((x) => str(record(x).text))
        .join('\n')
    : ''
}
function source(value: unknown): Source | undefined {
  const v = record(value),
    loc = record(v.locator)
  if (
    typeof v.source_id !== 'string' ||
    typeof v.title !== 'string' ||
    typeof v.original_url !== 'string' ||
    !['sdk', 'manual', 'kb'].includes(str(v.type)) ||
    !['search_hit', 'read'].includes(str(v.status))
  )
    return
  return {
    source_id: v.source_id,
    type: v.type as Source['type'],
    title: v.title,
    original_url: v.original_url,
    version: typeof v.version === 'string' ? v.version : null,
    chip: typeof v.chip === 'string' ? v.chip : null,
    board: typeof v.board === 'string' ? v.board : null,
    fetched_at: str(v.fetched_at),
    snippet: str(v.snippet),
    status: v.status as Source['status'],
    applicability: ['unconfirmed', 'as_documented', 'conflict'].includes(str(v.applicability))
      ? (v.applicability as Source['applicability'])
      : 'unconfirmed',
    locator: {
      path: typeof loc.path === 'string' ? loc.path : undefined,
      line_start: typeof loc.line_start === 'number' ? loc.line_start : undefined,
      line_end: typeof loc.line_end === 'number' ? loc.line_end : undefined,
      page: typeof loc.page === 'number' ? loc.page : undefined,
      section: typeof loc.section === 'string' ? loc.section : undefined,
    },
    open_path: typeof v.open_path === 'string' ? v.open_path : undefined,
    cached: v.cached === true,
    git_commit: typeof v.git_commit === 'string' ? v.git_commit : undefined,
  }
}

/** Windows can begin inside a turn; use data.turn to retain partial history explicitly. */
export function projectTurns(entries: readonly WindowEntry[]): Turn[] {
  const turns: Turn[] = [],
    byTurn = new Map<number, Turn>(),
    calls = new Map<string, { turn: Turn; call: Call }>()
  let current: Turn | undefined
  for (const entry of entries) {
    if (entry.type !== 'event') continue
    const event = entry.event,
      data = record(event.data),
      number = typeof data.turn === 'number' ? data.turn : current?.number
    if (event.type === 'turn/start') {
      current = {
        seq: event.seq,
        number: number ?? event.seq,
        start: event.time,
        question: '',
        calls: [],
        sources: [],
        warnings: [],
      }
      turns.push(current)
      byTurn.set(current.number, current)
    } else if (number !== undefined) {
      current = byTurn.get(number)
      if (!current) {
        current = {
          seq: event.seq,
          number,
          start: event.time,
          question: '（本轮开头尚未加载）',
          calls: [],
          sources: [],
          warnings: [],
        }
        turns.push(current)
        byTurn.set(number, current)
      }
    }
    if (!current) continue
    if (event.type === 'user/message' && record(data.source).kind === 'user')
      current.question = text(data.content) || current.question
    if (event.type === 'tool/call' || event.type === 'tool/ptc-dispatch-start') {
      const id = str(data.subCallId) || str(data.callId)
      if (!id) continue
      const call: Call = {
        id,
        parentId: str(data.parentCallId) || undefined,
        name: str(data.name) || 'tool',
        start: event.time,
        status: 'running',
        input: summary(data.arguments),
        output: '',
      }
      current.calls.push(call)
      calls.set(id, { turn: current, call })
    }
    if (event.type === 'tool/result' || event.type === 'tool/ptc-dispatch') {
      const message = record(data.message),
        id = str(data.subCallId) || str(message.toolCallId) || str(data.callId)
      let existing = calls.get(id)
      if (!existing) {
        const call: Call = {
          id: id || `partial-${event.seq}`,
          name: str(data.name) || 'tool（调用头未加载）',
          start: event.time,
          status: 'running',
          input: '',
          output: '',
        }
        current.calls.push(call)
        existing = { turn: current, call }
        calls.set(call.id, existing)
      }
      const { call, turn } = existing
      call.end = event.time
      call.status = (data.isError ?? message.isError) ? 'error' : 'ok'
      call.output = summary(text(data.content ?? message.content))
      const meta = record(data.meta)
      if (Array.isArray(meta.sources))
        for (const candidate of meta.sources) {
          const item = source(candidate)
          if (!item) continue
          const i = turn.sources.findIndex((s) => s.source_id === item.source_id)
          if (i < 0) turn.sources.push(item)
          else if (item.status === 'read' || turn.sources[i]!.status !== 'read')
            turn.sources[i] = item
        }
      if (Array.isArray(meta.warnings))
        turn.warnings.push(...meta.warnings.filter((x): x is string => typeof x === 'string'))
      if (meta.status === 'error') call.status = 'error'
    }
    if (event.type === 'turn/end') {
      current.end = event.time
      current.reason = str(record(data.reason).kind) || str(data.reason)
    }
  }
  return turns
}

export function workState(
  lifecycle: Lifecycle,
  entries: readonly WindowEntry[],
  waiting = false,
): WorkState {
  const turns = projectTurns(entries),
    turn = turns.at(-1),
    base = { busy: false, started: turn?.start, ended: turn?.end }
  if (lifecycle.removed)
    return { ...base, phase: 'error', label: '会话已移除', detail: '请从侧栏重新选择会话' }
  if (lifecycle.openState === 'error')
    return {
      ...base,
      phase: 'error',
      label: '连接异常',
      detail: '会话加载失败，请检查 Harness 连接',
    }
  if (lifecycle.openState === 'cold' || lifecycle.openState === 'loading')
    return { ...base, phase: 'loading', label: '同步会话中', detail: '正在恢复真实历史与运行状态' }
  if (lifecycle.promptError)
    return {
      ...base,
      busy: lifecycle.running,
      phase: 'error',
      label: '操作未成功',
      detail: '请查看原生对话中的发送或停止错误',
    }
  if (waiting)
    return {
      ...base,
      busy: lifecycle.running,
      phase: 'waiting',
      label: '等待确认',
      detail: '请在原生审批或提问面板中继续',
    }
  if (
    lifecycle.awaitingFirstTurn ||
    (!lifecycle.running && lifecycle.pendingSubmissions.length > 0)
  )
    return {
      ...base,
      busy: true,
      phase: 'sending',
      label: '正在提交',
      detail: '等待 Host 接纳本轮请求',
    }
  if (lifecycle.running) {
    // Closed historical turns cannot lend stale calls to a newer running/queued turn.
    const active = turn && !turn.end ? turn : undefined
    const pending = active?.calls.filter((c) => c.status === 'running') ?? []
    const call = pending.at(-1),
      busy = { ...base, busy: true, ended: undefined, started: active?.start }
    if (call) {
      const phase: Phase = /search|find|grep/i.test(call.name)
        ? 'searching'
        : /read|fetch|open/i.test(call.name)
          ? 'reading'
          : 'working'
      return {
        ...busy,
        phase,
        label:
          phase === 'searching' ? '检索资料中' : phase === 'reading' ? '读取原文中' : '执行工具中',
        detail: call.name + (pending.length > 1 ? ` · ${pending.length} 项并行` : ''),
      }
    }
    const live = entries.at(-1)?.event
    if (active && (active.calls.length || live?.type === 'assistant/live-chunk'))
      return { ...busy, phase: 'answering', label: '整理回答中', detail: '正在生成结论与引用' }
    return { ...busy, phase: 'working', label: 'Agent 工作中', detail: '等待模型响应' }
  }
  if (turn?.reason === 'completed')
    return { ...base, phase: 'completed', label: '本轮已完成', detail: '可以继续追问当前工程' }
  if (turn?.reason === 'aborted')
    return { ...base, phase: 'stopped', label: '已停止', detail: 'Host 已确认本轮停止' }
  if (turn?.reason === 'interrupted' || turn?.reason === 'forked')
    return {
      ...base,
      phase: 'interrupted',
      label: '本轮已中断',
      detail: '历史回合未正常完成，可继续提问',
    }
  if (turn?.reason === 'blocked')
    return { ...base, phase: 'waiting', label: '执行受阻', detail: '请查看原生对话中的提示' }
  if (turn?.reason === 'error' || turn?.reason === 'max-tokens' || lifecycle.lastAgentError)
    return { ...base, phase: 'error', label: '本轮未完成', detail: '请查看模型错误或输出限制提示' }
  return {
    ...base,
    phase: 'ready',
    label: '已就绪',
    detail: turn ? 'Host 当前空闲；本轮结束记录尚未确认' : '随时开始新的工程任务',
  }
}

/** Prevent executable URLs from source metadata entering links or browser navigation. */
export function externalUrl(value: string): string | undefined {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : undefined
  } catch {
    return
  }
}
export function exportTrace(turn: Turn) {
  return redact({
    schema: 'xien-trace-v1',
    turn: turn.number,
    started_at: turn.start,
    ended_at: turn.end,
    reason: turn.reason,
    calls: turn.calls,
    sources: turn.sources,
    warnings: turn.warnings,
  })
}

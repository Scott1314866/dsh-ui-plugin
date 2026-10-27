import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { PropsRuntime, InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
import type {
  SessionEventSource,
  SessionEventWindow,
} from '@deepseek-ai/dsh-api-session-controller/client'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import { fileAddressFor } from '@deepseek-ai/dsh-util-workspace-path'
import { BrandMark, BrandName, HeroBrand, EvidenceIcon } from './brand.tsx'
import { theme } from './theme.ts'
import { projectTurns, workState, exportTrace, externalUrl, redact } from './model.ts'
import type { WindowEntry, Turn, WorkState } from './model.ts'
import type { Config, Source } from './types.ts'

export const inject = ['slots', 'sessions', 'configForms', 'sidebarRight', 'sidebarRightTabs']
const TAB = 'xien-engineering-evidence'
declare module '@deepseek-ai/dsh-client-ui-sidebar-right/client' {
  interface SidebarRightTabParamsMap {
    'xien-engineering-evidence': { turn?: number }
  }
}
const empty: SessionEventWindow = {
  entries: [],
  hasMore: false,
  revision: 0,
  change: { kind: 'replace', entries: [] },
}
const noEvents: SessionEventSource = { getSnapshot: () => empty, subscribe: () => () => {} }
type EvidenceFace = { events: SessionEventSource; openEvidence: (turn?: number) => void }
type StatusProps = PropsRuntime<'conversation.input.dock'> & InjectFace<EvidenceFace>
type TailProps = PropsRuntime<'conversation.chat.turnTail'> & InjectFace<EvidenceFace>
type HeaderProps = PropsRuntime<'conversation.session.header.utilities'> & InjectFace<EvidenceFace>
interface PanelFace {
  events: SessionEventSource
  form: ConfigForm<Config>
  openLocal: (path: string) => void
  loadOlder: () => Promise<void>
}
type PanelProps = PropsRuntime<'sidebar.right.pane.tab'> & InjectFace<PanelFace>

function useWindow(events: SessionEventSource) {
  return useSyncExternalStore(events.subscribe.bind(events), events.getSnapshot.bind(events))
}
function useTime(state: WorkState) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!state.busy) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [state.busy, state.started])
  if (!state.started) return ''
  const value = Math.max(0, ((state.ended ?? now) - state.started) / 1000)
  return `${value.toFixed(value < 10 ? 1 : 0)} s`
}
export function WorkBar({ state }: { state: WorkState }) {
  const elapsed = useTime(state)
  return (
    <div
      className="xien-workbar"
      role="status"
      aria-live="polite"
      data-busy={state.busy}
      data-phase={state.phase}
    >
      <span className="xien-dot" />
      <strong>{state.label}</strong>
      <small>{state.detail}</small>
      <span className="xien-clock" aria-live="off">
        {elapsed}
      </span>
    </div>
  )
}
function Header(props: HeaderProps) {
  return (
    <button
      type="button"
      className="xien-evidence-button"
      onClick={() => props.openEvidence()}
      title="打开当前会话的工程证据"
    >
      <EvidenceIcon />
      工程证据
    </button>
  )
}
function ComposerStatus(props: StatusProps) {
  const snapshot = props.useSession((value) => value)
  const window = useWindow(props.events)
  const waiting = props.useSessionStatus(
    (value) => !!value.get(props.sessionId)?.pendingInteraction,
  )
  const state = useMemo(
    () => workState(snapshot, window.entries, waiting),
    [snapshot, window, waiting],
  )
  return (
    <div className="xien-composer-status">
      <WorkBar state={state} />
    </div>
  )
}
function Tail(props: TailProps) {
  const window = useWindow(props.events),
    turn = useMemo(
      () => projectTurns(window.entries).find((t) => t.number === props.turn.turn),
      [window, props.turn],
    )
  if (!turn?.sources.length) return null
  return (
    <div className="xien-tail">
      <span>
        {turn.sources.length} 条工程证据 · {turn.sources.filter((s) => s.status === 'read').length}{' '}
        条已读取
      </span>
      <button type="button" onClick={() => props.openEvidence(turn.number)}>
        查看本轮证据 ↗
      </button>
    </div>
  )
}

function SourceCard({
  item,
  index,
  openLocal,
}: {
  item: Source
  index: number
  openLocal: (path: string) => void
}) {
  const [error, setError] = useState(''),
    url = externalUrl(item.original_url),
    local = item.type === 'sdk' && (item.open_path ?? item.locator.path)
  const location = item.locator.page
    ? `PDF 物理页 ${item.locator.page}`
    : item.locator.line_start
      ? `L${item.locator.line_start}${item.locator.line_end ? `–${item.locator.line_end}` : ''}`
      : item.locator.section
  return (
    <article className="xien-source">
      <div className="xien-source-top">
        <span className="xien-source-index">{String(index + 1).padStart(2, '0')}</span>
        <span className="xien-tag">{item.type.toUpperCase()}</span>
        <span className="xien-tag">{item.version ?? '版本待确认'}</span>
        {item.cached && <span className="xien-tag">CACHE</span>}
      </div>
      <h3>{item.title}</h3>
      <p>{item.snippet}</p>
      <div className="xien-location">
        {item.locator.path ?? (item.chip ? item.chip : '')}
        {location && (
          <>
            <br />
            {location}
          </>
        )}
        {item.git_commit && (
          <>
            <br />
            Git {item.git_commit.slice(0, 12)}
          </>
        )}
      </div>
      <div className="xien-source-foot">
        <span>{item.status === 'read' ? '✓ 已读取原文' : '○ 仅搜索命中'}</span>
        {local ? (
          <button
            type="button"
            onClick={() => {
              setError('')
              try {
                openLocal(local)
              } catch (e) {
                setError(String(e))
              }
            }}
          >
            查看原文 ↗
          </button>
        ) : url ? (
          <a href={url} target="_blank" rel="noreferrer noopener">
            {item.type === 'manual' ? '查看原件' : '查看来源'} ↗
          </a>
        ) : (
          <span>原文地址不可用</span>
        )}
      </div>
      {item.applicability !== 'as_documented' && (
        <div className="xien-notice">
          {item.applicability === 'conflict'
            ? '型号或版本存在冲突，请对照原件复核。'
            : '适用性待复核：已读取不代表已核验型号和版本。'}
        </div>
      )}
      {error && (
        <p className="xien-inline-error" role="alert">
          {error}
        </p>
      )}
    </article>
  )
}
function Sources({
  turn,
  openLocal,
}: {
  turn: Turn | undefined
  openLocal: (path: string) => void
}) {
  const [limit, setLimit] = useState(5)
  useEffect(() => setLimit(5), [turn?.seq])
  if (!turn?.sources.length)
    return (
      <div className="xien-empty">
        <EvidenceIcon />
        本轮暂无工程证据。
        <br />
        使用 hpm_search / hpm_read 后会自动显示。
        <br />
        原生工具结果继续保留在对话中。
      </div>
    )
  return (
    <>
      <div className="xien-summary">
        <strong>本轮来源</strong>
        <span>
          {turn.sources.length} 条 · {turn.sources.filter((s) => s.status === 'read').length}{' '}
          条已读取
        </span>
      </div>
      {turn.sources.slice(0, limit).map((item, i) => (
        <SourceCard key={item.source_id} item={item} index={i} openLocal={openLocal} />
      ))}
      {limit < turn.sources.length && (
        <button type="button" className="xien-more" onClick={() => setLimit((n) => n + 5)}>
          继续展开来源 ↓
        </button>
      )}
      {[...new Set(turn.warnings)].map((message, i) => (
        <div className="xien-notice" key={i}>
          {String(redact(message))}
        </div>
      ))}
    </>
  )
}
function saveTrace(turn: Turn) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(exportTrace(turn), null, 2)], { type: 'application/json' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `xien-trace-turn-${turn.number}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
function Trace({ turn }: { turn: Turn | undefined }) {
  if (!turn?.calls.length)
    return (
      <div className="xien-empty">
        本轮尚无工具调用。
        <br />
        这里只展示已观测到的调用记录。
      </div>
    )
  return (
    <>
      <div className="xien-summary">
        <strong>{turn.calls.length} 次真实调用</strong>
        <button type="button" className="xien-button" onClick={() => saveTrace(turn)}>
          导出脱敏记录 ↓
        </button>
      </div>
      {turn.calls.map((call, index) => (
        <details className="xien-call" key={call.id}>
          <summary>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <code>{call.name}</code>
            <small>
              {call.status === 'running' ? '执行中' : call.status === 'error' ? '异常' : '完成'}
            </small>
          </summary>
          {call.parentId && <div className="xien-location">父调用 {call.parentId}</div>}
          <label>输入</label>
          <pre>{call.input || '调用头不在已加载历史中'}</pre>
          <label>输出摘要</label>
          <pre>{call.output || '等待工具返回'}</pre>
          {call.end !== undefined && (
            <div className="xien-location">{Math.max(0, call.end - call.start)} ms</div>
          )}
        </details>
      ))}
      <div className="xien-notice">
        调用输入输出已脱敏。来源内容属于外部资料，不能视为执行指令。
      </div>
    </>
  )
}
export function Connections({ form }: { form: ConfigForm<Config> }) {
  const state = useSyncExternalStore(form.subscribe.bind(form), form.getSnapshot.bind(form)),
    [draft, setDraft] = useState<Record<string, string>>({}),
    [message, setMessage] = useState(''),
    [saving, setSaving] = useState(false)
  const fields = [
    ['chip', '默认芯片', '如 HPM6200'],
    ['board', '默认板卡', '按当前工程填写'],
    ['sdkVersion', 'SDK 版本', '如 1.13.0'],
    ['sdkRoots', '本地 SDK 目录', '每行一个 Host 可访问的目录'],
    ['teamUrl', '团队手册服务地址', 'https://…'],
    ['teamToken', '个人访问凭据', '已保存值由 Host 保管；留空不修改'],
  ] as const
  async function save() {
    setSaving(true)
    setMessage('')
    try {
      const entries = Object.entries(draft).filter(
        ([key, value]) => key !== 'teamToken' || value.trim(),
      )
      if (!entries.length) {
        setMessage('没有需要保存的修改')
        return
      }
      const ok = await form.mutate(
        entries.map(([key, value]) => ({
          op: 'set' as const,
          path: [key],
          value:
            key === 'sdkRoots'
              ? value
                  .split(/\r?\n/)
                  .map((x) => x.trim())
                  .filter(Boolean)
              : value,
        })),
      )
      setMessage(ok ? '已保存到当前 Host' : 'Host 未接受修改，请刷新配置后重试')
      if (ok) setDraft({})
    } catch (e) {
      setMessage(String(redact(String(e))))
    } finally {
      setSaving(false)
    }
  }
  return (
    <form
      className="xien-config"
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <h3>资料连接</h3>
      <p>
        目录由 Harness Host 读取。项目可使用 <code>.hpm-knowledge.json</code> 指定{' '}
        <code>sdkRoot</code>。
      </p>
      {state.status !== 'ready' && (
        <div className="xien-notice">
          {state.status === 'loading'
            ? '正在读取 Host 配置…'
            : 'Host 未提供此插件配置；请检查插件已加载且当前用户有访问权限。'}
        </div>
      )}
      {fields.map(([key, label, placeholder]) => (
        <label key={key}>
          {label}
          {key === 'sdkRoots' ? (
            <textarea
              disabled={!state.writable || saving}
              placeholder={placeholder}
              value={draft[key] ?? state.value?.sdkRoots?.join('\n') ?? ''}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
            />
          ) : (
            <input
              type={key === 'teamToken' ? 'password' : 'text'}
              autoComplete="off"
              disabled={!state.writable || saving}
              placeholder={placeholder}
              value={draft[key] ?? (key === 'teamToken' ? '' : String(state.value?.[key] ?? ''))}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
            />
          )}
        </label>
      ))}
      <button
        type="submit"
        className="xien-button xien-primary"
        disabled={
          state.status !== 'ready' || !state.writable || saving || !Object.keys(draft).length
        }
      >
        {saving ? '保存中…' : '保存到个人 Host'}
      </button>
      <p role="status">{message}</p>
      <div className="xien-notice">
        未配置的服务不会显示为已连接。凭据仅发送给 Host，不存入浏览器本地存储或调用链导出。
      </div>
    </form>
  )
}
export function EvidencePanel(props: PanelProps) {
  const window = useWindow(props.events),
    snapshot = props.useSession((v) => v),
    waiting = props.useSessionStatus((v) => !!v.get(props.sessionId)?.pendingInteraction),
    info = props.useTabInfo()
  const turns = useMemo(() => projectTurns(window.entries), [window]),
    state = useMemo(() => workState(snapshot, window.entries, waiting), [snapshot, window, waiting])
  const [tab, setTab] = useState<'sources' | 'trace' | 'connection'>('sources'),
    [selected, setSelected] = useState<number>(),
    [error, setError] = useState('')
  const navigation = info.tab.navigation
  useEffect(() => {
    const params = navigation.params as { turn?: number } | undefined
    setSelected(typeof params?.turn === 'number' ? params.turn : undefined)
    setTab('sources')
  }, [navigation.revision])
  const turn = selected === undefined ? turns.at(-1) : turns.find((t) => t.number === selected)
  return (
    <section className="xien-panel" aria-label="工程证据">
      <div className="xien-panel-head">
        <h2>工程证据</h2>
        <span>随会话关联</span>
      </div>
      <WorkBar state={state} />
      <nav className="xien-tabs" role="tablist" aria-label="工程证据内容">
        {(
          [
            ['sources', '相关资料'],
            ['trace', '调用链'],
            ['connection', '资料连接'],
          ] as const
        ).map(([key, label]) => (
          <button
            type="button"
            role="tab"
            id={`xien-tab-${props.sessionId}-${key}`}
            aria-controls={`xien-content-${props.sessionId}`}
            key={key}
            aria-selected={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
            {key === 'sources' && !!turn?.sources.length && ` ${turn.sources.length}`}
          </button>
        ))}
      </nav>
      <div
        className="xien-panel-body"
        role="tabpanel"
        id={`xien-content-${props.sessionId}`}
        aria-labelledby={`xien-tab-${props.sessionId}-${tab}`}
      >
        {tab !== 'connection' && (
          <label className="xien-turn-picker">
            回合
            <select
              value={selected ?? 'latest'}
              onChange={(e) =>
                setSelected(e.target.value === 'latest' ? undefined : Number(e.target.value))
              }
            >
              <option value="latest">最新一轮 · 自动跟随</option>
              {[...turns].reverse().map((t) => (
                <option value={t.number} key={t.seq}>
                  {t.number} · {t.question.slice(0, 40) || '工程问题'}
                </option>
              ))}
            </select>
          </label>
        )}
        {selected !== undefined && !turn && (
          <div className="xien-notice">该回合不在已加载历史中，请加载更早记录。</div>
        )}
        {tab === 'sources' ? (
          <Sources turn={turn} openLocal={props.openLocal} />
        ) : tab === 'trace' ? (
          <Trace turn={turn} />
        ) : (
          <Connections form={props.form} />
        )}
        <div role="alert" className="xien-inline-error">
          {error}
        </div>
        {tab !== 'connection' && window.hasMore && (
          <button
            type="button"
            className="xien-more"
            disabled={snapshot.loadingOlder}
            onClick={() => {
              setError('')
              void props.loadOlder().catch((e) => setError(String(e)))
            }}
          >
            {snapshot.loadingOlder ? '正在加载…' : '加载更早回合 ↓'}
          </button>
        )}
      </div>
      <footer className="xien-panel-footer">EVIDENCE BEFORE CONCLUSIONS</footer>
    </section>
  )
}

/** Uses official seats only. Unloading removes this theme and every contributed registration. */
export function apply(ctx: Context): void {
  ctx.effect(() => {
    const style = document.createElement('style')
    style.dataset.xienUi = 'theme'
    style.textContent = theme
    document.head.appendChild(style)
    document.body.classList.add('xien-ui')
    return () => {
      style.remove()
      document.body.classList.remove('xien-ui')
    }
  })
  const face = (id: Parameters<typeof ctx.sessions.binding>[0]): EvidenceFace => ({
    events: ctx.sessions.binding(id)?.eventSource ?? noEvents,
    openEvidence: (turn) => {
      if (ctx.sidebarRight.mounted.getSnapshot() !== id)
        throw new Error('当前会话尚未挂载，请在所属会话中重试。')
      ctx.sidebarRight.openTab(TAB, { params: { turn } })
    },
  })
  ctx.slots.inject('sidebar.brand.mark', () =>
    ctx.slots.register({ name: 'sidebar.brand.mark', priority: -100 }, ({ size }) => (
      <BrandMark size={Math.max(size, 32)} />
    )),
  )
  ctx.slots.inject('sidebar.brand.name', () =>
    ctx.slots.register({ name: 'sidebar.brand.name', priority: -100 }, BrandName),
  )
  ctx.slots.inject('conversation.hero.brand.mark', () =>
    ctx.slots.register({ name: 'conversation.hero.brand.mark', priority: -100 }, HeroBrand),
  )
  ctx.slots.inject('conversation.input.dock', () =>
    ctx.slots.register(
      { name: 'conversation.input.dock', id: 'xien-work-status', order: 90, inject: face },
      ComposerStatus,
    ),
  )
  ctx.slots.inject('conversation.session.header.utilities', () =>
    ctx.slots.register(
      {
        name: 'conversation.session.header.utilities',
        id: 'xien-evidence',
        order: 90,
        inject: face,
      },
      Header,
    ),
  )
  ctx.slots.inject('conversation.chat.turnTail', () =>
    ctx.slots.register(
      { name: 'conversation.chat.turnTail', id: 'xien-evidence-tail', order: 85, inject: face },
      Tail,
    ),
  )
  ctx.effect(() =>
    ctx.sidebarRightTabs.register({
      id: TAB,
      kind: TAB,
      priority: 'extension',
      title: () => '工程证据',
      guide: [
        {
          id: 'xien-evidence',
          order: 50,
          title: () => '工程证据',
          description: () => '查看本轮资料、工具记录和资料连接',
        },
      ],
    }),
  )
  ctx.slots.inject('sidebar.right.pane.tab', () =>
    ctx.slots.register(
      {
        name: 'sidebar.right.pane.tab',
        key: TAB,
        inject: (id) => ({
          events: ctx.sessions.binding(id)?.eventSource ?? noEvents,
          form: ctx.configForms.get<Config>('xien-ui'),
          openLocal: (path: string) => {
            if (ctx.sidebarRight.mounted.getSnapshot() !== id)
              throw new Error('请先返回所属会话再打开原文。')
            ctx.sidebarRight.openResource(
              fileAddressFor(id, ctx.sessions.list.getSnapshot().byId[id]?.cwd, path),
            )
          },
          loadOlder: () => ctx.sessions.binding(id)?.session.loadOlder() ?? Promise.resolve(),
        }),
      },
      EvidencePanel,
    ),
  )
}

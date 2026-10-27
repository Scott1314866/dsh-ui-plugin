import { test } from 'node:test'
import assert from 'node:assert/strict'
import { projectTurns, workState, externalUrl, exportTrace } from '../src/model.ts'
import type { Lifecycle, WindowEntry } from '../src/model.ts'

const state: Lifecycle = {
  running: false,
  openState: 'open',
  removed: false,
  pendingSubmissions: [],
  awaitingFirstTurn: false,
  promptError: null,
  lastAgentError: null,
}
const event = (seq: number, type: string, data: unknown): WindowEntry => ({
  type: 'event',
  event: { seq, type, time: seq * 1000, data },
})
const start = event(1, 'turn/start', { turn: 1 })
const source = {
  source_id: 'sdk:v1:path',
  type: 'sdk',
  title: 'DMA example',
  original_url: 'hpm-source:abc',
  version: '1.13.0',
  status: 'search_hit',
  applicability: 'unconfirmed',
  locator: { path: 'samples/dma/main.c' },
  snippet: 'DMA',
}
test('real lifecycle is authoritative; no timer creates completion', () => {
  assert.equal(workState(state, []).phase, 'ready')
  assert.equal(workState({ ...state, openState: 'loading' }, []).phase, 'loading')
  assert.equal(workState({ ...state, running: true }, [start]).phase, 'working')
  assert.equal(workState(state, [start]).phase, 'ready')
  assert.equal(workState({ ...state, pendingSubmissions: [{}] }, []).phase, 'sending')
  assert.equal(workState({ ...state, running: true }, [start], true).phase, 'waiting')
  assert.equal(workState({ ...state, openState: 'error' }, []).phase, 'error')
  assert.equal(
    workState({ ...state, promptError: { op: 'stop' }, running: true }, [start]).busy,
    true,
  )
})
test('completed, cancelled, failed, blocked and interrupted history survive replay', () => {
  for (const [kind, phase] of [
    ['completed', 'completed'],
    ['aborted', 'stopped'],
    ['error', 'error'],
    ['blocked', 'waiting'],
    ['max-tokens', 'error'],
    ['interrupted', 'interrupted'],
    ['forked', 'interrupted'],
  ] as const) {
    assert.equal(
      workState(state, [start, event(4, 'turn/end', { turn: 1, reason: { kind } })]).phase,
      phase,
    )
  }
})
test('parallel and nested tools remain active until every corresponding result arrives', () => {
  const entries = [
    start,
    event(2, 'tool/call', { turn: 1, callId: 'a', name: 'hpm_search', arguments: {} }),
    event(3, 'tool/ptc-dispatch-start', {
      turn: 1,
      subCallId: 'b',
      parentCallId: 'a',
      name: 'hpm_read',
      arguments: {},
    }),
  ]
  let work = workState({ ...state, running: true }, entries)
  assert.equal(work.phase, 'reading')
  assert.match(work.detail, /2 项并行/)
  entries.push(
    event(4, 'tool/ptc-dispatch', {
      turn: 1,
      subCallId: 'b',
      content: [{ type: 'text', text: 'done' }],
    }),
  )
  assert.equal(workState({ ...state, running: true }, entries).phase, 'searching')
  entries.push(
    event(5, 'tool/result', {
      turn: 1,
      message: { toolCallId: 'a', content: [{ type: 'text', text: 'done' }] },
    }),
  )
  assert.equal(workState({ ...state, running: true }, entries).phase, 'answering')
  assert.equal(projectTurns(entries)[0]?.calls[1]?.parentId, 'a')
})
test('current running turn does not inherit previous completed calls', () => {
  const entries = [
    start,
    event(2, 'tool/call', { turn: 1, callId: 'a', name: 'hpm_search' }),
    event(3, 'turn/end', { turn: 1, reason: { kind: 'completed' } }),
  ]
  assert.equal(workState({ ...state, running: true }, entries).phase, 'working')
})
test('source dedup upgrades read status, retains version/locator, isolates turns and ignores malformed metadata', () => {
  const entries = [
    start,
    event(2, 'tool/result', {
      turn: 1,
      name: 'hpm_search',
      message: { toolCallId: 's' },
      meta: { sources: [source, { ...source, source_id: undefined }] },
    }),
    event(3, 'tool/result', {
      turn: 1,
      name: 'hpm_read',
      message: { toolCallId: 'r' },
      meta: {
        sources: [
          {
            ...source,
            status: 'read',
            locator: { path: 'samples/dma/main.c', line_start: 12, line_end: 22 },
          },
        ],
      },
    }),
    event(4, 'turn/end', { turn: 1, reason: { kind: 'completed' } }),
    event(5, 'turn/start', { turn: 2 }),
  ]
  const turns = projectTurns(entries)
  assert.equal(turns[0]?.sources.length, 1)
  assert.equal(turns[0]?.sources[0]?.status, 'read')
  assert.equal(turns[0]?.sources[0]?.locator.line_start, 12)
  assert.equal(turns[0]?.sources[0]?.version, '1.13.0')
  assert.equal(turns[1]?.sources.length, 0)
})
test('partial history preserves evidence instead of discarding a loaded tail', () => {
  const turns = projectTurns([
    event(9, 'tool/result', {
      turn: 3,
      message: { toolCallId: 'missing' },
      meta: { sources: [source] },
    }),
  ])
  assert.equal(turns[0]?.sources.length, 1)
  assert.match(turns[0]!.question, /尚未加载/)
})
test('export contains observable tool events, strips secrets and never contains assistant reasoning', () => {
  const entries = [
    start,
    event(2, 'assistant/message', {
      turn: 1,
      message: { content: [{ type: 'thinking', thinking: 'private reasoning must never export' }] },
    }),
    event(3, 'tool/call', {
      turn: 1,
      callId: 'a',
      name: 'hpm_read',
      arguments: { token: 'abc', authorization: 'Bearer secret', query: 'demo' },
    }),
    event(4, 'tool/result', {
      turn: 1,
      message: {
        toolCallId: 'a',
        content: [{ type: 'text', text: 'https://a.test?token=secret me@example.com' }],
      },
      meta: { sources: [] },
    }),
  ]
  const exported = JSON.stringify(exportTrace(projectTurns(entries)[0]!))
  assert.ok(!exported.includes('secret'))
  assert.ok(!exported.includes('private reasoning'))
  assert.ok(!exported.includes('me@example.com'))
  assert.match(exported, /REDACTED/)
})
test('untrusted links cannot execute scripts or leak URL credentials', () => {
  assert.equal(externalUrl('javascript:alert(1)'), undefined)
  assert.equal(externalUrl('data:text/html,test'), undefined)
  assert.equal(externalUrl('https://user:password@example.com'), undefined)
  assert.equal(externalUrl('https://example.com/doc'), 'https://example.com/doc')
})

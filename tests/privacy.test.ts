import { test } from 'node:test'
import assert from 'node:assert/strict'
import { privateQuestion, privateInvocation } from '../src/privacy.ts'
import { Engine } from '../src/engine.ts'

test('explicit private user context survives query rewriting without treating hardware internal clocks as confidential', () => {
  assert.equal(privateQuestion('团队内部未导入的保密板卡 Xien-Z UART 接线是什么？'), true)
  assert.equal(privateQuestion('ADC 内部时钟源和内部 RAM 怎么配置？'), false)
  assert.equal(privateQuestion('Read the confidential board schematic'), true)
  assert.equal(
    privateInvocation([
      { type: 'turn/start', data: {} },
      {
        type: 'user/message',
        data: {
          source: { kind: 'user' },
          content: [{ type: 'text', text: '团队内部的板卡 UART' }],
        },
      },
    ]),
    true,
  )
  assert.equal(
    privateInvocation([
      { type: 'turn/start', data: {} },
      { type: 'tool/result', data: { text: 'confidential board' } },
      {
        type: 'user/message',
        data: { source: { kind: 'user' }, content: [{ type: 'text', text: 'ADC 内部时钟' }] },
      },
    ]),
    false,
  )
  const prior = {
    type: 'user/message',
    data: { source: { kind: 'user' }, content: [{ type: 'text', text: '团队内部的板卡 UART' }] },
  }
  assert.equal(
    privateInvocation([
      prior,
      { type: 'turn/start', data: {} },
      {
        type: 'user/message',
        data: {
          source: { kind: 'user' },
          content: [{ type: 'text', text: '刚才的板卡 TX 怎么配置？' }],
        },
      },
    ]),
    true,
  )
  assert.equal(
    privateInvocation([
      prior,
      { type: 'turn/start', data: {} },
      {
        type: 'user/message',
        data: {
          source: { kind: 'user' },
          content: [{ type: 'text', text: '接下来是独立的公开资料问题：UART 官方文档' }],
        },
      },
    ]),
    false,
  )
})
test('private default-all searches cannot reach KB or SDK network fallback even when rewritten query omits private marker', async () => {
  let requests = 0
  const network: typeof fetch = async () => {
    requests++
    throw Error('public leak')
  }
  const web = {
    search: async () => {
      requests++
      throw Error('public provider leak')
    },
    fetch: async () => {
      requests++
      throw Error('public provider leak')
    },
  }
  const engine = new Engine({ sdkVersion: '1.13.0' }, web, network, true)
  const result = await engine.search(
    { query: 'Xien-Z UART 接线' },
    undefined,
    AbortSignal.timeout(10000),
  )
  assert.equal(requests, 0)
  assert.equal(result.external_searches, 0)
  assert.ok(result.warnings.some((w) => w.includes('Private context')))
  const kb = await engine.search(
    { query: 'Xien-Z', type: 'kb', visibility: 'public' },
    undefined,
    AbortSignal.timeout(10000),
  )
  assert.equal(requests, 0)
  assert.equal(kb.status, 'unavailable')
  const id = 'web:kb:' + Buffer.from('https://kb.hpmicro.com/article').toString('base64url')
  const read = await engine.read({ source_id: id }, undefined, AbortSignal.timeout(10000))
  assert.equal(read.status, 'unavailable')
  assert.equal(requests, 0)
})
test('explicit private tool argument is enforced without requiring a Host session', async () => {
  let requests = 0
  const network: typeof fetch = async () => {
    requests++
    throw Error('must not reach public network')
  }
  const result = await new Engine({}, undefined, network).search(
    { query: 'board wiring', type: 'kb', visibility: 'private' },
    undefined,
    AbortSignal.timeout(10000),
  )
  assert.equal(result.status, 'unavailable')
  assert.equal(requests, 0)
})

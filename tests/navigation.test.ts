import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openSourceFile } from '../src/navigation.ts'

test('global-panel file opening waits for native Session sidebar adoption', async () => {
  let selected = '',
    frames = 0,
    attempts = 0,
    opened = ''
  await openSourceFile(
    {
      selectSession: (id) => {
        selected = id
      },
      mountedSession: () => (frames >= 2 ? selected : undefined),
      nextFrame: async () => {
        frames++
      },
      openFile: (path) => {
        attempts++
        if (attempts === 1) throw new Error('sidebarRight: no session surface is mounted')
        opened = path
      },
    },
    'historical-session',
    '/sdk/uart.c',
  )
  assert.equal(selected, 'historical-session')
  assert.equal(opened, '/sdk/uart.c')
  assert.equal(attempts, 2)
})
test('file-opening errors other than lifecycle races are not retried', async () => {
  let attempts = 0
  await assert.rejects(
    openSourceFile(
      {
        selectSession: () => {},
        mountedSession: () => 's',
        nextFrame: async () => {},
        openFile: () => {
          attempts++
          throw new Error('resource denied')
        },
      },
      's',
      '/private.c',
    ),
    /resource denied/,
  )
  assert.equal(attempts, 1)
})

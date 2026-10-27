import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Context } from '@deepseek-ai/cordis'
import Tools, { defineTool } from '@deepseek-ai/dsh-tools'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import Skills from '@deepseek-ai/dsh-skill'
import * as plugin from '../src/index.ts'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

test('real Harness registries retain native tools on activation and disposal; skill references load', async () => {
  const ctx = new Context()
  const prompt = await ctx.plugin(SystemPrompt, {})
  const tools = await ctx.plugin(Tools, {})
  const skills = await ctx.plugin(Skills, {})
  // The real WorkingDirectory requires a filesystem and projection stack. This
  // registration test never executes a tool; provide just its unavailable-call seam.
  const cwd = await ctx.plugin((scope: Context) =>
    scope.reflect.provide('workingDirectory', {
      ensure: () => {
        throw new Error('Not used by registration test')
      },
    }),
  )
  const native = defineTool({
    name: 'web_search',
    description: 'native fixture',
    parameters: {},
    output: { schema: { type: 'json' }, render: () => [] },
    execute: async () => ({ native: true }),
  })
  const registration = await ctx.plugin({
    inject: ['tools'],
    apply: (scope: Context) => scope.tools.register(native),
  })
  const mounted = await ctx.plugin(plugin, {})
  try {
    assert.equal(ctx.tools.get('web_search'), native)
    assert.ok(ctx.tools.get('hpm_search'))
    assert.ok(ctx.tools.get('hpm_read'))
    const skill = await ctx.skills.get('hpm-knowledge')
    assert.ok(skill?.content.includes('hpm_read'))
    assert.equal(skill?.resourceBase?.kind, 'directory')
    if (skill?.resourceBase?.kind === 'directory')
      assert.match(
        await readFile(join(skill.resourceBase.path, 'references/evidence-rules.md'), 'utf8'),
        /Physical PDF pages/,
      )
    await mounted.dispose()
    assert.equal(ctx.tools.get('web_search'), native)
    assert.equal(ctx.tools.get('hpm_search'), undefined)
    assert.equal(await ctx.skills.get('hpm-knowledge'), undefined)
  } finally {
    await mounted.dispose()
    await registration.dispose()
    await cwd.dispose()
    await skills.dispose()
    await tools.dispose()
    await prompt.dispose()
  }
})

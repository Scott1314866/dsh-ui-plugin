/** Explicit confidentiality markers, not hardware phrases such as 内部时钟. */
export function privateQuestion(text: string): boolean {
  return /(?:团队|公司|我司|客户|部门).{0,12}(?:内部|保密|机密)|(?:内部|保密|机密).{0,12}(?:板卡|原理图|文档|资料|接线)|\b(?:private|confidential|proprietary)\s+(?:board|schematic|document|team|project)|\binternal\s+(?:team|board|document|schematic)/i.test(
    text,
  )
}
/** Only actual user messages supply privacy context; never source or thinking text. */
export function privateInvocation(events: readonly { type: string; data: unknown }[]): boolean {
  let confidential = false
  for (const event of events) {
    if (event.type !== 'user/message') continue
    const data = event.data as {
      source?: { kind?: string }
      content?: { type: string; text?: string }[]
    }
    if (data.source?.kind !== 'user') continue
    const text =
      data.content
        ?.filter((part) => part.type === 'text')
        .map((part) => part.text ?? '')
        .join('\n') ?? ''
    if (privateQuestion(text)) confidential = true
    else if (
      /(?:接下来|下面|现在).{0,8}(?:独立的公开资料问题|仅查询公开资料)|\bnew independent public question\b/i.test(
        text,
      )
    )
      confidential = false
  }
  return confidential
}

/** Global panels must first reveal a Conversation before its native viewer exists. */
export async function openSourceFile(
  port: {
    selectSession: (id: string) => void
    mountedSession: () => string | undefined
    nextFrame: () => Promise<void>
    openFile: (path: string) => void
  },
  sessionId: string,
  path: string,
): Promise<void> {
  port.selectSession(sessionId)
  for (let frame = 0; frame < 120; frame++) {
    await port.nextFrame()
    if (port.mountedSession() !== sessionId) continue
    try {
      port.openFile(path)
      return
    } catch (error) {
      // Selection is published before React adopts the Session's sidebar store.
      // Retry only that lifecycle race; resource/permission errors stay visible.
      if (!(error instanceof Error) || !error.message.includes('no session surface is mounted'))
        throw error
    }
  }
  throw new Error('所属会话的原文查看器尚未就绪，请从会话中的相关资料重试。')
}

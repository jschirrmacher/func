export enum LogLevel {
  debug = "debug",
  info = "info",
  warn = "warn",
  error = "error",
}

export type Logger = Record<LogLevel, (msg: unknown) => void>
type MessageMatcher = (level: LogLevel, msg: unknown) => boolean

export function getMockLogger() {
  const messages = {} as Record<LogLevel, unknown[]>
  const expectedMessages = [] as MessageMatcher[]

  function log(level: LogLevel) {
    return (msg: unknown) => {
      const index = expectedMessages.findIndex(e => e(level, msg))
      if (index === -1) {
        console.log(`Unexpected message`, { level, msg })
        messages[level] = (messages[level] || []).concat(msg)
      } else {
        expectedMessages.splice(index, 1)
      }
    }
  }

  function expect(func: MessageMatcher) {
    expectedMessages.push(func)
  }

  function reset() {
    Object.keys(messages).forEach(level => (messages[level as LogLevel] = []))
  }

  function noMessages() {
    return Object.fromEntries(Object.entries(messages).filter(([_, messages]) => messages.length))
  }

  return {
    messages,
    reset,
    expect,
    noMessages,

    debug: log(LogLevel.debug),
    info: log(LogLevel.info),
    warn: log(LogLevel.warn),
    error: log(LogLevel.error),
  }
}

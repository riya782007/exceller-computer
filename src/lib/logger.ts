type LogLevel = 'info' | 'warn' | 'error'

interface LogFields {
  [key: string]: unknown
}

function write(level: LogLevel, message: string, fields?: LogFields): void {
  const payload = {
    level,
    message,
    ts: new Date().toISOString(),
    ...fields,
  }

  if (level === 'error') {
    console.error(JSON.stringify(payload))
    return
  }
  if (level === 'warn') {
    console.warn(JSON.stringify(payload))
    return
  }
  if (process.env.NODE_ENV !== 'production') {
    console.warn(JSON.stringify(payload))
  }
}

export const logger = {
  info(message: string, fields?: LogFields): void {
    write('info', message, fields)
  },
  warn(message: string, fields?: LogFields): void {
    write('warn', message, fields)
  },
  error(message: string, fields?: LogFields): void {
    write('error', message, fields)
  },
}

export function redactPhone(phone: string): string {
  if (phone.length < 4) return '****'
  return `${phone.slice(0, 2)}****${phone.slice(-2)}`
}

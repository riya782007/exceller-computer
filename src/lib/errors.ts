export class AppError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code = 'INTERNAL_ERROR', status = 500) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
  }
}

export function toUserMessage(error: unknown, fallback: string): string {
  if (error instanceof AppError) {
    return error.message
  }
  return fallback
}

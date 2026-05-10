export const classifyReplayError = ({ error, isAuthError }) => {
  if (isAuthError?.(error)) return { action: 'auth_expired', retryable: false }
  const status = Number(error?.status || error?.statusCode || 0)
  if ([409, 422].includes(status)) return { action: 'quarantine', retryable: false }
  if (status >= 400 && status < 500) return { action: 'drop', retryable: false }
  return { action: 'retry', retryable: true }
}

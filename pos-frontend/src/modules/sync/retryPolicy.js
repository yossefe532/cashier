export const getRetryDelayMs = (retryCount) => {
  const attempt = Math.max(Number(retryCount) || 0, 0)
  const base = 1000
  const cap = 30000
  return Math.min(base * 2 ** attempt, cap)
}

export const withBackoff = async (retryCount) => {
  const delay = getRetryDelayMs(retryCount)
  await new Promise((resolve) => setTimeout(resolve, delay))
}

export const createReconnectManager = ({ onReconnect, intervalMs = 5000 }) => {
  let timer = null

  const runReconnect = async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return
    await onReconnect?.()
  }

  const handleOnline = () => {
    runReconnect()
  }

  const start = () => {
    if (typeof window === 'undefined') return () => {}
    window.addEventListener('online', handleOnline)
    timer = setInterval(() => {
      runReconnect()
    }, intervalMs)
    return () => {
      window.removeEventListener('online', handleOnline)
      if (timer) clearInterval(timer)
      timer = null
    }
  }

  return { start }
}

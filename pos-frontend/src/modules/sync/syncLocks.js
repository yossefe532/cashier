const LOCK_KEY = 'educon-pos-sync-lock-v1'
const DEFAULT_TTL_MS = 12000
const tabId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const now = () => Date.now()

const readLock = () => {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(LOCK_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const writeLock = (lock) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(LOCK_KEY, JSON.stringify(lock))
}

const removeLock = () => {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(LOCK_KEY)
}

export const acquireReplayLock = ({ ttlMs = DEFAULT_TTL_MS } = {}) => {
  if (typeof localStorage === 'undefined') return { acquired: true, owner: tabId, release: () => {} }
  const existing = readLock()
  const current = now()
  if (existing && existing.owner !== tabId && existing.expiresAt > current) {
    return { acquired: false, owner: existing.owner, release: () => {} }
  }
  const next = {
    owner: tabId,
    token: `${tabId}-${current}`,
    acquiredAt: current,
    expiresAt: current + ttlMs,
  }
  writeLock(next)
  const confirmation = readLock()
  const acquired = confirmation?.token === next.token
  return {
    acquired,
    owner: acquired ? tabId : confirmation?.owner,
    token: confirmation?.token || null,
    release: () => {
      const latest = readLock()
      if (latest?.token === next.token) removeLock()
    },
    heartbeat: () => {
      const latest = readLock()
      if (!latest || latest.token !== next.token) return false
      writeLock({ ...latest, expiresAt: now() + ttlMs })
      return true
    },
  }
}

export const getReplayOwner = () => {
  const lock = readLock()
  if (!lock) return null
  if (lock.expiresAt <= now()) return null
  return lock.owner
}

export const getReplayTabId = () => tabId

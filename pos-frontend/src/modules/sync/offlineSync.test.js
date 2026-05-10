import { describe, expect, it, beforeEach, vi } from 'vitest'
import { classifyReplayError } from './conflictResolver'
import { dedupeQueue, createQueueOperation } from './queueManager'
import { getRetryDelayMs } from './retryPolicy'
import { acquireReplayLock } from './syncLocks'

const createMemoryStorage = () => {
  const data = new Map()
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
  }
}

describe('offline sync helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage())
  })

  it('dedupes queue by dedupe key while preserving order', () => {
    const one = createQueueOperation({ type: 'book_upsert', dedupeKey: 'book:1', localId: 1 })
    const two = createQueueOperation({ type: 'book_upsert', dedupeKey: 'book:1', localId: 1 })
    const three = createQueueOperation({ type: 'student_upsert', dedupeKey: 'student:1', localId: 1 })
    const queue = dedupeQueue([one, two, three])
    expect(queue).toHaveLength(2)
    expect(queue[0].dedupeKey).toBe('book:1')
    expect(queue[1].dedupeKey).toBe('student:1')
  })

  it('uses exponential retry delay with cap', () => {
    expect(getRetryDelayMs(0)).toBe(1000)
    expect(getRetryDelayMs(1)).toBe(2000)
    expect(getRetryDelayMs(5)).toBe(30000)
    expect(getRetryDelayMs(10)).toBe(30000)
  })

  it('classifies replay errors for auth and retry handling', () => {
    const auth = classifyReplayError({ error: { message: 'expired' }, isAuthError: () => true })
    const retry = classifyReplayError({ error: { status: 500 }, isAuthError: () => false })
    const quarantine = classifyReplayError({ error: { status: 409 }, isAuthError: () => false })
    expect(auth.action).toBe('auth_expired')
    expect(retry.action).toBe('retry')
    expect(quarantine.action).toBe('quarantine')
  })

  it('prevents duplicate replay ownership lock', () => {
    const first = acquireReplayLock({ ttlMs: 5000 })
    const second = acquireReplayLock({ ttlMs: 5000 })
    expect(first.acquired).toBe(true)
    expect(second.acquired).toBe(true)
    first.release()
  })
})

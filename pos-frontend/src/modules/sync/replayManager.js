import { addReplayFailure, setSyncMetadata } from './indexedDb'
import { acquireReplayLock } from './syncLocks'
import { classifyReplayError } from './conflictResolver'

export const runReplayCycle = async ({
  runReplay,
  isAuthError,
  onAuthExpired,
  queueSnapshot,
}) => {
  const lock = acquireReplayLock()
  if (!lock.acquired) return { skipped: true, reason: 'locked' }
  const startedAt = new Date().toISOString()
  await setSyncMetadata('replay_last_started_at', startedAt)
  try {
    await runReplay()
    await setSyncMetadata('replay_last_success_at', new Date().toISOString())
    return { skipped: false, success: true }
  } catch (error) {
    const resolution = classifyReplayError({ error, isAuthError })
    if (resolution.action === 'auth_expired') onAuthExpired?.()
    await addReplayFailure({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      operationId: queueSnapshot?.[0]?.id || null,
      error: error?.message || 'Replay failed',
      payload: {
        action: resolution.action,
        queueLength: Array.isArray(queueSnapshot) ? queueSnapshot.length : 0,
      },
      createdAt: new Date().toISOString(),
    })
    await setSyncMetadata('replay_last_failure_at', new Date().toISOString())
    return { skipped: false, success: false, resolution }
  } finally {
    lock.release()
  }
}

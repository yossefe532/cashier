const AUTH_STORAGE_KEY = 'educon-pos-auth-v1'
const EXPIRY_SKEW_SECONDS = 30

export class AuthSessionError extends Error {
  constructor(message, code = 'AUTH_ERROR', status = 401) {
    super(message)
    this.name = 'AuthSessionError'
    this.code = code
    this.status = status
    this.authExpired = true
  }
}

const safeJsonParse = (raw) => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const decodeJwtPayload = (token) => {
  const parts = String(token || '').split('.')
  if (parts.length < 2) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    return safeJsonParse(atob(padded))
  } catch {
    return null
  }
}

export const loadAuthState = () => {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null
  const parsed = safeJsonParse(raw)
  if (!parsed || typeof parsed !== 'object') return null
  return parsed
}

export const saveAuthState = (state) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
}

export const clearAuthState = () => {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

const isTokenExpiring = (token) => {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return true
  const now = Math.floor(Date.now() / 1000)
  return Number(payload.exp) <= now + EXPIRY_SKEW_SECONDS
}

const parseErrorDetail = async (response) => {
  try {
    const data = await response.json()
    return data?.detail ? String(data.detail) : `Request failed: ${response.status}`
  } catch {
    return `Request failed: ${response.status}`
  }
}

export const login = async (apiBaseUrl, username, password) => {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!response.ok) {
    const detail = await parseErrorDetail(response)
    throw new Error(detail)
  }
  const data = await response.json()
  const state = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: data.user,
    accessExpiresAt: data.access_expires_at,
    refreshExpiresAt: data.refresh_expires_at,
  }
  saveAuthState(state)
  return state
}

export const logout = async (apiBaseUrl) => {
  const state = loadAuthState()
  const refreshToken = state?.refreshToken
  if (!refreshToken) {
    clearAuthState()
    return
  }
  try {
    await fetch(`${apiBaseUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  } catch {
    // Best effort logout. Local auth is still cleared.
  } finally {
    clearAuthState()
  }
}

export const refreshAuth = async (apiBaseUrl) => {
  const state = loadAuthState()
  if (!state?.refreshToken) {
    throw new AuthSessionError('Session expired', 'AUTH_EXPIRED')
  }
  const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refresh_token: state.refreshToken }),
  })
  if (!response.ok) {
    clearAuthState()
    throw new AuthSessionError('Session expired', 'AUTH_EXPIRED')
  }
  const data = await response.json()
  const nextState = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: data.user,
    accessExpiresAt: data.access_expires_at,
    refreshExpiresAt: data.refresh_expires_at,
  }
  saveAuthState(nextState)
  return nextState
}

export const ensureValidAuth = async (apiBaseUrl) => {
  const state = loadAuthState()
  if (!state?.accessToken) throw new AuthSessionError('Authentication required', 'AUTH_REQUIRED')
  if (!isTokenExpiring(state.accessToken)) return state
  return refreshAuth(apiBaseUrl)
}

export const authorizedApiRequest = async (apiBaseUrl, path, options) => {
  let authState = await ensureValidAuth(apiBaseUrl)
  const headers = { 'content-type': 'application/json', ...(options?.headers || {}) }
  headers.Authorization = `Bearer ${authState.accessToken}`

  let response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })
  if (response.status === 401) {
    authState = await refreshAuth(apiBaseUrl)
    headers.Authorization = `Bearer ${authState.accessToken}`
    response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })
  }
  if (!response.ok) {
    const detail = await parseErrorDetail(response)
    if (response.status === 401 || response.status === 403) {
      throw new AuthSessionError(detail, response.status === 401 ? 'AUTH_EXPIRED' : 'AUTH_FORBIDDEN', response.status)
    }
    const error = new Error(detail)
    error.status = response.status
    throw error
  }
  if (response.status === 204) return null
  return response.json()
}

export const currentAuthUser = () => loadAuthState()?.user || null


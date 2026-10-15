const BASE = process.env.NEXT_PUBLIC_API_URL

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function apiFetch(path, options = {}) {
  const headers = { ...options.headers }
  if (options.body) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers, cache: 'no-store' })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection and try again.')
  }

  if (res.status === 204) return null

  let body = null
  try {
    body = await res.json()
  } catch {
    body = null
  }

  if (!res.ok) {
    const error = body?.error
    throw new ApiError(
      res.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? `Request failed with status ${res.status}`,
      error?.details
    )
  }
  return body
}

export function fieldErrorsFrom(err) {
  const out = {}
  if (Array.isArray(err.details)) {
    for (const item of err.details) {
      if (item.field && !out[item.field]) out[item.field] = item.message
    }
  }
  return out
}
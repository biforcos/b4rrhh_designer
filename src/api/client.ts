import { authStore } from '../auth/authStore'

const BASE_URL = '/api'

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authStore.getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

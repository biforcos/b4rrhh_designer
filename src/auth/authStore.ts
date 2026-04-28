const TOKEN_KEY = 'jwt_token'
const SUBJECT_KEY = 'jwt_subject'
const EXPIRES_KEY = 'jwt_expires_at'

export interface AuthSession {
  token: string
  subject: string
  expiresAt: string
}

export const authStore = {
  save(session: AuthSession) {
    localStorage.setItem(TOKEN_KEY, session.token)
    localStorage.setItem(SUBJECT_KEY, session.subject)
    localStorage.setItem(EXPIRES_KEY, session.expiresAt)
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(SUBJECT_KEY)
    localStorage.removeItem(EXPIRES_KEY)
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  getSubject(): string | null {
    return localStorage.getItem(SUBJECT_KEY)
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem(TOKEN_KEY)
    const expiresAt = localStorage.getItem(EXPIRES_KEY)
    if (!token || !expiresAt) return false
    return new Date(expiresAt) > new Date()
  },
}

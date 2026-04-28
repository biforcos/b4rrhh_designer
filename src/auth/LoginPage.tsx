import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authStore } from './authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dev/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), expiresInMinutes: 480 }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      authStore.save({ token: data.token, subject: data.subject, expiresAt: data.expiresAt })
      navigate('/canvas', { replace: true })
    } catch {
      setError('No se pudo obtener el token. ¿Está el backend arrancado?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-80">
        <div className="text-center mb-8">
          <div className="text-sky-400 text-3xl mb-2">⬡</div>
          <h1 className="text-slate-200 text-lg font-semibold">Payroll Designer</h1>
          <p className="text-slate-500 text-xs mt-1">Entorno local — introduce tu usuario</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="text-slate-400 text-xs block mb-1.5">Usuario</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="bifor"
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-600"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading || !subject.trim()}
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

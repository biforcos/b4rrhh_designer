import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Network, List, ClipboardList, LogOut } from 'lucide-react'
import { authStore } from '../../auth/authStore'
import { ruleSystemsApi } from '../../api/ruleSystemsApi'
import { useRuleSystemStore } from '../../ruleSystemStore'

const NAV_ITEMS = [
  { to: '/canvas', icon: Network, label: 'Canvas' },
  { to: '/objects', icon: List, label: 'Objetos' },
  { to: '/assignments', icon: ClipboardList, label: 'Asignaciones' },
]

export function NavSidebar() {
  const navigate = useNavigate()
  const { ruleSystemCode, setRuleSystemCode } = useRuleSystemStore()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const { data: ruleSystems = [] } = useQuery({
    queryKey: ['rule-systems'],
    queryFn: ruleSystemsApi.list,
  })

  useEffect(() => {
    if (ruleSystems.length === 0) return
    const found = ruleSystems.find(rs => rs.code === ruleSystemCode && rs.active)
    if (!found) {
      const first = ruleSystems.find(rs => rs.active)
      if (first) setRuleSystemCode(first.code)
    }
  }, [ruleSystems, ruleSystemCode, setRuleSystemCode])

  useEffect(() => {
    if (!popoverOpen) return
    function onPointerDown(e: PointerEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [popoverOpen])

  function handleLogout() {
    authStore.clear()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="w-11 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3 gap-1 flex-shrink-0">
      <div className="text-sky-400 text-lg font-bold mb-1">⬡</div>

      {/* Rule system badge */}
      <div ref={popoverRef} className="relative mb-2">
        <button
          type="button"
          title={`Rule system: ${ruleSystemCode}`}
          onClick={() => setPopoverOpen(o => !o)}
          className="w-8 h-6 rounded text-[9px] font-bold bg-sky-950 border border-sky-800 text-sky-300 hover:bg-sky-900 truncate px-1"
        >
          {ruleSystemCode}
        </button>
        {popoverOpen && (
          <div className="absolute left-full top-0 ml-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[160px]">
            <div className="text-[9px] uppercase tracking-widest text-slate-500 px-3 pt-2 pb-1">
              Rule system
            </div>
            {ruleSystems.filter(rs => rs.active).map(rs => (
              <button
                key={rs.code}
                type="button"
                onClick={() => { setRuleSystemCode(rs.code); setPopoverOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-800 flex items-center gap-2 ${
                  rs.code === ruleSystemCode ? 'text-sky-400' : 'text-slate-300'
                }`}
              >
                <span className="font-mono text-[10px] text-slate-500 w-8 shrink-0">{rs.code}</span>
                <span className="truncate">{rs.name}</span>
                {rs.code === ruleSystemCode && <span className="ml-auto text-sky-500 text-[10px]">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          title={label}
          className={({ isActive }) =>
            `w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors ${isActive ? 'bg-sky-950 text-sky-400' : ''}`
          }
        >
          <Icon size={16} />
        </NavLink>
      ))}
      <div className="flex-1" />
      <button
        type="button"
        onClick={handleLogout}
        title={`Cerrar sesión (${authStore.getSubject() ?? ''})`}
        className="w-8 h-8 rounded-md flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-slate-800 transition-colors"
      >
        <LogOut size={16} />
      </button>
    </nav>
  )
}

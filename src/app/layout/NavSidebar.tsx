import { NavLink } from 'react-router-dom'
import { Network, List, ClipboardList, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/canvas', icon: Network, label: 'Canvas' },
  { to: '/objects', icon: List, label: 'Objetos' },
  { to: '/assignments', icon: ClipboardList, label: 'Asignaciones' },
]

export function NavSidebar() {
  return (
    <nav className="w-11 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3 gap-1 flex-shrink-0">
      <div className="text-sky-400 text-lg font-bold mb-3">⬡</div>
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
      <NavLink
        to="/settings"
        title="Ajustes"
        className="w-8 h-8 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-400"
      >
        <Settings size={16} />
      </NavLink>
    </nav>
  )
}

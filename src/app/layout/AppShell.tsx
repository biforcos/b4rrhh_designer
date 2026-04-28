import { Outlet } from 'react-router-dom'
import { NavSidebar } from './NavSidebar'

export function AppShell() {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <NavSidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

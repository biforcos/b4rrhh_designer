import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { objectsApi } from './api/objectsApi'

const RULE_SYSTEM = 'ESP'
type Tab = 'CONSTANT' | 'TABLE'

export function ObjectsPage() {
  const [tab, setTab] = useState<Tab>('CONSTANT')
  const { data = [], isLoading } = useQuery({
    queryKey: ['objects', RULE_SYSTEM, tab],
    queryFn: () => objectsApi.list(RULE_SYSTEM, tab),
  })

  return (
    <div className="p-4">
      <h1 className="text-slate-200 font-semibold mb-4">Objetos de soporte</h1>
      <div className="flex gap-2 mb-4">
        {(['CONSTANT', 'TABLE'] as Tab[]).map(t => (
          <button type="button" key={t} onClick={() => setTab(t)}
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${tab === t ? 'bg-sky-950 border-sky-700 text-sky-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
            {t === 'CONSTANT' ? 'Constantes' : 'Tablas'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-slate-500 text-sm">Cargando...</div>
      ) : (
        <table className="w-full text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="text-slate-500 text-left border-b border-slate-800">
              <th className="pb-2 pr-4">Código</th>
              <th className="pb-2 pr-4">Tipo</th>
              <th className="pb-2 pr-4">Activo</th>
            </tr>
          </thead>
          <tbody>
            {data.map(obj => (
              <tr key={obj.objectCode} className="border-b border-slate-900 hover:bg-slate-900/50">
                <td className="py-2 pr-4 font-mono">{obj.objectCode}</td>
                <td className="py-2 pr-4 text-slate-500">{obj.objectTypeCode}</td>
                <td className="py-2 pr-4">
                  <span className={obj.active ? 'text-green-400' : 'text-slate-600'}>
                    {obj.active ? '✓' : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

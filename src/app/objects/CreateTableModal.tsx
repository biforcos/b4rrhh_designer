import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tableRowsApi } from './api/tableRowsApi'

interface Props {
  ruleSystemCode: string
  onClose: () => void
}

export function CreateTableModal({ ruleSystemCode, onClose }: Props) {
  const qc = useQueryClient()
  const [objectCode, setObjectCode] = useState('')

  const mutation = useMutation({
    mutationFn: () => tableRowsApi.createTable(ruleSystemCode, objectCode.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['objects', ruleSystemCode] })
      onClose()
    },
  })

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4">
        <p className="text-sm font-medium text-slate-200 mb-4">Nueva tabla salarial</p>

        <div className="mb-1">
          <label className="text-[9px] text-slate-500 uppercase tracking-wide">
            Código de tabla *
          </label>
          <input
            autoFocus
            type="text"
            value={objectCode}
            onChange={e => setObjectCode(e.target.value)}
            placeholder="Ej: SB_99002405012025"
            className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-200 font-mono px-2 py-1.5 focus:outline-none focus:border-sky-500"
          />
          <p className="text-[8px] text-slate-600 mt-1">
            Identificador único. Se usará como clave de búsqueda en el motor de cálculo.
          </p>
        </div>

        {mutation.isError && (
          <p className="text-red-400 text-[9px] mt-2">Error al crear la tabla</p>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={mutation.isPending || !objectCode.trim()}
            onClick={() => mutation.mutate()}
            className="text-xs px-3 py-1.5 bg-green-900 border border-green-700 text-green-300 rounded-md hover:bg-green-800 disabled:opacity-50"
          >
            {mutation.isPending ? 'Creando...' : 'Crear tabla'}
          </button>
        </div>
      </div>
    </>
  )
}

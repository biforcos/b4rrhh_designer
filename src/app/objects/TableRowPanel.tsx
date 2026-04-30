import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTableRows } from './useTableRows'
import { tableRowsApi, type TableRowDto } from './api/tableRowsApi'
import { TableRowModal } from './TableRowModal'

interface Props {
  ruleSystemCode: string
  tableCode: string
}

export function TableRowPanel({ ruleSystemCode, tableCode }: Props) {
  const qc = useQueryClient()
  const { data: rows = [], isLoading } = useTableRows(ruleSystemCode, tableCode)
  const [modalRow, setModalRow] = useState<TableRowDto | null | 'new' | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<TableRowDto | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (rowId: number) => tableRowsApi.deleteRow(ruleSystemCode, tableCode, rowId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['table-rows', ruleSystemCode, tableCode] })
      setDeleteTarget(null)
    },
  })

  function formatNum(n: number) {
    return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2 }).format(n)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="text-sm font-semibold text-sky-400 font-mono">{tableCode}</div>
          <div className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wide">{ruleSystemCode} · Tabla salarial</div>
        </div>
        <button
          type="button"
          onClick={() => setModalRow('new')}
          className="text-[10px] px-2.5 py-1 bg-green-950 border border-green-800 text-green-400 rounded hover:bg-green-900"
        >
          + Nueva fila
        </button>
      </div>

      {/* Rows table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-slate-500 text-xs">Cargando...</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-slate-600 text-xs">Sin filas — pulsa "+ Nueva fila" para añadir la primera.</div>
        ) : (
          <table className="w-full text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="text-slate-500 text-left border-b border-slate-800 text-[9px] uppercase tracking-wide">
                <th className="px-4 py-2">Código búsqueda</th>
                <th className="px-2 py-2">Desde</th>
                <th className="px-2 py-2">Hasta</th>
                <th className="px-2 py-2 text-right">Mensual</th>
                <th className="px-2 py-2 text-right">Anual</th>
                <th className="px-2 py-2 text-right">Diario</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-b border-slate-900 hover:bg-slate-900/50">
                  <td className="px-4 py-2 font-mono text-slate-300">{row.searchCode}</td>
                  <td className="px-2 py-2 text-slate-400">{row.startDate}</td>
                  <td className="px-2 py-2 text-slate-600 italic">{row.endDate ?? '—'}</td>
                  <td className="px-2 py-2 text-right text-lime-400">{formatNum(row.monthlyValue)} €</td>
                  <td className="px-2 py-2 text-right text-slate-400">{formatNum(row.annualValue)} €</td>
                  <td className="px-2 py-2 text-right text-slate-400">{formatNum(row.dailyValue)} €</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setModalRow(row)}
                      className="text-slate-500 hover:text-slate-200 mr-3"
                      title="Editar"
                    >✎</button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(row)}
                      className="text-red-900 hover:text-red-400"
                      title="Eliminar"
                    >🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Row modal (create / edit) */}
      {modalRow !== undefined && (
        <TableRowModal
          ruleSystemCode={ruleSystemCode}
          tableCode={tableCode}
          row={modalRow === 'new' ? null : modalRow}
          onClose={() => setModalRow(undefined)}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setDeleteTarget(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-xl">
            <p className="text-slate-200 text-sm font-medium mb-1">¿Eliminar fila?</p>
            <p className="text-slate-500 text-xs font-mono mb-4">{deleteTarget.searchCode} · {deleteTarget.startDate}</p>
            {deleteMutation.isError && (
              <p className="text-red-400 text-[9px] mb-2">Error al eliminar la fila</p>
            )}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)}
                className="text-xs px-3 py-1.5 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-800">
                Cancelar
              </button>
              <button type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="text-xs px-3 py-1.5 bg-red-900 border border-red-700 text-red-200 rounded-md hover:bg-red-800 disabled:opacity-50">
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

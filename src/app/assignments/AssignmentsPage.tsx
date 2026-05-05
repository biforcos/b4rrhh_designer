import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentsApi, type AssignmentDto } from './api/assignmentsApi'
import { useRuleSystemStore } from '../../ruleSystemStore'
import { CreateAssignmentDrawer } from './CreateAssignmentDrawer'
import { EditAssignmentDrawer } from './EditAssignmentDrawer'

export function AssignmentsPage() {
  const { ruleSystemCode } = useRuleSystemStore()
  const qc = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AssignmentDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AssignmentDto | null>(null)

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['assignments', ruleSystemCode],
    queryFn: () => assignmentsApi.list(ruleSystemCode),
  })

  const deleteMutation = useMutation({
    mutationFn: (assignmentCode: string) => assignmentsApi.delete(ruleSystemCode, assignmentCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', ruleSystemCode] })
      setDeleteTarget(null)
    },
  })

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-slate-200 font-semibold">Reglas de asignación</h1>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-700"
        >
          + Asignación
        </button>
      </div>

      {isLoading ? (
        <div className="text-slate-500 text-sm">Cargando...</div>
      ) : isError ? (
        <div className="text-red-400 text-sm font-mono">
          Error al cargar asignaciones: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      ) : (
        <table className="w-full text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="text-slate-500 text-left border-b border-slate-800">
              <th className="pb-2 pr-3">Concepto</th>
              <th className="pb-2 pr-3">Empresa</th>
              <th className="pb-2 pr-3">Convenio</th>
              <th className="pb-2 pr-3">Tipo emp.</th>
              <th className="pb-2 pr-3">Desde</th>
              <th className="pb-2 pr-3">Hasta</th>
              <th className="pb-2 pr-3">Prioridad</th>
              <th className="pb-2" aria-label="Acciones"></th>
            </tr>
          </thead>
          <tbody>
            {data.map(a => (
              <tr key={a.assignmentCode} className="border-b border-slate-900 hover:bg-slate-900/50">
                <td className="py-1.5 pr-3 font-mono text-sky-400">{a.conceptCode}</td>
                <td className="py-1.5 pr-3 text-slate-500">{a.companyCode ?? '*'}</td>
                <td className="py-1.5 pr-3 text-slate-500">{a.agreementCode ?? '*'}</td>
                <td className="py-1.5 pr-3 text-slate-500">{a.employeeTypeCode ?? '*'}</td>
                <td className="py-1.5 pr-3 text-slate-400">{a.validFrom}</td>
                <td className="py-1.5 pr-3 text-slate-400">{a.validTo ?? '—'}</td>
                <td className="py-1.5 pr-3 text-slate-400">{a.priority}</td>
                <td className="py-1.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTarget(a)}
                    className="text-slate-400 hover:text-slate-200 text-[10px]"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(a)}
                    className="text-red-500 hover:text-red-400 text-[10px]"
                  >
                    ⊗
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <CreateAssignmentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ruleSystemCode={ruleSystemCode}
      />
      <EditAssignmentDrawer
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        ruleSystemCode={ruleSystemCode}
        assignment={editTarget}
      />

      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setDeleteTarget(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-slate-900 border border-slate-700 rounded-lg p-5 shadow-xl">
            <p className="text-slate-200 text-sm font-medium mb-1">¿Eliminar asignación?</p>
            <p className="text-slate-500 text-xs mb-4 font-mono">{deleteTarget.conceptCode}</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-xs px-3 py-1.5 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteTarget.assignmentCode)}
                disabled={deleteMutation.isPending}
                className="text-xs px-3 py-1.5 bg-red-700 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

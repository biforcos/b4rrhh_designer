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

  const { data = [], isLoading } = useQuery({
    queryKey: ['assignments', ruleSystemCode],
    queryFn: () => assignmentsApi.list(ruleSystemCode),
  })

  const deleteMutation = useMutation({
    mutationFn: (assignmentCode: string) => assignmentsApi.delete(ruleSystemCode, assignmentCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments', ruleSystemCode] }),
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
                    onClick={() => deleteMutation.mutate(a.assignmentCode)}
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
    </div>
  )
}

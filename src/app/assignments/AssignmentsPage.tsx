import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentsApi } from './api/assignmentsApi'

const RULE_SYSTEM = 'ESP'

export function AssignmentsPage() {
  const qc = useQueryClient()
  const { data = [], isLoading } = useQuery({
    queryKey: ['assignments', RULE_SYSTEM],
    queryFn: () => assignmentsApi.list(RULE_SYSTEM),
  })

  const deleteMutation = useMutation({
    mutationFn: (assignmentCode: string) => assignmentsApi.delete(RULE_SYSTEM, assignmentCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments', RULE_SYSTEM] }),
  })

  return (
    <div className="p-4">
      <h1 className="text-slate-200 font-semibold mb-4">Reglas de asignación</h1>
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
                <td className="py-1.5 pr-3 text-slate-400">{a.priority}</td>
                <td className="py-1.5">
                  <button type="button" onClick={() => deleteMutation.mutate(a.assignmentCode)}
                    className="text-red-500 hover:text-red-400 text-[10px]">⊗</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

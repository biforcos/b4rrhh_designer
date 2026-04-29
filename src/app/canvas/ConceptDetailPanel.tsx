import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { conceptsApi } from './api/conceptsApi'
import { NATURE_LABELS, COMPOSITION_LABELS, SCOPE_LABELS } from './conceptLabels'
import type { ConceptFlowNode, ConceptFlowEdge } from './types'

interface Props {
  node: ConceptFlowNode
  edges: ConceptFlowEdge[]
  ruleSystemCode: string
  onDeleted: () => void
}

export function ConceptDetailPanel({ node, edges, ruleSystemCode, onDeleted }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const qc = useQueryClient()

  const dependentCount = edges.filter(e => e.source === node.id).length
  const hasDependents = dependentCount > 0

  const handleConfirmDelete = () => {
    setIsPending(true)
    setIsError(false)
    const promise = conceptsApi.deleteConcept(ruleSystemCode, node.data.conceptCode)
    promise.then(() => {
      qc.invalidateQueries({ queryKey: ['concepts', ruleSystemCode] })
      setIsPending(false)
      onDeleted()
    }).catch(() => {
      setIsPending(false)
      setIsError(true)
    })
  }

  const d = node.data

  return (
    <aside className="w-52 bg-slate-900 border-l border-slate-800 p-3 text-xs overflow-y-auto flex-shrink-0">
      <div className="font-bold text-sky-400 mb-1">{d.conceptCode} · {d.conceptMnemonic}</div>
      <div className="text-slate-500 text-[9px] mb-3">PayrollConcept</div>
      <div className="space-y-2">
        <Field label="Tipo de cálculo" value={d.calculationType} />
        <Field label="Naturaleza" value={NATURE_LABELS[d.functionalNature] ?? d.functionalNature} />
        <Field label="Composición" value={COMPOSITION_LABELS[d.resultCompositionMode]} />
        <Field label="Ámbito" value={SCOPE_LABELS[d.executionScope]} />
        <Field label="Orden nómina" value={d.payslipOrderCode} />
      </div>
      <hr className="border-slate-800 my-3" />
      {!confirmDelete ? (
        <div>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={hasDependents || isPending}
            className="w-full text-[10px] border border-red-900 text-red-400 rounded px-2 py-1 hover:enabled:bg-red-950 disabled:border-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            🗑 Borrar concepto
          </button>
          {hasDependents && (
            <p className="text-slate-600 text-[9px] text-center mt-1">
              Usado por {dependentCount} {dependentCount === 1 ? 'concepto' : 'conceptos'}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isPending}
            className="w-full text-[10px] bg-red-900 border border-red-700 text-red-200 rounded px-2 py-1 hover:bg-red-800 disabled:opacity-50"
          >
            {isPending ? 'Borrando...' : '⚠ Confirmar borrado'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            disabled={isPending}
            className="w-full text-[10px] border border-slate-700 text-slate-400 rounded px-2 py-1 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <p className="text-slate-600 text-[9px] text-center">Esta acción no se puede deshacer</p>
          {isError && (
            <p className="text-red-400 text-[9px] text-center">Error al borrar el concepto</p>
          )}
        </div>
      )}
    </aside>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-slate-600 text-[9px] uppercase tracking-wide mb-0.5">{label}</div>
      {value != null
        ? <div className="bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{value}</div>
        : <div className="bg-slate-950 text-slate-600 px-1.5 py-0.5 rounded text-[10px] italic">—</div>
      }
    </div>
  )
}

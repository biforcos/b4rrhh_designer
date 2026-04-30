import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HelpCircle } from 'lucide-react'
import { conceptsApi } from './api/conceptsApi'
import { NATURE_LABELS, COMPOSITION_LABELS, SCOPE_LABELS } from './conceptLabels'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import type { ConceptFlowNode, ConceptFlowEdge } from './types'

interface Props {
  node: ConceptFlowNode
  edges: ConceptFlowEdge[]
  ruleSystemCode: string
  onDeleted: () => void
}

const FIELD_TOOLTIPS = {
  calculationType: 'Define cómo se calcula el valor del concepto. DIRECT_AMOUNT: toma el valor de una fuente única (tabla, constante u otro concepto). RATE_BY_QUANTITY: multiplica cantidad × tasa. AGGREGATE: suma varios conceptos. PERCENTAGE: aplica un porcentaje sobre una base. EMPLOYEE_INPUT: valor introducido manualmente por nóminas. JAVA_PROVIDED: calculado por un componente técnico del motor.',
  functionalNature: 'Papel que juega el concepto en la nómina. Los devengos suman al bruto; las deducciones restan; las bases son valores de referencia; los totales y el líquido son conceptos derivados de cierre.',
  resultCompositionMode: 'Cómo se combina el resultado cuando hay múltiples tramos de jornada en el período. REPLACE conserva el valor del último tramo (útil para tasas o porcentajes); ACCUMULATE suma el valor de todos los tramos (útil para importes proporcionales a días).',
  executionScope: 'Momento de evaluación dentro del ciclo de cálculo. SEGMENTO: el concepto se evalúa una vez por cada tramo de jornada laboral del período. PERÍODO: se evalúa una única vez para todo el período, independientemente del número de tramos.',
  payslipOrderCode: 'Posición visual en el recibo de salario. Los conceptos se muestran en orden numérico ascendente. Un concepto sin orden no aparece en el recibo.',
  persistToConcepts: 'Indica si el resultado calculado se persiste en la tabla de conceptos del período. Desactivado en conceptos técnicos o intermedios que no necesitan trazabilidad individual.',
} as const

export function ConceptDetailPanel({ node, edges, ruleSystemCode, onDeleted }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const [summaryDraft, setSummaryDraft] = useState(node.data.summary ?? '')
  const qc = useQueryClient()

  useEffect(() => {
    setSummaryDraft(node.data.summary ?? '')
  }, [node.id, node.data.summary])

  const summaryMutation = useMutation({
    mutationFn: (summary: string | null) =>
      conceptsApi.updateSummary(ruleSystemCode, node.data.conceptCode, summary),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['concepts', ruleSystemCode] }),
  })

  const summaryChanged = summaryDraft.trim() !== (node.data.summary ?? '')

  const dependentCount = edges.filter(e => e.source === node.id).length
  const hasDependents = dependentCount > 0

  const handleConfirmDelete = () => {
    setIsPending(true)
    setIsError(false)
    conceptsApi.deleteConcept(ruleSystemCode, node.data.conceptCode)
      .then(() => {
        qc.invalidateQueries({ queryKey: ['concepts', ruleSystemCode] })
        setIsPending(false)
        onDeleted()
      })
      .catch(() => {
        setIsPending(false)
        setIsError(true)
      })
  }

  const d = node.data

  return (
    <TooltipProvider delay={300}>
      <aside className="w-56 bg-slate-900 border-l border-slate-800 p-3 text-xs flex-shrink-0 flex flex-col gap-4 overflow-y-auto">

        {/* Header */}
        <div>
          <div className="font-bold text-sky-400 text-sm leading-tight">{d.conceptCode}</div>
          <div className="text-slate-400 text-[10px] mt-0.5">{d.conceptMnemonic}</div>
          <div className="text-slate-600 text-[9px] mt-0.5 uppercase tracking-wide">PayrollConcept</div>
        </div>

        {/* Section: cálculo */}
        <section className="space-y-2">
          <SectionHeader label="Cálculo" />
          <Field
            label="Tipo de cálculo"
            value={d.calculationType}
            tooltip={FIELD_TOOLTIPS.calculationType}
          />
          <Field
            label="Ámbito"
            value={SCOPE_LABELS[d.executionScope]}
            tooltip={FIELD_TOOLTIPS.executionScope}
          />
          <Field
            label="Composición"
            value={COMPOSITION_LABELS[d.resultCompositionMode]}
            tooltip={FIELD_TOOLTIPS.resultCompositionMode}
          />
        </section>

        {/* Section: nómina */}
        <section className="space-y-2">
          <SectionHeader label="Nómina" />
          <Field
            label="Naturaleza"
            value={NATURE_LABELS[d.functionalNature] ?? d.functionalNature}
            tooltip={FIELD_TOOLTIPS.functionalNature}
          />
          <Field
            label="Orden en recibo"
            value={d.payslipOrderCode}
            tooltip={FIELD_TOOLTIPS.payslipOrderCode}
          />
          <Field
            label="Persiste resultado"
            value={d.persistToConcepts ? 'Sí' : 'No'}
            tooltip={FIELD_TOOLTIPS.persistToConcepts}
          />
        </section>

        {/* Section: summary */}
        <section className="space-y-1.5">
          <SectionHeader label="Summary" />
          <textarea
            className="w-full bg-slate-950 border border-slate-700 text-slate-300 text-[10px] rounded px-1.5 py-1 resize-none focus:outline-none focus:border-sky-600"
            rows={3}
            value={summaryDraft}
            onChange={e => setSummaryDraft(e.target.value)}
            placeholder="Descripción funcional..."
          />
          {summaryChanged && (
            <div className="flex gap-1">
              <button
                type="button"
                disabled={summaryMutation.isPending}
                onClick={() => summaryMutation.mutate(summaryDraft.trim() || null)}
                className="flex-1 text-[9px] bg-sky-900 border border-sky-700 text-sky-300 rounded px-2 py-0.5 hover:bg-sky-800 disabled:opacity-50"
              >
                {summaryMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => setSummaryDraft(node.data.summary ?? '')}
                className="text-[9px] border border-slate-700 text-slate-400 rounded px-2 py-0.5 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
          )}
        </section>

        {/* Delete */}
        <div className="mt-auto pt-2 border-t border-slate-800">
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
        </div>

      </aside>
    </TooltipProvider>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold border-b border-slate-800 pb-1">
      {label}
    </div>
  )
}

function Field({
  label,
  value,
  tooltip,
}: {
  label: string
  value: string | null | undefined
  tooltip: string
}) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-slate-500 text-[9px] uppercase tracking-wide">{label}</span>
        <Tooltip>
          <TooltipTrigger
            className="inline-flex items-center text-slate-600 hover:text-slate-400 cursor-help flex-shrink-0"
            tabIndex={-1}
          >
            <HelpCircle size={10} />
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[220px] text-[10px] leading-relaxed">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </div>
      {value != null
        ? <div className="bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{value}</div>
        : <div className="bg-slate-950 text-slate-600 px-1.5 py-0.5 rounded text-[10px] italic">—</div>
      }
    </div>
  )
}

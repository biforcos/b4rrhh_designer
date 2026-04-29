import type { FunctionalNature, ResultCompositionMode, ExecutionScope } from './types'

export const NATURE_LABELS: Record<FunctionalNature, string> = {
  EARNING:          'Devengo',
  DEDUCTION:        'Deducción',
  BASE:             'Base',
  INFORMATIONAL:    'Informativo',
  TECHNICAL:        'Técnico',
  TOTAL_EARNING:    'Total devengos',
  TOTAL_DEDUCTION:  'Total deducciones',
  NET_PAY:          'Líquido',
}

export const NATURE_COLORS: Record<FunctionalNature, string> = {
  EARNING:          'bg-sky-950 text-sky-400',
  DEDUCTION:        'bg-red-950 text-red-400',
  BASE:             'bg-violet-950 text-violet-400',
  INFORMATIONAL:    'bg-amber-950 text-amber-400',
  TECHNICAL:        'bg-slate-800 text-slate-400',
  TOTAL_EARNING:    'bg-green-950 text-green-400',
  TOTAL_DEDUCTION:  'bg-orange-950 text-orange-400',
  NET_PAY:          'bg-emerald-950 text-emerald-400',
}

export const COMPOSITION_LABELS: Record<ResultCompositionMode, string> = {
  REPLACE:    'Reemplaza',
  ACCUMULATE: 'Acumula',
}

export const SCOPE_LABELS: Record<ExecutionScope, string> = {
  SEGMENT: 'Segmento',
  PERIOD:  'Período',
}

import type { Node, Edge } from '@xyflow/react'

export type CalculationType = 'DIRECT_AMOUNT' | 'RATE_BY_QUANTITY' | 'PERCENTAGE' | 'AGGREGATE' | 'JAVA_PROVIDED' | 'EMPLOYEE_INPUT'
export type FunctionalNature = 'EARNING' | 'DEDUCTION' | 'BASE' | 'INFORMATIONAL' | 'TECHNICAL' | 'TOTAL_EARNING' | 'TOTAL_DEDUCTION' | 'NET_PAY'
export type ResultCompositionMode = 'REPLACE' | 'ACCUMULATE'
export type ExecutionScope = 'SEGMENT' | 'PERIOD'

export interface ConceptNodeData extends Record<string, unknown> {
  conceptCode: string
  conceptMnemonic: string
  calculationType: CalculationType
  functionalNature: FunctionalNature
  resultCompositionMode: ResultCompositionMode
  executionScope: ExecutionScope
  payslipOrderCode: string | null
  isDirty?: boolean
}

export type ConceptFlowNode = Node<ConceptNodeData, 'concept'>
export type ConceptFlowEdge = Edge<{ operandRole?: string; invertSign?: boolean }>

export const INPUT_PORTS: Record<CalculationType, string[]> = {
  DIRECT_AMOUNT: [],
  JAVA_PROVIDED: [],
  EMPLOYEE_INPUT: [], // no input handles; reads from employee data
  RATE_BY_QUANTITY: ['qty', 'rate'],
  PERCENTAGE: ['base', 'pct'],
  AGGREGATE: ['feed'],
}

export const PORT_COLORS: Record<string, string> = {
  qty:  'border-sky-400 bg-sky-950',
  rate: 'border-amber-400 bg-amber-950',
  base: 'border-violet-400 bg-violet-950',
  pct:  'border-pink-400 bg-pink-950',
  feed: 'border-green-400 bg-green-950',
  out:  'border-slate-400 bg-slate-700',
}

export const PORT_LABEL_COLORS: Record<string, string> = {
  qty:  'text-sky-400',
  rate: 'text-amber-400',
  base: 'text-violet-400',
  pct:  'text-pink-400',
  feed: 'text-green-400',
  out:  'text-slate-400',
}

export const TYPE_BADGE_COLORS: Record<CalculationType, string> = {
  DIRECT_AMOUNT:    'bg-slate-800 text-slate-400',
  JAVA_PROVIDED:    'bg-slate-800 text-slate-400',
  EMPLOYEE_INPUT:   'bg-teal-950 text-teal-400',
  RATE_BY_QUANTITY: 'bg-sky-950 text-sky-400',
  PERCENTAGE:       'bg-violet-950 text-violet-400',
  AGGREGATE:        'bg-green-950 text-green-400',
}

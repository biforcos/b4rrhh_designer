import { useQuery } from '@tanstack/react-query'
import { conceptsApi } from './api/conceptsApi'
import { loadPositions } from './graphPositions'
import type { ConceptFlowNode, ConceptFlowEdge, CalculationType, FunctionalNature, ResultCompositionMode, ExecutionScope } from './types'

const GRID_COLS = 4
const NODE_WIDTH = 160
const NODE_HEIGHT = 120

const OPERAND_STROKE: Record<string, string> = {
  qty:  '#38bdf8',
  rate: '#fbbf24',
  base: '#a78bfa',
  pct:  '#f472b6',
}

// Backend OperandRole enum uses QUANTITY/PERCENTAGE; frontend handles use qty/pct
const ROLE_TO_HANDLE: Record<string, string> = {
  QUANTITY:   'qty',
  RATE:       'rate',
  BASE:       'base',
  PERCENTAGE: 'pct',
  // tolerate values saved before this mapping was in place
  QTY:        'qty',
  PCT:        'pct',
}

export function useConceptGraph(ruleSystemCode: string) {
  return useQuery({
    queryKey: ['concepts', ruleSystemCode],
    queryFn: async () => {
      const concepts = await conceptsApi.listConcepts(ruleSystemCode)
      const allOperands = await Promise.all(
        concepts.map(c => conceptsApi.listOperands(ruleSystemCode, c.conceptCode))
      )
      const allFeeds = await Promise.all(
        concepts.map(c => conceptsApi.listFeeds(ruleSystemCode, c.conceptCode))
      )

      const savedPositions = loadPositions(ruleSystemCode)
      const nodes: ConceptFlowNode[] = concepts.map((c, i) => ({
        id: c.conceptCode,
        type: 'concept' as const,
        position: savedPositions[c.conceptCode] ?? {
          x: (i % GRID_COLS) * (NODE_WIDTH + 40),
          y: Math.floor(i / GRID_COLS) * (NODE_HEIGHT + 40),
        },
        data: {
          conceptCode: c.conceptCode,
          conceptMnemonic: c.conceptMnemonic,
          calculationType: c.calculationType as CalculationType,
          functionalNature: c.functionalNature as FunctionalNature,
          resultCompositionMode: c.resultCompositionMode as ResultCompositionMode,
          executionScope: c.executionScope as ExecutionScope,
          payslipOrderCode: c.payslipOrderCode ?? null,
        },
      }))

      const edges: ConceptFlowEdge[] = []
      concepts.forEach((c, i) => {
        allOperands[i].forEach(op => {
          const role = ROLE_TO_HANDLE[op.operandRole] ?? op.operandRole.toLowerCase()
          edges.push({
            id: `op-${op.sourceObjectCode}-${c.conceptCode}-${op.operandRole}`,
            type: 'deletable',
            source: op.sourceObjectCode,
            sourceHandle: 'out',
            target: c.conceptCode,
            targetHandle: role,
            style: { stroke: OPERAND_STROKE[role] ?? '#64748b', strokeWidth: 1.5 },
            data: { operandRole: op.operandRole },
          })
        })
        allFeeds[i].forEach(feed => {
          edges.push({
            id: `feed-${feed.sourceObjectCode}-${c.conceptCode}`,
            type: 'deletable',
            source: feed.sourceObjectCode,
            sourceHandle: 'out',
            target: c.conceptCode,
            targetHandle: 'feed',
            style: feed.invertSign ? { stroke: '#f87171', strokeWidth: 1.5 } : { stroke: '#4ade80', strokeWidth: 1.5 },
            data: { invertSign: feed.invertSign },
          })
        })
      })

      return { nodes, edges }
    },
  })
}

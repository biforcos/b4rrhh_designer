import { useQuery } from '@tanstack/react-query'
import { conceptsApi } from './api/conceptsApi'
import type { ConceptFlowNode, ConceptFlowEdge, CalculationType, FunctionalNature } from './types'

const GRID_COLS = 4
const NODE_WIDTH = 160
const NODE_HEIGHT = 120

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

      const nodes: ConceptFlowNode[] = concepts.map((c, i) => ({
        id: c.conceptCode,
        type: 'concept' as const,
        position: { x: (i % GRID_COLS) * (NODE_WIDTH + 40), y: Math.floor(i / GRID_COLS) * (NODE_HEIGHT + 40) },
        data: {
          conceptCode: c.conceptCode,
          conceptMnemonic: c.conceptMnemonic,
          calculationType: c.calculationType as CalculationType,
          functionalNature: c.functionalNature as FunctionalNature,
        },
      }))

      const edges: ConceptFlowEdge[] = []
      concepts.forEach((c, i) => {
        allOperands[i].forEach(op => {
          edges.push({
            id: `op-${op.sourceObjectCode}-${c.conceptCode}-${op.operandRole}`,
            source: op.sourceObjectCode,
            target: c.conceptCode,
            targetHandle: op.operandRole.toLowerCase(),
            data: { operandRole: op.operandRole },
          })
        })
        allFeeds[i].forEach(feed => {
          edges.push({
            id: `feed-${feed.sourceObjectCode}-${c.conceptCode}`,
            source: feed.sourceObjectCode,
            target: c.conceptCode,
            targetHandle: 'feed',
            style: feed.invertSign ? { stroke: '#f87171' } : { stroke: '#4ade80' },
            data: { invertSign: feed.invertSign },
          })
        })
      })

      return { nodes, edges }
    },
  })
}

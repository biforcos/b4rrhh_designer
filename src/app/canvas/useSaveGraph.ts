import { useMutation, useQueryClient } from '@tanstack/react-query'
import { conceptsApi } from './api/conceptsApi'
import type { ConceptFlowNode, ConceptFlowEdge, CalculationType } from './types'
import { INPUT_PORTS } from './types'

export function useSaveGraph(ruleSystemCode: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ nodes, edges }: { nodes: ConceptFlowNode[]; edges: ConceptFlowEdge[] }) => {
      await Promise.all(nodes.map(async node => {
        const calcType = node.data.calculationType as CalculationType
        const requiredPorts = INPUT_PORTS[calcType]

        if (calcType === 'AGGREGATE') {
          const feeds = edges
            .filter(e => e.target === node.id && e.targetHandle === 'feed')
            .map(e => ({
              sourceObjectCode: e.source,
              invertSign: e.data?.invertSign ?? false,
              effectiveFrom: '2020-01-01',
              effectiveTo: null,
            }))
          await conceptsApi.replaceFeeds(ruleSystemCode, node.id, feeds)
        } else if (requiredPorts.length > 0) {
          const operands = edges
            .filter(e => e.target === node.id)
            .map(e => ({
              operandRole: (e.targetHandle ?? '').toUpperCase(),
              sourceObjectCode: e.source,
            }))
            .filter(o => o.operandRole)
          await conceptsApi.replaceOperands(ruleSystemCode, node.id, operands)
        }
      }))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['concepts', ruleSystemCode] }),
  })
}

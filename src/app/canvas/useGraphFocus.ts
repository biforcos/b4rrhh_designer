import { useMemo } from 'react'
import type { ConceptFlowEdge } from './types'

export interface GraphFocus {
  focusedNodeIds: Set<string>
  neighborNodeIds: Set<string>
  ancestorNodeIds: Set<string>
  focusedEdgeIds: Set<string>
  ancestorEdgeIds: Set<string>
}

const EMPTY: GraphFocus = {
  focusedNodeIds: new Set(),
  neighborNodeIds: new Set(),
  ancestorNodeIds: new Set(),
  focusedEdgeIds: new Set(),
  ancestorEdgeIds: new Set(),
}

export function useGraphFocus(
  selectedNodeId: string | null,
  edges: ConceptFlowEdge[],
): GraphFocus {
  return useMemo(() => {
    if (!selectedNodeId) return EMPTY

    const neighborNodeIds = new Set<string>()
    const focusedEdgeIds = new Set<string>()

    for (const e of edges) {
      if (e.source === selectedNodeId) {
        neighborNodeIds.add(e.target)
        focusedEdgeIds.add(e.id)
      }
      if (e.target === selectedNodeId) {
        neighborNodeIds.add(e.source)
        focusedEdgeIds.add(e.id)
      }
    }

    // BFS upstream: follow edges backwards (target → source)
    const ancestorNodeIds = new Set<string>()
    const queue = [selectedNodeId]
    const visited = new Set([selectedNodeId])
    while (queue.length > 0) {
      const current = queue.shift()!
      for (const e of edges) {
        if (e.target === current && !visited.has(e.source)) {
          visited.add(e.source)
          ancestorNodeIds.add(e.source)
          queue.push(e.source)
        }
      }
    }

    // Ancestor edges: both endpoints in {ancestors ∪ selectedNode}
    const ancestorScope = new Set([...ancestorNodeIds, selectedNodeId])
    const ancestorEdgeIds = new Set<string>()
    for (const e of edges) {
      if (ancestorScope.has(e.source) && ancestorScope.has(e.target)) {
        ancestorEdgeIds.add(e.id)
      }
    }

    const focusedNodeIds = new Set([selectedNodeId, ...neighborNodeIds, ...ancestorNodeIds])

    return { focusedNodeIds, neighborNodeIds, ancestorNodeIds, focusedEdgeIds, ancestorEdgeIds }
  }, [selectedNodeId, edges])
}

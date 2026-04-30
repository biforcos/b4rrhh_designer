import type { ConceptFlowNode, ConceptFlowEdge, CalculationType } from './types'
import { INPUT_PORTS } from './types'

export interface GraphValidationResult {
  errors: string[]
  warnings: string[]
}

export function validateGraph(
  nodes: ConceptFlowNode[],
  edges: ConceptFlowEdge[],
): GraphValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const nodeIds = new Set(nodes.map(n => n.id))

  // 1. Cycle detection — Kahn's algorithm (topological sort)
  const inDegree = new Map<string, number>()
  const adj = new Map<string, string[]>()
  for (const id of nodeIds) {
    inDegree.set(id, 0)
    adj.set(id, [])
  }
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue
    adj.get(edge.source)!.push(edge.target)
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  }
  const queue = [...nodeIds].filter(id => inDegree.get(id) === 0)
  let processed = 0
  while (queue.length > 0) {
    const id = queue.shift()!
    processed++
    for (const neighbor of adj.get(id) ?? []) {
      const deg = (inDegree.get(neighbor) ?? 0) - 1
      inDegree.set(neighbor, deg)
      if (deg === 0) queue.push(neighbor)
    }
  }
  if (processed < nodeIds.size) {
    const cycleNodes = nodes
      .filter(n => (inDegree.get(n.id) ?? 0) > 0)
      .map(n => n.id)
      .join(', ')
    errors.push(`Dependencia circular entre: ${cycleNodes}`)
  }

  // 2. Missing required operand ports (AGGREGATE handled separately as warning)
  for (const node of nodes) {
    if (node.data.calculationType === 'AGGREGATE') continue
    const requiredPorts = INPUT_PORTS[node.data.calculationType as CalculationType]
    if (requiredPorts.length === 0) continue

    const connected = new Set(
      edges
        .filter(e => e.target === node.id && e.targetHandle)
        .map(e => e.targetHandle!),
    )
    const missing = requiredPorts.filter(p => !connected.has(p))
    if (missing.length > 0) {
      errors.push(
        `${node.id} (${node.data.calculationType}): entradas sin conectar [${missing.join(', ')}]`,
      )
    }
  }

  // 3. AGGREGATE with no feeds → warning (motor devuelve 0, no es error)
  for (const node of nodes) {
    if (node.data.calculationType !== 'AGGREGATE') continue
    const hasFeeds = edges.some(e => e.target === node.id && e.targetHandle === 'feed')
    if (!hasFeeds) {
      warnings.push(`${node.id}: AGGREGATE sin feeds — producirá resultado 0`)
    }
  }

  return { errors, warnings }
}

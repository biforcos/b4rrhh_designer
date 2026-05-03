import { describe, it, expect } from 'vitest'
import { applyDagreLayout } from './autoLayout'
import type { ConceptFlowNode, ConceptFlowEdge } from './types'

function node(id: string): ConceptFlowNode {
  return {
    id,
    type: 'concept',
    position: { x: 0, y: 0 },
    data: {
      conceptCode: id,
      conceptMnemonic: id,
      calculationType: 'DIRECT_AMOUNT',
      functionalNature: 'EARNING',
      resultCompositionMode: 'REPLACE',
      executionScope: 'SEGMENT',
      payslipOrderCode: null,
      persistToConcepts: false,
      summary: null,
    },
  }
}

function edge(source: string, target: string): ConceptFlowEdge {
  return { id: `e-${source}-${target}`, source, target }
}

describe('applyDagreLayout', () => {
  it('coloca los nodos en x creciente para una cadena A→B→C', () => {
    const nodes = [node('A'), node('B'), node('C')]
    const edges = [edge('A', 'B'), edge('B', 'C')]
    const result = applyDagreLayout(nodes, edges)
    const xById = Object.fromEntries(result.map(n => [n.id, n.position.x]))
    expect(xById['A']).toBeLessThan(xById['B'])
    expect(xById['B']).toBeLessThan(xById['C'])
  })

  it('nodo descendiente tiene x mayor que la fuente', () => {
    const nodes = [node('A'), node('B'), node('C')]
    const edges = [edge('A', 'B'), edge('A', 'C')]
    const result = applyDagreLayout(nodes, edges)
    const xA = result.find(n => n.id === 'A')!.position.x
    const xB = result.find(n => n.id === 'B')!.position.x
    expect(xB).toBeGreaterThan(xA)
  })

  it('funciona con un único nodo sin aristas', () => {
    const result = applyDagreLayout([node('X')], [])
    expect(result).toHaveLength(1)
    expect(typeof result[0].position.x).toBe('number')
    expect(typeof result[0].position.y).toBe('number')
  })

  it('devuelve los mismos IDs que recibió', () => {
    const nodes = [node('P01'), node('B01'), node('722')]
    const edges = [edge('P01', 'B01'), edge('B01', '722')]
    const result = applyDagreLayout(nodes, edges)
    expect(result.map(n => n.id).sort()).toEqual(['722', 'B01', 'P01'])
  })
})

import { describe, it, expect } from 'vitest'
import { validateGraph } from './validateGraph'
import type { ConceptFlowNode, ConceptFlowEdge } from './types'

function node(id: string, calculationType: string): ConceptFlowNode {
  return {
    id,
    type: 'concept',
    position: { x: 0, y: 0 },
    data: {
      conceptCode: id,
      conceptMnemonic: id,
      calculationType: calculationType as never,
      functionalNature: 'EARNING',
      resultCompositionMode: 'ACCUMULATE',
      executionScope: 'SEGMENT',
      payslipOrderCode: null,
      persistToConcepts: true,
      summary: null,
    },
  }
}

function edge(source: string, target: string, targetHandle: string): ConceptFlowEdge {
  return {
    id: `${source}-${target}-${targetHandle}`,
    source,
    target,
    targetHandle,
    type: 'deletable',
  }
}

describe('validateGraph', () => {
  it('returns no issues for a clean graph', () => {
    const nodes = [node('A', 'DIRECT_AMOUNT'), node('B', 'RATE_BY_QUANTITY')]
    const edges = [
      edge('A', 'B', 'qty'),
      edge('A', 'B', 'rate'),
    ]
    const result = validateGraph(nodes, edges)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('detects a direct cycle', () => {
    const nodes = [node('A', 'DIRECT_AMOUNT'), node('B', 'DIRECT_AMOUNT')]
    const edges = [edge('A', 'B', 'feed'), edge('B', 'A', 'feed')]
    const result = validateGraph(nodes, edges)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatch(/circular/)
  })

  it('detects a three-node cycle', () => {
    const nodes = [node('A', 'DIRECT_AMOUNT'), node('B', 'DIRECT_AMOUNT'), node('C', 'DIRECT_AMOUNT')]
    const edges = [edge('A', 'B', 'feed'), edge('B', 'C', 'feed'), edge('C', 'A', 'feed')]
    const result = validateGraph(nodes, edges)
    expect(result.errors).toHaveLength(1)
  })

  it('errors when RATE_BY_QUANTITY is missing qty', () => {
    const nodes = [node('SRC', 'DIRECT_AMOUNT'), node('B', 'RATE_BY_QUANTITY')]
    const edges = [edge('SRC', 'B', 'rate')]
    const result = validateGraph(nodes, edges)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatch(/qty/)
  })

  it('errors when RATE_BY_QUANTITY is missing both operands', () => {
    const nodes = [node('B', 'RATE_BY_QUANTITY')]
    const result = validateGraph(nodes, [])
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatch(/qty.*rate|rate.*qty/)
  })

  it('errors when PERCENTAGE is missing pct', () => {
    const nodes = [node('SRC', 'DIRECT_AMOUNT'), node('B', 'PERCENTAGE')]
    const edges = [edge('SRC', 'B', 'base')]
    const result = validateGraph(nodes, edges)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatch(/pct/)
  })

  it('warns when AGGREGATE has no feeds', () => {
    const nodes = [node('TOT', 'AGGREGATE')]
    const result = validateGraph(nodes, [])
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toMatch(/AGGREGATE/)
  })

  it('accumulates multiple independent errors', () => {
    const nodes = [
      node('B', 'RATE_BY_QUANTITY'),
      node('C', 'PERCENTAGE'),
    ]
    const result = validateGraph(nodes, [])
    expect(result.errors).toHaveLength(2)
  })

  it('ignores edges referencing nodes not in the graph', () => {
    const nodes = [node('A', 'DIRECT_AMOUNT')]
    const edges = [edge('GHOST', 'A', 'feed')]
    const result = validateGraph(nodes, edges)
    expect(result.errors).toHaveLength(0)
  })

  it('accepts DIRECT_AMOUNT and JAVA_PROVIDED with no edges', () => {
    const nodes = [node('A', 'DIRECT_AMOUNT'), node('B', 'JAVA_PROVIDED'), node('C', 'EMPLOYEE_INPUT')]
    const result = validateGraph(nodes, [])
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })
})

import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useGraphFocus } from './useGraphFocus'
import type { ConceptFlowEdge } from './types'

function edge(source: string, target: string): ConceptFlowEdge {
  return { id: `e-${source}-${target}`, source, target }
}

describe('useGraphFocus', () => {
  const edges = [edge('A', 'B'), edge('B', 'C')]

  it('devuelve conjuntos vacíos cuando selectedNodeId es null', () => {
    const { result } = renderHook(() => useGraphFocus(null, edges))
    expect(result.current.focusedNodeIds.size).toBe(0)
    expect(result.current.neighborNodeIds.size).toBe(0)
    expect(result.current.ancestorNodeIds.size).toBe(0)
    expect(result.current.focusedEdgeIds.size).toBe(0)
    expect(result.current.ancestorEdgeIds.size).toBe(0)
  })

  it('seleccionando B: vecinos directos son A y C', () => {
    const { result } = renderHook(() => useGraphFocus('B', edges))
    expect(result.current.neighborNodeIds).toEqual(new Set(['A', 'C']))
  })

  it('seleccionando B: ancestro upstream es A (no C)', () => {
    const { result } = renderHook(() => useGraphFocus('B', edges))
    expect(result.current.ancestorNodeIds).toEqual(new Set(['A']))
  })

  it('seleccionando B: focusedNodeIds incluye A, B y C', () => {
    const { result } = renderHook(() => useGraphFocus('B', edges))
    expect(result.current.focusedNodeIds).toEqual(new Set(['A', 'B', 'C']))
  })

  it('seleccionando B: focusedEdgeIds contiene las dos aristas que tocan B', () => {
    const { result } = renderHook(() => useGraphFocus('B', edges))
    expect(result.current.focusedEdgeIds).toEqual(new Set(['e-A-B', 'e-B-C']))
  })

  it('seleccionando B: ancestorEdgeIds contiene e-A-B (conecta ancestro con seleccionado)', () => {
    const { result } = renderHook(() => useGraphFocus('B', edges))
    expect(result.current.ancestorEdgeIds.has('e-A-B')).toBe(true)
  })

  it('seleccionando A (fuente): sin ancestros, vecino es B', () => {
    const { result } = renderHook(() => useGraphFocus('A', edges))
    expect(result.current.ancestorNodeIds.size).toBe(0)
    expect(result.current.neighborNodeIds).toEqual(new Set(['B']))
  })

  it('seleccionando C (hoja): ancestros son A y B', () => {
    const { result } = renderHook(() => useGraphFocus('C', edges))
    expect(result.current.ancestorNodeIds).toEqual(new Set(['A', 'B']))
  })
})

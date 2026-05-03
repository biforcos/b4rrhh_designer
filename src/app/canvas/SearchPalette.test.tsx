import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SearchPalette } from './SearchPalette'
import type { ConceptFlowNode } from './types'

function node(id: string, code: string, mnemonic: string): ConceptFlowNode {
  return {
    id,
    type: 'concept',
    position: { x: 0, y: 0 },
    data: {
      conceptCode: code,
      conceptMnemonic: mnemonic,
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

const NODES = [
  node('1', 'P_TOPE_MAX', 'Tope máximo SS'),
  node('2', 'P_TOPE_MIN', 'Tope mínimo SS'),
  node('3', 'B01', 'Base cotización'),
]

describe('SearchPalette', () => {
  it('muestra todos los nodos con query vacío', () => {
    render(<SearchPalette nodes={NODES} onSelect={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('P_TOPE_MAX')).toBeInTheDocument()
    expect(screen.getByText('P_TOPE_MIN')).toBeInTheDocument()
    expect(screen.getByText('B01')).toBeInTheDocument()
  })

  it('filtra por código de concepto (case-insensitive)', () => {
    render(<SearchPalette nodes={NODES} onSelect={vi.fn()} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Buscar concepto...'), { target: { value: 'tope' } })
    expect(screen.getByText('P_TOPE_MAX')).toBeInTheDocument()
    expect(screen.getByText('P_TOPE_MIN')).toBeInTheDocument()
    expect(screen.queryByText('B01')).not.toBeInTheDocument()
  })

  it('filtra por mnemónico', () => {
    render(<SearchPalette nodes={NODES} onSelect={vi.fn()} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Buscar concepto...'), { target: { value: 'base' } })
    expect(screen.getByText('B01')).toBeInTheDocument()
    expect(screen.queryByText('P_TOPE_MAX')).not.toBeInTheDocument()
  })

  it('llama onSelect con el id del nodo al clicar un resultado', () => {
    const onSelect = vi.fn()
    render(<SearchPalette nodes={NODES} onSelect={onSelect} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('P_TOPE_MAX').closest('button')!)
    expect(onSelect).toHaveBeenCalledWith('1')
  })

  it('llama onClose al pulsar Escape', () => {
    const onClose = vi.fn()
    render(<SearchPalette nodes={NODES} onSelect={vi.fn()} onClose={onClose} />)
    fireEvent.keyDown(screen.getByPlaceholderText('Buscar concepto...'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('muestra "Sin resultados" cuando no hay coincidencias', () => {
    render(<SearchPalette nodes={NODES} onSelect={vi.fn()} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Buscar concepto...'), { target: { value: 'xyz_inexistente' } })
    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
  })
})

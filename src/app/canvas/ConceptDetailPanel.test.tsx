import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { ConceptDetailPanel } from './ConceptDetailPanel'
import type { ConceptFlowNode, ConceptFlowEdge } from './types'
import { conceptsApi } from './api/conceptsApi'

vi.mock('./api/conceptsApi', () => ({
  conceptsApi: {
    deleteConcept: vi.fn().mockResolvedValue(undefined),
  },
}))

function makeNode(overrides: Partial<ConceptFlowNode['data']> = {}): ConceptFlowNode {
  return {
    id: 'SB',
    type: 'concept',
    position: { x: 0, y: 0 },
    data: {
      conceptCode: 'SB',
      conceptMnemonic: 'SALARIO_BASE',
      calculationType: 'RATE_BY_QUANTITY',
      functionalNature: 'EARNING',
      resultCompositionMode: 'ACCUMULATE',
      executionScope: 'SEGMENT',
      payslipOrderCode: null,
      ...overrides,
    },
  } as ConceptFlowNode
}

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('ConceptDetailPanel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra código, mnemónico y todos los campos del concepto', () => {
    wrap(
      <ConceptDetailPanel
        node={makeNode({ payslipOrderCode: '100' })}
        edges={[]}
        ruleSystemCode="ESP"
        onDeleted={() => {}}
      />
    )
    expect(screen.getByText('SB')).toBeInTheDocument()
    expect(screen.getByText('SALARIO_BASE')).toBeInTheDocument()
    expect(screen.getByText('RATE_BY_QUANTITY')).toBeInTheDocument()
    expect(screen.getByText('Devengo')).toBeInTheDocument()
    expect(screen.getByText('Acumula')).toBeInTheDocument()
    expect(screen.getByText('Segmento')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('muestra "—" cuando payslipOrderCode es null', () => {
    wrap(
      <ConceptDetailPanel node={makeNode()} edges={[]} ruleSystemCode="ESP" onDeleted={() => {}} />
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('botón borrar deshabilitado y muestra aviso cuando tiene dependencias', () => {
    const edges: ConceptFlowEdge[] = [
      { id: 'e1', source: 'SB', target: 'OTHER', type: 'deletable', data: {} },
      { id: 'e2', source: 'SB', target: 'OTHER2', type: 'deletable', data: {} },
    ]
    wrap(
      <ConceptDetailPanel node={makeNode()} edges={edges} ruleSystemCode="ESP" onDeleted={() => {}} />
    )
    expect(screen.getByRole('button', { name: /borrar concepto/i })).toBeDisabled()
    expect(screen.getByText(/usado por 2 conceptos/i)).toBeInTheDocument()
  })

  it('botón borrar habilitado cuando no tiene dependencias', () => {
    wrap(
      <ConceptDetailPanel node={makeNode()} edges={[]} ruleSystemCode="ESP" onDeleted={() => {}} />
    )
    expect(screen.getByRole('button', { name: /borrar concepto/i })).not.toBeDisabled()
  })

  it('clic en borrar muestra botones de confirmación y aviso', () => {
    wrap(
      <ConceptDetailPanel node={makeNode()} edges={[]} ruleSystemCode="ESP" onDeleted={() => {}} />
    )
    fireEvent.click(screen.getByRole('button', { name: /borrar concepto/i }))
    expect(screen.getByRole('button', { name: /confirmar borrado/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
    expect(screen.getByText(/esta acción no se puede deshacer/i)).toBeInTheDocument()
  })

  it('clic en cancelar vuelve al estado normal', () => {
    wrap(
      <ConceptDetailPanel node={makeNode()} edges={[]} ruleSystemCode="ESP" onDeleted={() => {}} />
    )
    fireEvent.click(screen.getByRole('button', { name: /borrar concepto/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(screen.getByRole('button', { name: /borrar concepto/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirmar borrado/i })).not.toBeInTheDocument()
  })

  it('confirmar borrado llama a deleteConcept y dispara onDeleted', async () => {
    const onDeleted = vi.fn()
    wrap(
      <ConceptDetailPanel node={makeNode()} edges={[]} ruleSystemCode="ESP" onDeleted={onDeleted} />
    )
    fireEvent.click(screen.getByRole('button', { name: /borrar concepto/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirmar borrado/i }))
    expect(conceptsApi.deleteConcept).toHaveBeenCalledWith('ESP', 'SB')
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
  })

  it('muestra "Borrando..." en el botón durante el borrado', async () => {
    // Make deleteConcept hang (never resolve) so we can check the in-flight state
    let resolveFn!: () => void
    ;(conceptsApi.deleteConcept as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () => new Promise<void>(resolve => { resolveFn = resolve })
    )
    wrap(
      <ConceptDetailPanel node={makeNode()} edges={[]} ruleSystemCode="ESP" onDeleted={() => {}} />
    )
    fireEvent.click(screen.getByRole('button', { name: /borrar concepto/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirmar borrado/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /borrando/i })).toBeInTheDocument())
    resolveFn() // cleanup: let the promise resolve so no open handles
  })

  it('muestra error cuando deleteConcept falla', async () => {
    ;(conceptsApi.deleteConcept as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('server error'))
    wrap(
      <ConceptDetailPanel node={makeNode()} edges={[]} ruleSystemCode="ESP" onDeleted={() => {}} />
    )
    fireEvent.click(screen.getByRole('button', { name: /borrar concepto/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirmar borrado/i }))
    await waitFor(() => expect(screen.getByText(/error al borrar el concepto/i)).toBeInTheDocument())
  })
})

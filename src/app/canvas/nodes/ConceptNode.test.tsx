import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { ConceptNode } from './ConceptNode'

const BASE_DATA = {
  resultCompositionMode: 'ACCUMULATE' as const,
  executionScope: 'SEGMENT' as const,
  payslipOrderCode: null,
}

const wrapInProvider = (ui: React.ReactElement) => (
  <ReactFlowProvider>{ui}</ReactFlowProvider>
)

describe('ConceptNode', () => {
  it('muestra código y mnemónico', () => {
    render(wrapInProvider(
      <ConceptNode
        id="101"
        data={{ ...BASE_DATA, conceptCode: '101', conceptMnemonic: 'SALARIO_BASE', calculationType: 'RATE_BY_QUANTITY', functionalNature: 'EARNING' }}
        selected={false}
        type="concept"
        dragging={false}
        draggable={true}
        selectable={true}
        deletable={true}
        zIndex={0}
        isConnectable={true}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
      />
    ))
    expect(screen.getByText('101')).toBeInTheDocument()
    expect(screen.getByText('SALARIO_BASE')).toBeInTheDocument()
  })

  it('muestra puertos qty y rate para RATE_BY_QUANTITY', () => {
    render(wrapInProvider(
      <ConceptNode
        id="101"
        data={{ ...BASE_DATA, conceptCode: '101', conceptMnemonic: 'SB', calculationType: 'RATE_BY_QUANTITY', functionalNature: 'EARNING' }}
        selected={false} type="concept" dragging={false} draggable={true} selectable={true} deletable={true}
        zIndex={0} isConnectable={true} positionAbsoluteX={0} positionAbsoluteY={0}
      />
    ))
    expect(screen.getByTitle('qty')).toBeInTheDocument()
    expect(screen.getByTitle('rate')).toBeInTheDocument()
  })

  it('no muestra puertos de entrada para ENGINE_PROVIDED', () => {
    render(wrapInProvider(
      <ConceptNode
        id="d01"
        data={{ ...BASE_DATA, conceptCode: 'D01', conceptMnemonic: 'DIAS', calculationType: 'ENGINE_PROVIDED', functionalNature: 'TECHNICAL' }}
        selected={false} type="concept" dragging={false} draggable={true} selectable={true} deletable={true}
        zIndex={0} isConnectable={true} positionAbsoluteX={0} positionAbsoluteY={0}
      />
    ))
    expect(screen.queryByTitle('qty')).not.toBeInTheDocument()
  })

  it('muestra puerto feed para AGGREGATE', () => {
    render(wrapInProvider(
      <ConceptNode
        id="agg"
        data={{ ...BASE_DATA, conceptCode: 'AGG', conceptMnemonic: 'TOTAL', calculationType: 'AGGREGATE', functionalNature: 'TOTAL_EARNING' }}
        selected={false} type="concept" dragging={false} draggable={true} selectable={true} deletable={true}
        zIndex={0} isConnectable={true} positionAbsoluteX={0} positionAbsoluteY={0}
      />
    ))
    expect(screen.getByTitle('feed')).toBeInTheDocument()
  })

  it('aplica opacidad baja cuando dimmed=true', () => {
    const { container } = render(wrapInProvider(
      <ConceptNode
        id="d01"
        data={{ ...BASE_DATA, conceptCode: 'D01', conceptMnemonic: 'DIAS', calculationType: 'ENGINE_PROVIDED', functionalNature: 'TECHNICAL', dimmed: true }}
        selected={false} type="concept" dragging={false} draggable={true} selectable={true} deletable={true}
        zIndex={0} isConnectable={true} positionAbsoluteX={0} positionAbsoluteY={0}
      />
    ))
    expect(container.firstChild).toHaveClass('opacity-[0.12]')
  })

  it('aplica borde violeta cuando neighborHighlight=true', () => {
    const { container } = render(wrapInProvider(
      <ConceptNode
        id="b01"
        data={{ ...BASE_DATA, conceptCode: 'B01', conceptMnemonic: 'BASE', calculationType: 'AGGREGATE', functionalNature: 'BASE', neighborHighlight: true }}
        selected={false} type="concept" dragging={false} draggable={true} selectable={true} deletable={true}
        zIndex={0} isConnectable={true} positionAbsoluteX={0} positionAbsoluteY={0}
      />
    ))
    expect(container.firstChild).toHaveClass('border-violet-500')
  })
})

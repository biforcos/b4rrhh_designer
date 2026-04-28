import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { ConceptNode } from './ConceptNode'

const wrapInProvider = (ui: React.ReactElement) => (
  <ReactFlowProvider>{ui}</ReactFlowProvider>
)

describe('ConceptNode', () => {
  it('muestra código y mnemónico', () => {
    render(wrapInProvider(
      <ConceptNode
        id="101"
        data={{ conceptCode: '101', conceptMnemonic: 'SALARIO_BASE', calculationType: 'RATE_BY_QUANTITY', functionalNature: 'EARNING' }}
        selected={false}
        type="concept"
        dragging={false}
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
        data={{ conceptCode: '101', conceptMnemonic: 'SB', calculationType: 'RATE_BY_QUANTITY', functionalNature: 'EARNING' }}
        selected={false} type="concept" dragging={false} zIndex={0} isConnectable={true}
        positionAbsoluteX={0} positionAbsoluteY={0}
      />
    ))
    expect(screen.getByTitle('qty')).toBeInTheDocument()
    expect(screen.getByTitle('rate')).toBeInTheDocument()
  })

  it('no muestra puertos de entrada para JAVA_PROVIDED', () => {
    render(wrapInProvider(
      <ConceptNode
        id="d01"
        data={{ conceptCode: 'D01', conceptMnemonic: 'DIAS', calculationType: 'JAVA_PROVIDED', functionalNature: 'TECHNICAL' }}
        selected={false} type="concept" dragging={false} zIndex={0} isConnectable={true}
        positionAbsoluteX={0} positionAbsoluteY={0}
      />
    ))
    expect(screen.queryByTitle('qty')).not.toBeInTheDocument()
  })
})

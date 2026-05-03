import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ReactFlowProvider } from '@xyflow/react'
import { DeletableEdge } from './DeletableEdge'

// EdgeLabelRenderer uses a portal that requires a full ReactFlow DOM setup.
// In tests we render children inline so toHaveTextContent works normally.
vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>()
  return {
    ...actual,
    EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

const BASE_PROPS = {
  id: 'e1',
  sourceX: 0,
  sourceY: 0,
  targetX: 200,
  targetY: 0,
  sourcePosition: 'right' as const,
  targetPosition: 'left' as const,
  selected: false,
  targetHandle: 'left',
  sourceHandle: null,
  source: 'A',
  target: 'B',
  markerEnd: undefined,
  style: undefined,
  interactionWidth: 20,
}

function wrap(ui: React.ReactElement) {
  return (
    <ReactFlowProvider>
      <svg>{ui}</svg>
    </ReactFlowProvider>
  )
}

describe('DeletableEdge', () => {
  it('muestra etiqueta del puerto al hacer hover', () => {
    const { container } = render(wrap(<DeletableEdge {...BASE_PROPS} />))
    const hitArea = container.querySelector('path[stroke="transparent"]')!
    fireEvent.mouseEnter(hitArea)
    expect(document.body).toHaveTextContent('→ left')
  })

  it('oculta la etiqueta al salir del hover', () => {
    const { container } = render(wrap(<DeletableEdge {...BASE_PROPS} />))
    const hitArea = container.querySelector('path[stroke="transparent"]')!
    fireEvent.mouseEnter(hitArea)
    fireEvent.mouseLeave(hitArea)
    expect(document.body).not.toHaveTextContent('→ left')
  })

  it('no muestra etiqueta si targetHandle es null', () => {
    const { container } = render(wrap(<DeletableEdge {...BASE_PROPS} targetHandle={null} />))
    const hitArea = container.querySelector('path[stroke="transparent"]')!
    fireEvent.mouseEnter(hitArea)
    expect(document.body).not.toHaveTextContent('→')
  })
})

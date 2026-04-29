import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import React from 'react'
import { CreateAssignmentDrawer } from './CreateAssignmentDrawer'
import { conceptsApi } from '../canvas/api/conceptsApi'
import { assignmentsApi } from './api/assignmentsApi'

vi.mock('../canvas/api/conceptsApi', () => ({
  conceptsApi: { listConcepts: vi.fn() },
}))

vi.mock('./api/assignmentsApi', () => ({
  assignmentsApi: {
    list: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock shadcn Select with a native <select> so fireEvent.change works in tests.
// Select renders a native <select> forwarding id, aria-label, value and onChange.
// SelectTrigger passes its id/aria-label up as data attributes on a wrapper div
// so Select can pick them up, but the simplest approach is a shared context.
vi.mock('@/components/ui/select', () => {
  type SelectCtx = { id?: string; ariaLabel?: string; onValueChange: (v: string) => void; value: string }
  const SelectContext = React.createContext<SelectCtx>({ onValueChange: () => {}, value: '' })

  function Select({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) {
    return (
      <SelectContext.Provider value={{ onValueChange, value }}>
        {children}
      </SelectContext.Provider>
    )
  }

  function SelectTrigger({ id, 'aria-label': ariaLabel, children }: { id?: string; 'aria-label'?: string; children?: React.ReactNode }) {
    const ctx = React.useContext(SelectContext)
    // Store id/ariaLabel on context for SelectContent to use
    ctx.id = id
    ctx.ariaLabel = ariaLabel
    return null
  }

  function SelectValue(_props: { placeholder?: string }) {
    return null
  }

  function SelectContent({ children }: { children: React.ReactNode }) {
    const ctx = React.useContext(SelectContext)
    return (
      <select
        id={ctx.id}
        aria-label={ctx.ariaLabel}
        title={ctx.ariaLabel}
        value={ctx.value}
        onChange={e => ctx.onValueChange(e.target.value)}
      >
        {children}
      </select>
    )
  }

  function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
    return <option value={value}>{children}</option>
  }

  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
})

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  vi.mocked(conceptsApi.listConcepts).mockResolvedValue([
    {
      ruleSystemCode: 'ESP', conceptCode: 'SALBASE', conceptMnemonic: 'SAL_BASE',
      calculationType: 'DIRECT_AMOUNT', functionalNature: 'EARNING',
      resultCompositionMode: 'REPLACE', executionScope: 'PERIOD',
      payslipOrderCode: null, persistToConcepts: true,
    },
  ])
  vi.mocked(assignmentsApi.create).mockResolvedValue({
    assignmentCode: 'uuid-1', ruleSystemCode: 'ESP', conceptCode: 'SALBASE',
    companyCode: null, agreementCode: null, employeeTypeCode: null,
    validFrom: '2025-01-01', validTo: null, priority: 1,
  })
})

it('renders nothing when closed', () => {
  wrap(<CreateAssignmentDrawer open={false} onClose={() => {}} ruleSystemCode="ESP" />)
  expect(screen.queryByText('Nueva asignación')).not.toBeInTheDocument()
})

it('renders form fields when open', async () => {
  wrap(<CreateAssignmentDrawer open={true} onClose={() => {}} ruleSystemCode="ESP" />)
  expect(screen.getByText('Nueva asignación')).toBeInTheDocument()
  await waitFor(() => expect(screen.getByText('SALBASE — SAL_BASE')).toBeInTheDocument())
  expect(screen.getByLabelText('Desde')).toBeInTheDocument()
  expect(screen.getByLabelText('Prioridad')).toBeInTheDocument()
})

it('submit button is disabled until conceptCode, validFrom and priority are filled', async () => {
  wrap(<CreateAssignmentDrawer open={true} onClose={() => {}} ruleSystemCode="ESP" />)
  await waitFor(() => screen.getByText('SALBASE — SAL_BASE'))

  expect(screen.getByRole('button', { name: /crear asignación/i })).toBeDisabled()

  fireEvent.change(screen.getByLabelText('Concepto'), { target: { value: 'SALBASE' } })
  expect(screen.getByRole('button', { name: /crear asignación/i })).toBeDisabled()

  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2025-01-01' } })
  expect(screen.getByRole('button', { name: /crear asignación/i })).toBeDisabled()

  fireEvent.change(screen.getByLabelText('Prioridad'), { target: { value: '10' } })
  expect(screen.getByRole('button', { name: /crear asignación/i })).not.toBeDisabled()
})

it('calls create with correct payload and closes on success', async () => {
  const onClose = vi.fn()
  wrap(<CreateAssignmentDrawer open={true} onClose={onClose} ruleSystemCode="ESP" />)
  await waitFor(() => screen.getByText('SALBASE — SAL_BASE'))

  fireEvent.change(screen.getByLabelText('Concepto'), { target: { value: 'SALBASE' } })
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2025-01-01' } })
  fireEvent.change(screen.getByLabelText('Prioridad'), { target: { value: '5' } })

  fireEvent.click(screen.getByRole('button', { name: /crear asignación/i }))

  await waitFor(() =>
    expect(assignmentsApi.create).toHaveBeenCalledWith('ESP', {
      conceptCode: 'SALBASE',
      companyCode: null,
      agreementCode: null,
      employeeTypeCode: null,
      validFrom: '2025-01-01',
      validTo: null,
      priority: 5,
    })
  )
  await waitFor(() => expect(onClose).toHaveBeenCalled())
})

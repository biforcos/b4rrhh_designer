# Rule System Selector + Assignment Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded `RULE_SYSTEM = 'ESP'` constant across all three pages with a global Zustand store backed by a real `GET /rule-systems` API call, and add a creation form to the Assignments page.

**Architecture:** A Zustand store with `zustand/middleware/persist` holds the selected `ruleSystemCode` and survives page refresh. The `NavSidebar` renders a small badge that opens a popover listing available rule systems. All three pages subscribe to the store. The Assignments page gains a `CreateAssignmentDrawer` component following the same fixed-div pattern as `CreateConceptDrawer`.

**Tech Stack:** React 19, TypeScript, Zustand 5, TanStack Query v5, Tailwind CSS, existing `apiFetch` client.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/api/ruleSystemsApi.ts` | Create | `GET /rule-systems` → `RuleSystemDto[]` |
| `src/ruleSystemStore.ts` | Create | Zustand store, persists selected code to localStorage |
| `src/app/layout/NavSidebar.tsx` | Modify | Add rule system badge + popover selector |
| `src/app/canvas/CanvasPage.tsx` | Modify | Replace constant with `useRuleSystemStore()` |
| `src/app/objects/ObjectsPage.tsx` | Modify | Replace constant with `useRuleSystemStore()` |
| `src/app/assignments/AssignmentsPage.tsx` | Modify | Replace constant, add "+ Asignación" button |
| `src/app/assignments/CreateAssignmentDrawer.tsx` | Create | Fixed-div creation form for assignments |

---

## Task 1: Rule systems API module

**Files:**
- Create: `src/api/ruleSystemsApi.ts`

- [ ] **Step 1: Create the API module**

```ts
// src/api/ruleSystemsApi.ts
import { apiFetch } from './client'

export interface RuleSystemDto {
  code: string
  name: string
  active: boolean
}

export const ruleSystemsApi = {
  list: () => apiFetch<RuleSystemDto[]>('/rule-systems'),
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/ruleSystemsApi.ts
git commit -m "feat: add ruleSystemsApi module"
```

---

## Task 2: Zustand store for selected rule system

**Files:**
- Create: `src/ruleSystemStore.ts`

- [ ] **Step 1: Create the store**

```ts
// src/ruleSystemStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface RuleSystemState {
  ruleSystemCode: string
  setRuleSystemCode: (code: string) => void
}

export const useRuleSystemStore = create<RuleSystemState>()(
  persist(
    (set) => ({
      ruleSystemCode: 'ESP',
      setRuleSystemCode: (code) => set({ ruleSystemCode: code }),
    }),
    { name: 'b4rrhh-rule-system' }
  )
)
```

The `'ESP'` default is only used on first launch before the user selects one. Once the `NavSidebar` loads the list and auto-selects the first active rule system (Task 3), this default is overwritten.

- [ ] **Step 2: Commit**

```bash
git add src/ruleSystemStore.ts
git commit -m "feat: add ruleSystemStore with localStorage persistence"
```

---

## Task 3: NavSidebar — rule system selector

**Files:**
- Modify: `src/app/layout/NavSidebar.tsx`

The sidebar is 44 px wide (`w-11`). The selector is a small square button at the top showing the current code (up to 5 chars, truncated with `truncate`). Clicking opens a popover panel positioned to the right of the sidebar.

On mount the component calls `ruleSystemsApi.list()` via a `useQuery`. If the stored code is not in the returned list (e.g. first launch with default `'ESP'` but that doesn't exist), it auto-selects the first active rule system.

- [ ] **Step 1: Write failing test**

```tsx
// src/app/layout/NavSidebar.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { NavSidebar } from './NavSidebar'
import * as ruleSystemsApi from '../../api/ruleSystemsApi'
import { useRuleSystemStore } from '../../ruleSystemStore'

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><ui /></MemoryRouter>
    </QueryClientProvider>
  )
}

vi.mock('../../api/ruleSystemsApi')
beforeEach(() => {
  useRuleSystemStore.setState({ ruleSystemCode: 'ESP' })
  vi.mocked(ruleSystemsApi.ruleSystemsApi.list).mockResolvedValue([
    { code: 'ESP', name: 'España', active: true },
    { code: 'PRT', name: 'Portugal', active: true },
  ])
})

it('shows current rule system code as badge', async () => {
  wrap(<NavSidebar />)
  await waitFor(() => expect(screen.getByTitle(/ESP/)).toBeInTheDocument())
})

it('opens popover with rule system list on click', async () => {
  wrap(<NavSidebar />)
  await waitFor(() => screen.getByTitle(/ESP/))
  await userEvent.click(screen.getByTitle(/ESP/))
  expect(screen.getByText('España')).toBeInTheDocument()
  expect(screen.getByText('Portugal')).toBeInTheDocument()
})

it('updates store when a different rule system is selected', async () => {
  wrap(<NavSidebar />)
  await waitFor(() => screen.getByTitle(/ESP/))
  await userEvent.click(screen.getByTitle(/ESP/))
  await userEvent.click(screen.getByText('Portugal'))
  expect(useRuleSystemStore.getState().ruleSystemCode).toBe('PRT')
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/app/layout/NavSidebar.test.tsx
```
Expected: FAIL (NavSidebar.test.tsx does not exist yet / component missing selector)

- [ ] **Step 3: Implement the selector in NavSidebar**

Replace the existing `NavSidebar.tsx` with:

```tsx
import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Network, List, ClipboardList, LogOut } from 'lucide-react'
import { authStore } from '../../auth/authStore'
import { ruleSystemsApi } from '../../api/ruleSystemsApi'
import { useRuleSystemStore } from '../../ruleSystemStore'

const NAV_ITEMS = [
  { to: '/canvas', icon: Network, label: 'Canvas' },
  { to: '/objects', icon: List, label: 'Objetos' },
  { to: '/assignments', icon: ClipboardList, label: 'Asignaciones' },
]

export function NavSidebar() {
  const navigate = useNavigate()
  const { ruleSystemCode, setRuleSystemCode } = useRuleSystemStore()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const { data: ruleSystems = [] } = useQuery({
    queryKey: ['rule-systems'],
    queryFn: ruleSystemsApi.list,
  })

  // Auto-select first active rule system if stored code not in list
  useEffect(() => {
    if (ruleSystems.length === 0) return
    const found = ruleSystems.find(rs => rs.code === ruleSystemCode && rs.active)
    if (!found) {
      const first = ruleSystems.find(rs => rs.active)
      if (first) setRuleSystemCode(first.code)
    }
  }, [ruleSystems, ruleSystemCode, setRuleSystemCode])

  // Close popover on outside click
  useEffect(() => {
    if (!popoverOpen) return
    function onPointerDown(e: PointerEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [popoverOpen])

  function handleLogout() {
    authStore.clear()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="w-11 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3 gap-1 flex-shrink-0">
      <div className="text-sky-400 text-lg font-bold mb-1">⬡</div>

      {/* Rule system badge */}
      <div ref={popoverRef} className="relative mb-2">
        <button
          type="button"
          title={`Rule system: ${ruleSystemCode}`}
          onClick={() => setPopoverOpen(o => !o)}
          className="w-8 h-6 rounded text-[9px] font-bold bg-sky-950 border border-sky-800 text-sky-300 hover:bg-sky-900 truncate px-1"
        >
          {ruleSystemCode}
        </button>
        {popoverOpen && (
          <div className="absolute left-full top-0 ml-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[140px]">
            <div className="text-[9px] uppercase tracking-widest text-slate-500 px-3 pt-2 pb-1">
              Rule system
            </div>
            {ruleSystems.filter(rs => rs.active).map(rs => (
              <button
                key={rs.code}
                type="button"
                onClick={() => { setRuleSystemCode(rs.code); setPopoverOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-800 flex items-center gap-2 ${rs.code === ruleSystemCode ? 'text-sky-400' : 'text-slate-300'}`}
              >
                <span className="font-mono text-[10px] text-slate-500 w-8 shrink-0">{rs.code}</span>
                <span className="truncate">{rs.name}</span>
                {rs.code === ruleSystemCode && <span className="ml-auto text-sky-500">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          title={label}
          className={({ isActive }) =>
            `w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors ${isActive ? 'bg-sky-950 text-sky-400' : ''}`
          }
        >
          <Icon size={16} />
        </NavLink>
      ))}
      <div className="flex-1" />
      <button
        type="button"
        onClick={handleLogout}
        title={`Cerrar sesión (${authStore.getSubject() ?? ''})`}
        className="w-8 h-8 rounded-md flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-slate-800 transition-colors"
      >
        <LogOut size={16} />
      </button>
    </nav>
  )
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run src/app/layout/NavSidebar.test.tsx
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/layout/NavSidebar.tsx src/app/layout/NavSidebar.test.tsx
git commit -m "feat: add rule system selector to NavSidebar"
```

---

## Task 4: Wire store into CanvasPage, ObjectsPage, AssignmentsPage

**Files:**
- Modify: `src/app/canvas/CanvasPage.tsx`
- Modify: `src/app/objects/ObjectsPage.tsx`
- Modify: `src/app/assignments/AssignmentsPage.tsx`

In each file: remove `const RULE_SYSTEM = 'ESP'` and add `const { ruleSystemCode } = useRuleSystemStore()` at the top of the component. Replace all `RULE_SYSTEM` references with `ruleSystemCode`. Also add a `key={ruleSystemCode}` prop to the root element of each page so React fully remounts when the rule system changes (this resets all local state such as selected node in CanvasPage).

- [ ] **Step 1: Update CanvasPage**

At the top of `CanvasPage()`:
```tsx
// Remove: const RULE_SYSTEM = 'ESP'
// Add import: import { useRuleSystemStore } from '../../ruleSystemStore'
// Add inside component: const { ruleSystemCode } = useRuleSystemStore()
// Replace every RULE_SYSTEM reference with ruleSystemCode
// Add key={ruleSystemCode} to the outermost <div className="flex h-full">
```

The `onNodeDragStop` callback and `savePositions` call both already use the variable — no other logic changes.

- [ ] **Step 2: Update ObjectsPage**

```tsx
// Remove: const RULE_SYSTEM = 'ESP'
// Add import: import { useRuleSystemStore } from '../../ruleSystemStore'
// Add inside component: const { ruleSystemCode } = useRuleSystemStore()
// Replace RULE_SYSTEM → ruleSystemCode in useQuery and objectsApi.list call
// Add key={ruleSystemCode} to outermost <div className="p-4">
```

- [ ] **Step 3: Run type check and tests**

```bash
npx tsc --noEmit
npx vitest run
```
Expected: no errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/canvas/CanvasPage.tsx src/app/objects/ObjectsPage.tsx
git commit -m "feat: replace hardcoded RULE_SYSTEM constant with global store in CanvasPage and ObjectsPage"
```

---

## Task 5: CreateAssignmentDrawer

**Files:**
- Create: `src/app/assignments/CreateAssignmentDrawer.tsx`
- Modify: `src/app/assignments/AssignmentsPage.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// src/app/assignments/CreateAssignmentDrawer.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { CreateAssignmentDrawer } from './CreateAssignmentDrawer'
import * as conceptsApi from '../canvas/api/conceptsApi'
import * as assignmentsApi from './api/assignmentsApi'

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

vi.mock('../canvas/api/conceptsApi')
vi.mock('./api/assignmentsApi')

beforeEach(() => {
  vi.mocked(conceptsApi.conceptsApi.listConcepts).mockResolvedValue([
    { conceptCode: 'SALBASE', conceptMnemonic: 'SAL_BASE', calculationType: 'DIRECT_AMOUNT', functionalNature: 'EARNING', resultCompositionMode: 'REPLACE', executionScope: 'PERIOD', payslipOrderCode: null, persistToConcepts: true },
  ])
  vi.mocked(assignmentsApi.assignmentsApi.create).mockResolvedValue({
    assignmentCode: 'uuid-1', ruleSystemCode: 'ESP', conceptCode: 'SALBASE',
    companyCode: null, agreementCode: null, employeeTypeCode: null,
    validFrom: '2025-01-01', validTo: null, priority: 1,
  })
})

it('renders nothing when closed', () => {
  wrap(<CreateAssignmentDrawer open={false} onClose={() => {}} ruleSystemCode="ESP" />)
  expect(screen.queryByText('Nueva asignación')).not.toBeInTheDocument()
})

it('renders form when open', async () => {
  wrap(<CreateAssignmentDrawer open={true} onClose={() => {}} ruleSystemCode="ESP" />)
  await waitFor(() => expect(screen.getByText('Nueva asignación')).toBeInTheDocument())
  expect(screen.getByLabelText(/Concepto/)).toBeInTheDocument()
  expect(screen.getByLabelText(/Desde/)).toBeInTheDocument()
  expect(screen.getByLabelText(/Prioridad/)).toBeInTheDocument()
})

it('submit button is disabled until required fields are filled', async () => {
  wrap(<CreateAssignmentDrawer open={true} onClose={() => {}} ruleSystemCode="ESP" />)
  await waitFor(() => screen.getByText('Nueva asignación'))
  expect(screen.getByRole('button', { name: /Crear/ })).toBeDisabled()
})

it('calls create API and closes on success', async () => {
  const onClose = vi.fn()
  wrap(<CreateAssignmentDrawer open={true} onClose={onClose} ruleSystemCode="ESP" />)
  await waitFor(() => screen.getByText('Nueva asignación'))

  await userEvent.selectOptions(screen.getByLabelText(/Concepto/), 'SALBASE')
  await userEvent.type(screen.getByLabelText(/Desde/), '2025-01-01')
  await userEvent.clear(screen.getByLabelText(/Prioridad/))
  await userEvent.type(screen.getByLabelText(/Prioridad/), '10')

  await userEvent.click(screen.getByRole('button', { name: /Crear/ }))
  await waitFor(() => expect(assignmentsApi.assignmentsApi.create).toHaveBeenCalledWith(
    'ESP',
    expect.objectContaining({ conceptCode: 'SALBASE', priority: 10 })
  ))
  await waitFor(() => expect(onClose).toHaveBeenCalled())
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/app/assignments/CreateAssignmentDrawer.test.tsx
```
Expected: FAIL (component not created yet)

- [ ] **Step 3: Implement CreateAssignmentDrawer**

```tsx
// src/app/assignments/CreateAssignmentDrawer.tsx
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { conceptsApi } from '../canvas/api/conceptsApi'
import { assignmentsApi } from './api/assignmentsApi'

interface Props {
  open: boolean
  onClose: () => void
  ruleSystemCode: string
}

export function CreateAssignmentDrawer({ open, onClose, ruleSystemCode }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    conceptCode: '',
    companyCode: '',
    agreementCode: '',
    employeeTypeCode: '',
    validFrom: '',
    validTo: '',
    priority: '',
  })

  const { data: concepts = [] } = useQuery({
    queryKey: ['concepts', ruleSystemCode],
    queryFn: () => conceptsApi.listConcepts(ruleSystemCode),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: () => assignmentsApi.create(ruleSystemCode, {
      conceptCode: form.conceptCode,
      companyCode: form.companyCode || null,
      agreementCode: form.agreementCode || null,
      employeeTypeCode: form.employeeTypeCode || null,
      validFrom: form.validFrom,
      validTo: form.validTo || null,
      priority: parseInt(form.priority, 10),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', ruleSystemCode] })
      onClose()
    },
  })

  if (!open) return null

  const isValid = form.conceptCode !== '' && form.validFrom !== '' && form.priority !== ''

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col bg-slate-900 border-l border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-base font-medium text-slate-200">Nueva asignación</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
          <div>
            <Label htmlFor="conceptCode" className="text-slate-400">Concepto</Label>
            <select
              id="conceptCode"
              value={form.conceptCode}
              onChange={e => setForm(f => ({ ...f, conceptCode: e.target.value }))}
              className="mt-1 w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-600"
            >
              <option value="">— selecciona un concepto —</option>
              {concepts.map(c => (
                <option key={c.conceptCode} value={c.conceptCode}>
                  {c.conceptCode} — {c.conceptMnemonic}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="companyCode" className="text-slate-400">Empresa</Label>
            <Input
              id="companyCode"
              className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              placeholder="* cualquier empresa"
              value={form.companyCode}
              onChange={e => setForm(f => ({ ...f, companyCode: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="agreementCode" className="text-slate-400">Convenio</Label>
            <Input
              id="agreementCode"
              className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              placeholder="* cualquier convenio"
              value={form.agreementCode}
              onChange={e => setForm(f => ({ ...f, agreementCode: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="employeeTypeCode" className="text-slate-400">Tipo de empleado</Label>
            <Input
              id="employeeTypeCode"
              className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              placeholder="* cualquier tipo"
              value={form.employeeTypeCode}
              onChange={e => setForm(f => ({ ...f, employeeTypeCode: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="validFrom" className="text-slate-400">Desde</Label>
            <Input
              id="validFrom"
              type="date"
              className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              value={form.validFrom}
              onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="validTo" className="text-slate-400">Hasta (opcional)</Label>
            <Input
              id="validTo"
              type="date"
              className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              value={form.validTo}
              onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="priority" className="text-slate-400">Prioridad</Label>
            <Input
              id="priority"
              type="number"
              min={1}
              className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            />
          </div>

          {mutation.isError && (
            <div className="text-red-400 text-xs">Error al crear la asignación</div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !isValid}
            className="w-full bg-sky-600 hover:bg-sky-500"
          >
            {mutation.isPending ? 'Creando...' : 'Crear asignación'}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full border-slate-700 text-slate-300">
            Cancelar
          </Button>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Wire CreateAssignmentDrawer into AssignmentsPage**

Add `useState` for `drawerOpen`, import `CreateAssignmentDrawer`, add the `+ Asignación` button in the header, add `validTo` column to the table, render `<CreateAssignmentDrawer>` at the bottom of the return. Full updated `AssignmentsPage`:

```tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentsApi } from './api/assignmentsApi'
import { useRuleSystemStore } from '../../ruleSystemStore'
import { CreateAssignmentDrawer } from './CreateAssignmentDrawer'

export function AssignmentsPage() {
  const { ruleSystemCode } = useRuleSystemStore()
  const qc = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data = [], isLoading } = useQuery({
    queryKey: ['assignments', ruleSystemCode],
    queryFn: () => assignmentsApi.list(ruleSystemCode),
  })

  const deleteMutation = useMutation({
    mutationFn: (assignmentCode: string) => assignmentsApi.delete(ruleSystemCode, assignmentCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments', ruleSystemCode] }),
  })

  return (
    <div className="p-4" key={ruleSystemCode}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-slate-200 font-semibold">Reglas de asignación</h1>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-700"
        >
          + Asignación
        </button>
      </div>

      {isLoading ? (
        <div className="text-slate-500 text-sm">Cargando...</div>
      ) : (
        <table className="w-full text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="text-slate-500 text-left border-b border-slate-800">
              <th className="pb-2 pr-3">Concepto</th>
              <th className="pb-2 pr-3">Empresa</th>
              <th className="pb-2 pr-3">Convenio</th>
              <th className="pb-2 pr-3">Tipo emp.</th>
              <th className="pb-2 pr-3">Desde</th>
              <th className="pb-2 pr-3">Hasta</th>
              <th className="pb-2 pr-3">Prioridad</th>
              <th className="pb-2" aria-label="Acciones"></th>
            </tr>
          </thead>
          <tbody>
            {data.map(a => (
              <tr key={a.assignmentCode} className="border-b border-slate-900 hover:bg-slate-900/50">
                <td className="py-1.5 pr-3 font-mono text-sky-400">{a.conceptCode}</td>
                <td className="py-1.5 pr-3 text-slate-500">{a.companyCode ?? '*'}</td>
                <td className="py-1.5 pr-3 text-slate-500">{a.agreementCode ?? '*'}</td>
                <td className="py-1.5 pr-3 text-slate-500">{a.employeeTypeCode ?? '*'}</td>
                <td className="py-1.5 pr-3 text-slate-400">{a.validFrom}</td>
                <td className="py-1.5 pr-3 text-slate-400">{a.validTo ?? '—'}</td>
                <td className="py-1.5 pr-3 text-slate-400">{a.priority}</td>
                <td className="py-1.5">
                  <button type="button" onClick={() => deleteMutation.mutate(a.assignmentCode)}
                    className="text-red-500 hover:text-red-400 text-[10px]">⊗</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <CreateAssignmentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ruleSystemCode={ruleSystemCode}
      />
    </div>
  )
}
```

- [ ] **Step 5: Run type check and tests**

```bash
npx tsc --noEmit
npx vitest run
```
Expected: no errors, all tests pass including the 4 new CreateAssignmentDrawer tests.

- [ ] **Step 6: Commit**

```bash
git add src/app/assignments/CreateAssignmentDrawer.tsx src/app/assignments/CreateAssignmentDrawer.test.tsx src/app/assignments/AssignmentsPage.tsx
git commit -m "feat: add CreateAssignmentDrawer and wire into AssignmentsPage"
```

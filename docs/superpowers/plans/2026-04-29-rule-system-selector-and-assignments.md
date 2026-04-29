# Rule System Selector + Assignment Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded `RULE_SYSTEM = 'ESP'` constant in all three pages with a global Zustand store driven by a real `GET /rule-systems` API call, and add a creation panel to the Assignments page.

**Architecture:** A new Zustand store (`ruleSystemStore.ts`) with `zustand/middleware/persist` holds the selected `ruleSystemCode` and survives page refresh. The `NavSidebar` shows a badge with the current code that opens a popover listing all active rule systems from the API. All three pages (`CanvasPage`, `ObjectsPage`, `AssignmentsPage`) subscribe to the store. TanStack Query's reactive `queryKey` handles data refresh automatically when the selection changes. The new `CreateAssignmentDrawer` follows the fixed-div pattern of `CreateConceptDrawer`.

**Tech Stack:** React 19, TypeScript, Zustand 5 + persist middleware, TanStack Query v5, Vitest + React Testing Library, Tailwind CSS, existing `apiFetch` client.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/api/ruleSystemsApi.ts` | **Create** | `GET /rule-systems` → `RuleSystemDto[]` |
| `src/ruleSystemStore.ts` | **Create** | Zustand store; persists `ruleSystemCode` to localStorage key `b4rrhh-rule-system` |
| `src/app/layout/NavSidebar.tsx` | **Modify** | Add badge + popover rule system selector |
| `src/app/layout/NavSidebar.test.tsx` | **Create** | Tests for badge display, popover, store update, auto-select |
| `src/app/canvas/CanvasPage.tsx` | **Modify** | Replace `RULE_SYSTEM` constant with store hook |
| `src/app/objects/ObjectsPage.tsx` | **Modify** | Replace `RULE_SYSTEM` constant with store hook |
| `src/app/assignments/AssignmentsPage.tsx` | **Modify** | Replace constant, add `+ Asignación` button, add `validTo` column |
| `src/app/assignments/CreateAssignmentDrawer.tsx` | **Create** | Fixed-div creation form; concept dropdown from API |
| `src/app/assignments/CreateAssignmentDrawer.test.tsx` | **Create** | Tests for form validation and API call |

---

## Task 1: ruleSystemsApi module

**Files:**
- Create: `src/api/ruleSystemsApi.ts`

No test — this is a one-line passthrough with no branching logic.

- [ ] **Step 1: Create the file**

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

- [ ] **Step 2: Verify TypeScript is clean**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/api/ruleSystemsApi.ts
git commit -m "feat: add ruleSystemsApi module"
```

---

## Task 2: ruleSystemStore

**Files:**
- Create: `src/ruleSystemStore.ts`

No test — this is pure Zustand configuration with no branching logic.

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

The `'ESP'` default is only used on the very first launch before the NavSidebar loads the list and auto-selects the first active rule system (Task 3). Once auto-selected, the store persists the real selection.

- [ ] **Step 2: Verify TypeScript is clean**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/ruleSystemStore.ts
git commit -m "feat: add ruleSystemStore with localStorage persistence"
```

---

## Task 3: NavSidebar — rule system badge and popover

**Files:**
- Modify: `src/app/layout/NavSidebar.tsx`
- Create: `src/app/layout/NavSidebar.test.tsx`

The sidebar is 44 px wide (`w-11`). The selector is a small button showing the current code (≤ 5 chars). Clicking opens a panel to the right of the sidebar listing all active rule systems from `GET /rule-systems`. On mount, if the stored code is not in the returned list, the first active system is auto-selected.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/app/layout/NavSidebar.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { NavSidebar } from './NavSidebar'
import { ruleSystemsApi } from '../../api/ruleSystemsApi'
import { useRuleSystemStore } from '../../ruleSystemStore'

vi.mock('../../api/ruleSystemsApi', () => ({
  ruleSystemsApi: { list: vi.fn() },
}))

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  useRuleSystemStore.setState({ ruleSystemCode: 'ESP' })
  vi.mocked(ruleSystemsApi.list).mockResolvedValue([
    { code: 'ESP', name: 'España', active: true },
    { code: 'PRT', name: 'Portugal', active: true },
  ])
})

it('shows current rule system code as badge', async () => {
  wrap(<NavSidebar />)
  await waitFor(() => expect(screen.getByTitle('Rule system: ESP')).toBeInTheDocument())
})

it('opens popover with rule system list on badge click', async () => {
  wrap(<NavSidebar />)
  await waitFor(() => screen.getByTitle('Rule system: ESP'))
  fireEvent.click(screen.getByTitle('Rule system: ESP'))
  expect(screen.getByText('España')).toBeInTheDocument()
  expect(screen.getByText('Portugal')).toBeInTheDocument()
})

it('updates store and closes popover when a rule system is selected', async () => {
  wrap(<NavSidebar />)
  await waitFor(() => screen.getByTitle('Rule system: ESP'))
  fireEvent.click(screen.getByTitle('Rule system: ESP'))
  fireEvent.click(screen.getByText('Portugal'))
  expect(useRuleSystemStore.getState().ruleSystemCode).toBe('PRT')
  expect(screen.queryByText('España')).not.toBeInTheDocument()
})

it('auto-selects first active system when stored code is not in list', async () => {
  useRuleSystemStore.setState({ ruleSystemCode: 'UNKNOWN' })
  wrap(<NavSidebar />)
  await waitFor(() =>
    expect(useRuleSystemStore.getState().ruleSystemCode).toBe('ESP')
  )
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/app/layout/NavSidebar.test.tsx
```
Expected: FAIL — `NavSidebar` doesn't yet have the badge or popover.

- [ ] **Step 3: Implement the updated NavSidebar**

Replace the entire content of `src/app/layout/NavSidebar.tsx`:

```tsx
// src/app/layout/NavSidebar.tsx
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

  useEffect(() => {
    if (ruleSystems.length === 0) return
    const found = ruleSystems.find(rs => rs.code === ruleSystemCode && rs.active)
    if (!found) {
      const first = ruleSystems.find(rs => rs.active)
      if (first) setRuleSystemCode(first.code)
    }
  }, [ruleSystems, ruleSystemCode, setRuleSystemCode])

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
          <div className="absolute left-full top-0 ml-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[160px]">
            <div className="text-[9px] uppercase tracking-widest text-slate-500 px-3 pt-2 pb-1">
              Rule system
            </div>
            {ruleSystems.filter(rs => rs.active).map(rs => (
              <button
                key={rs.code}
                type="button"
                onClick={() => { setRuleSystemCode(rs.code); setPopoverOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-800 flex items-center gap-2 ${
                  rs.code === ruleSystemCode ? 'text-sky-400' : 'text-slate-300'
                }`}
              >
                <span className="font-mono text-[10px] text-slate-500 w-8 shrink-0">{rs.code}</span>
                <span className="truncate">{rs.name}</span>
                {rs.code === ruleSystemCode && <span className="ml-auto text-sky-500 text-[10px]">✓</span>}
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

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/app/layout/NavSidebar.test.tsx
```
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout/NavSidebar.tsx src/app/layout/NavSidebar.test.tsx
git commit -m "feat: add rule system selector badge and popover to NavSidebar"
```

---

## Task 4: Wire ruleSystemStore into CanvasPage and ObjectsPage

**Files:**
- Modify: `src/app/canvas/CanvasPage.tsx`
- Modify: `src/app/objects/ObjectsPage.tsx`

No new tests needed — the query keys already contain `ruleSystemCode`, so TanStack Query refetches automatically when the store changes. Existing tests pass `ruleSystemCode` directly as a prop to sub-components and are not affected.

- [ ] **Step 1: Update CanvasPage**

In `src/app/canvas/CanvasPage.tsx`:

1. Add import at the top (after existing imports):
```tsx
import { useRuleSystemStore } from '../../ruleSystemStore'
```

2. Remove the module-level constant:
```tsx
// DELETE this line:
const RULE_SYSTEM = 'ESP'
```

3. Add inside the `CanvasPage` function body, before the existing hooks:
```tsx
const { ruleSystemCode } = useRuleSystemStore()
```

4. Replace every remaining `RULE_SYSTEM` with `ruleSystemCode`. The full set of occurrences:
   - `useConceptGraph(RULE_SYSTEM)` → `useConceptGraph(ruleSystemCode)`
   - `useSaveGraph(RULE_SYSTEM)` → `useSaveGraph(ruleSystemCode)`
   - Inside `onNodeDragStop`: `savePositions(RULE_SYSTEM, nodes)` → `savePositions(ruleSystemCode, nodes)`; also add `ruleSystemCode` to the `useCallback` dependency array: `}, [ruleSystemCode, nodes])`
   - `ruleSystemCode={RULE_SYSTEM}` on `<CreateConceptDrawer>` → `ruleSystemCode={ruleSystemCode}`
   - `ruleSystemCode={RULE_SYSTEM}` on `<ConceptDetailPanel>` → `ruleSystemCode={ruleSystemCode}`

- [ ] **Step 2: Update ObjectsPage**

In `src/app/objects/ObjectsPage.tsx`:

1. Add import:
```tsx
import { useRuleSystemStore } from '../../ruleSystemStore'
```

2. Remove:
```tsx
// DELETE this line:
const RULE_SYSTEM = 'ESP'
```

3. Add inside `ObjectsPage` function body, before the `useState`:
```tsx
const { ruleSystemCode } = useRuleSystemStore()
```

4. Replace both occurrences of `RULE_SYSTEM`:
   - `queryKey: ['objects', RULE_SYSTEM, tab]` → `queryKey: ['objects', ruleSystemCode, tab]`
   - `objectsApi.list(RULE_SYSTEM, tab)` → `objectsApi.list(ruleSystemCode, tab)`

- [ ] **Step 3: Run type check and full test suite**

```bash
npx tsc --noEmit && npx vitest run
```
Expected: no TypeScript errors, all existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/canvas/CanvasPage.tsx src/app/objects/ObjectsPage.tsx
git commit -m "feat: replace hardcoded RULE_SYSTEM with global store in CanvasPage and ObjectsPage"
```

---

## Task 5: CreateAssignmentDrawer and AssignmentsPage

**Files:**
- Create: `src/app/assignments/CreateAssignmentDrawer.tsx`
- Create: `src/app/assignments/CreateAssignmentDrawer.test.tsx`
- Modify: `src/app/assignments/AssignmentsPage.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/app/assignments/CreateAssignmentDrawer.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/app/assignments/CreateAssignmentDrawer.test.tsx
```
Expected: FAIL — component does not exist yet.

- [ ] **Step 3: Create CreateAssignmentDrawer**

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
    mutationFn: () =>
      assignmentsApi.create(ruleSystemCode, {
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
              aria-label="Concepto"
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

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/app/assignments/CreateAssignmentDrawer.test.tsx
```
Expected: PASS — 4 tests.

- [ ] **Step 5: Replace AssignmentsPage**

Replace the entire content of `src/app/assignments/AssignmentsPage.tsx`:

```tsx
// src/app/assignments/AssignmentsPage.tsx
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
    <div className="p-4">
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
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(a.assignmentCode)}
                    className="text-red-500 hover:text-red-400 text-[10px]"
                  >
                    ⊗
                  </button>
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

- [ ] **Step 6: Run type check and full test suite**

```bash
npx tsc --noEmit && npx vitest run
```
Expected: no TypeScript errors, all tests pass (17 existing + 4 NavSidebar + 4 CreateAssignmentDrawer = 25 total).

- [ ] **Step 7: Commit**

```bash
git add src/app/assignments/CreateAssignmentDrawer.tsx src/app/assignments/CreateAssignmentDrawer.test.tsx src/app/assignments/AssignmentsPage.tsx
git commit -m "feat: add CreateAssignmentDrawer and wire ruleSystemStore into AssignmentsPage"
```

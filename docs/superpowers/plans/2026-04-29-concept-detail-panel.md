# Concept Detail Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show all concept fields in the right-side panel, enable two-step inline deletion (disabled when concept has dependents), and fix the CreateConceptDrawer dropdown bug.

**Architecture:** Extract shared label maps to `conceptLabels.ts`, expand `ConceptNodeData` with three missing fields, replace the inline `<aside>` in `CanvasPage` with a new `ConceptDetailPanel` component that owns all detail-view and delete logic.

**Tech Stack:** React 19, TypeScript, @tanstack/react-query v5, vaul (drawer), @base-ui/react/select, Vitest + @testing-library/react, Tailwind CSS v4.

---

### Task 1: Fix dropdown bug in CreateConceptDrawer

Dropdowns don't open because `vaul`'s `<Drawer>` runs in modal mode by default, which sets `pointer-events: none` on everything outside the drawer. The `@base-ui/react/select` dropdown portal renders into `document.body` — outside the drawer — so clicks on it are blocked. Fix: `modal={false}` on the `<Drawer>`.

**Files:**
- Modify: `src/app/canvas/CreateConceptDrawer.tsx:36`

- [ ] **Step 1: Apply the fix**

In `src/app/canvas/CreateConceptDrawer.tsx`, change line 36 from:

```tsx
    <Drawer open={open} onClose={onClose} direction="right">
```

to:

```tsx
    <Drawer open={open} onClose={onClose} direction="right" modal={false}>
```

- [ ] **Step 2: Run existing tests to confirm nothing broke**

```bash
cd b4rrhh_designer
npx vitest run
```

Expected: all 4 tests in `ConceptNode.test.tsx` pass, 0 failures.

- [ ] **Step 3: Commit**

```bash
git add src/app/canvas/CreateConceptDrawer.tsx
git commit -m "fix: disable vaul modal mode so dropdown portals receive pointer events"
```

---

### Task 2: Create `conceptLabels.ts`

Extract `NATURE_LABELS` and `NATURE_COLORS` from `CanvasPage.tsx` into a shared module, and add `COMPOSITION_LABELS` and `SCOPE_LABELS` for the new fields.

**Files:**
- Create: `src/app/canvas/conceptLabels.test.ts`
- Create: `src/app/canvas/conceptLabels.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/canvas/conceptLabels.test.ts`:

```ts
import { NATURE_LABELS, NATURE_COLORS, COMPOSITION_LABELS, SCOPE_LABELS } from './conceptLabels'

describe('conceptLabels', () => {
  it('NATURE_LABELS has a Spanish label for every FunctionalNature value', () => {
    const natures = ['EARNING', 'DEDUCTION', 'BASE', 'INFORMATIONAL', 'TECHNICAL', 'TOTAL_EARNING', 'TOTAL_DEDUCTION', 'NET_PAY']
    natures.forEach(k => expect(NATURE_LABELS).toHaveProperty(k))
  })

  it('NATURE_COLORS has a Tailwind class for every FunctionalNature value', () => {
    const natures = ['EARNING', 'DEDUCTION', 'BASE', 'INFORMATIONAL', 'TECHNICAL', 'TOTAL_EARNING', 'TOTAL_DEDUCTION', 'NET_PAY']
    natures.forEach(k => expect(NATURE_COLORS).toHaveProperty(k))
  })

  it('COMPOSITION_LABELS maps REPLACE and ACCUMULATE to Spanish', () => {
    expect(COMPOSITION_LABELS.REPLACE).toBe('Reemplaza')
    expect(COMPOSITION_LABELS.ACCUMULATE).toBe('Acumula')
  })

  it('SCOPE_LABELS maps SEGMENT and PERIOD to Spanish', () => {
    expect(SCOPE_LABELS.SEGMENT).toBe('Segmento')
    expect(SCOPE_LABELS.PERIOD).toBe('Período')
  })
})
```

- [ ] **Step 2: Run to verify the test fails**

```bash
npx vitest run src/app/canvas/conceptLabels.test.ts
```

Expected: FAIL — "Cannot find module './conceptLabels'"

- [ ] **Step 3: Create `conceptLabels.ts`**

Create `src/app/canvas/conceptLabels.ts`:

```ts
import type { FunctionalNature, ResultCompositionMode, ExecutionScope } from './types'

export const NATURE_LABELS: Record<FunctionalNature, string> = {
  EARNING:          'Devengo',
  DEDUCTION:        'Deducción',
  BASE:             'Base',
  INFORMATIONAL:    'Informativo',
  TECHNICAL:        'Técnico',
  TOTAL_EARNING:    'Total devengos',
  TOTAL_DEDUCTION:  'Total deducciones',
  NET_PAY:          'Líquido',
}

export const NATURE_COLORS: Record<FunctionalNature, string> = {
  EARNING:          'bg-sky-950 text-sky-400',
  DEDUCTION:        'bg-red-950 text-red-400',
  BASE:             'bg-violet-950 text-violet-400',
  INFORMATIONAL:    'bg-amber-950 text-amber-400',
  TECHNICAL:        'bg-slate-800 text-slate-400',
  TOTAL_EARNING:    'bg-green-950 text-green-400',
  TOTAL_DEDUCTION:  'bg-orange-950 text-orange-400',
  NET_PAY:          'bg-emerald-950 text-emerald-400',
}

export const COMPOSITION_LABELS: Record<ResultCompositionMode, string> = {
  REPLACE:    'Reemplaza',
  ACCUMULATE: 'Acumula',
}

export const SCOPE_LABELS: Record<ExecutionScope, string> = {
  SEGMENT: 'Segmento',
  PERIOD:  'Período',
}
```

- [ ] **Step 4: Run to verify the test passes**

```bash
npx vitest run src/app/canvas/conceptLabels.test.ts
```

Expected: PASS — 4 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/app/canvas/conceptLabels.ts src/app/canvas/conceptLabels.test.ts
git commit -m "feat: add conceptLabels module with shared label maps"
```

---

### Task 3: Expand `ConceptNodeData` and update the query mapping

Add `resultCompositionMode`, `executionScope`, and `payslipOrderCode` to the node data type and map them when building nodes from the API response. Also update the existing `ConceptNode` tests to include the new required fields.

**Files:**
- Modify: `src/app/canvas/types.ts:8-14`
- Modify: `src/app/canvas/useConceptsQuery.ts:4,48-53`
- Modify: `src/app/canvas/nodes/ConceptNode.test.tsx`

- [ ] **Step 1: Expand `ConceptNodeData` in `types.ts`**

In `src/app/canvas/types.ts`, replace the `ConceptNodeData` interface (lines 8–14):

```ts
export interface ConceptNodeData extends Record<string, unknown> {
  conceptCode: string
  conceptMnemonic: string
  calculationType: CalculationType
  functionalNature: FunctionalNature
  resultCompositionMode: ResultCompositionMode
  executionScope: ExecutionScope
  payslipOrderCode: string | null
  isDirty?: boolean
}
```

- [ ] **Step 2: Verify that the type change breaks the existing test (TypeScript)**

```bash
npx tsc --noEmit
```

Expected: TypeScript errors in `ConceptNode.test.tsx` — missing properties `resultCompositionMode`, `executionScope`, `payslipOrderCode` in the `data` objects.

- [ ] **Step 3: Update `ConceptNode.test.tsx` to include the new required fields**

Replace the entire content of `src/app/canvas/nodes/ConceptNode.test.tsx`:

```tsx
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

  it('no muestra puertos de entrada para JAVA_PROVIDED', () => {
    render(wrapInProvider(
      <ConceptNode
        id="d01"
        data={{ ...BASE_DATA, conceptCode: 'D01', conceptMnemonic: 'DIAS', calculationType: 'JAVA_PROVIDED', functionalNature: 'TECHNICAL' }}
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
})
```

- [ ] **Step 4: Update `useConceptsQuery.ts` to map the three new fields**

In `src/app/canvas/useConceptsQuery.ts`, update the import on line 4 to include the new types:

```ts
import type { ConceptFlowNode, ConceptFlowEdge, CalculationType, FunctionalNature, ResultCompositionMode, ExecutionScope } from './types'
```

Then replace the `data` block (lines 48–53) inside the `.map((c, i) => ({...}))` call:

```ts
        data: {
          conceptCode: c.conceptCode,
          conceptMnemonic: c.conceptMnemonic,
          calculationType: c.calculationType as CalculationType,
          functionalNature: c.functionalNature as FunctionalNature,
          resultCompositionMode: c.resultCompositionMode as ResultCompositionMode,
          executionScope: c.executionScope as ExecutionScope,
          payslipOrderCode: c.payslipOrderCode ?? null,
        },
```

- [ ] **Step 5: Verify TypeScript is clean**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

Expected: all 8 tests pass (4 ConceptNode + 4 conceptLabels).

- [ ] **Step 7: Commit**

```bash
git add src/app/canvas/types.ts src/app/canvas/useConceptsQuery.ts src/app/canvas/nodes/ConceptNode.test.tsx
git commit -m "feat: add resultCompositionMode, executionScope and payslipOrderCode to ConceptNodeData"
```

---

### Task 4: Create `ConceptDetailPanel`

The panel shows all concept fields read-only and handles two-step inline deletion. Delete is disabled when the concept is the `source` of any edge in the graph.

**Files:**
- Create: `src/app/canvas/ConceptDetailPanel.test.tsx`
- Create: `src/app/canvas/ConceptDetailPanel.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/app/canvas/ConceptDetailPanel.test.tsx`:

```tsx
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
    expect(screen.getByText('SB · SALARIO_BASE')).toBeInTheDocument()
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
})
```

- [ ] **Step 2: Run to verify the tests fail**

```bash
npx vitest run src/app/canvas/ConceptDetailPanel.test.tsx
```

Expected: FAIL — "Cannot find module './ConceptDetailPanel'"

- [ ] **Step 3: Implement `ConceptDetailPanel.tsx`**

Create `src/app/canvas/ConceptDetailPanel.tsx`:

```tsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { conceptsApi } from './api/conceptsApi'
import { NATURE_LABELS, COMPOSITION_LABELS, SCOPE_LABELS } from './conceptLabels'
import type { ConceptFlowNode, ConceptFlowEdge } from './types'

interface Props {
  node: ConceptFlowNode
  edges: ConceptFlowEdge[]
  ruleSystemCode: string
  onDeleted: () => void
}

export function ConceptDetailPanel({ node, edges, ruleSystemCode, onDeleted }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const qc = useQueryClient()

  const hasDependents = edges.some(e => e.source === node.id)
  const dependentCount = edges.filter(e => e.source === node.id).length

  const mutation = useMutation({
    mutationFn: () => conceptsApi.deleteConcept(ruleSystemCode, node.data.conceptCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['concepts', ruleSystemCode] })
      onDeleted()
    },
  })

  const d = node.data

  return (
    <aside className="w-52 bg-slate-900 border-l border-slate-800 p-3 text-xs overflow-y-auto flex-shrink-0">
      <div className="font-bold text-sky-400 mb-1">{d.conceptCode} · {d.conceptMnemonic}</div>
      <div className="text-slate-500 text-[9px] mb-3">PayrollConcept</div>
      <div className="space-y-2">
        <Field label="Tipo de cálculo" value={d.calculationType} />
        <Field label="Naturaleza" value={NATURE_LABELS[d.functionalNature] ?? d.functionalNature} />
        <Field label="Composición" value={COMPOSITION_LABELS[d.resultCompositionMode]} />
        <Field label="Ámbito" value={SCOPE_LABELS[d.executionScope]} />
        <Field label="Orden nómina" value={d.payslipOrderCode} />
      </div>
      <hr className="border-slate-800 my-3" />
      {!confirmDelete ? (
        <div>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={hasDependents || mutation.isPending}
            className="w-full text-[10px] border border-red-900 text-red-400 rounded px-2 py-1 hover:enabled:bg-red-950 disabled:border-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            🗑 Borrar concepto
          </button>
          {hasDependents && (
            <p className="text-slate-600 text-[9px] text-center mt-1">
              Usado por {dependentCount} {dependentCount === 1 ? 'concepto' : 'conceptos'}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full text-[10px] bg-red-900 border border-red-700 text-red-200 rounded px-2 py-1 hover:bg-red-800 disabled:opacity-50"
          >
            {mutation.isPending ? 'Borrando...' : '⚠ Confirmar borrado'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            disabled={mutation.isPending}
            className="w-full text-[10px] border border-slate-700 text-slate-400 rounded px-2 py-1 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <p className="text-slate-600 text-[9px] text-center">Esta acción no se puede deshacer</p>
          {mutation.isError && (
            <p className="text-red-400 text-[9px] text-center">Error al borrar el concepto</p>
          )}
        </div>
      )}
    </aside>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-slate-600 text-[9px] uppercase tracking-wide mb-0.5">{label}</div>
      {value != null
        ? <div className="bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{value}</div>
        : <div className="bg-slate-950 text-slate-600 px-1.5 py-0.5 rounded text-[10px] italic">—</div>
      }
    </div>
  )
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
npx vitest run src/app/canvas/ConceptDetailPanel.test.tsx
```

Expected: PASS — 7 tests, 0 failures.

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: all 15 tests pass (4 ConceptNode + 4 conceptLabels + 7 ConceptDetailPanel).

- [ ] **Step 6: Commit**

```bash
git add src/app/canvas/ConceptDetailPanel.tsx src/app/canvas/ConceptDetailPanel.test.tsx
git commit -m "feat: add ConceptDetailPanel with full fields and two-step delete"
```

---

### Task 5: Wire `CanvasPage` to use `ConceptDetailPanel`

Replace the inline `<aside>` and `Field` helper with `<ConceptDetailPanel>`, and import `NATURE_LABELS`/`NATURE_COLORS` from `conceptLabels.ts` instead of defining them inline.

**Files:**
- Modify: `src/app/canvas/CanvasPage.tsx`

- [ ] **Step 1: Update imports**

In `src/app/canvas/CanvasPage.tsx`, change the import block at the top. Replace:

```ts
import type { ConceptFlowNode, ConceptFlowEdge, FunctionalNature } from './types'
```

with:

```ts
import type { ConceptFlowNode, ConceptFlowEdge, FunctionalNature } from './types'
import { ConceptDetailPanel } from './ConceptDetailPanel'
import { NATURE_LABELS, NATURE_COLORS } from './conceptLabels'
```

- [ ] **Step 2: Remove the inline label constants**

Delete the `NATURE_LABELS` block (lines 17–26) and the `NATURE_COLORS` block (lines 28–37) from `CanvasPage.tsx`. They are now imported from `conceptLabels.ts`.

The result: after the imports, the file goes directly to `const ALL_NATURES = ...`.

- [ ] **Step 3: Replace the inline `<aside>` with `<ConceptDetailPanel>`**

At the bottom of the `return` block in `CanvasPage`, replace:

```tsx
      {selectedNode && (
        <aside className="w-52 bg-slate-900 border-l border-slate-800 p-3 text-xs overflow-y-auto flex-shrink-0">
          <div className="font-bold text-sky-400 mb-1">{selectedNode.data.conceptCode} · {selectedNode.data.conceptMnemonic}</div>
          <div className="text-slate-500 text-[9px] mb-3">PayrollConcept</div>
          <div className="space-y-2">
            <Field label="Tipo" value={selectedNode.data.calculationType} />
            <Field label="Naturaleza" value={NATURE_LABELS[selectedNode.data.functionalNature] ?? selectedNode.data.functionalNature} />
          </div>
        </aside>
      )}
```

with:

```tsx
      {selectedNode && (
        <ConceptDetailPanel
          node={selectedNode}
          edges={edges}
          ruleSystemCode={RULE_SYSTEM}
          onDeleted={() => {
            setNodes(ns => ns.filter(n => n.id !== selectedNode.id))
            setSelectedNode(null)
          }}
        />
      )}
```

- [ ] **Step 4: Remove the `Field` helper function**

Delete the `Field` function at the bottom of `CanvasPage.tsx` (lines 212–218 in the original file):

```tsx
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-slate-600 text-[9px] uppercase tracking-wide mb-0.5">{label}</div>
      <div className="bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{value}</div>
    </div>
  )
}
```

- [ ] **Step 5: Verify TypeScript is clean**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Run full test suite**

```bash
npx vitest run
```

Expected: all 15 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/app/canvas/CanvasPage.tsx
git commit -m "feat: wire ConceptDetailPanel into CanvasPage, replace inline aside"
```

---

## Self-check: Spec coverage

| Spec requirement | Task |
|-----------------|------|
| Fix dropdown bug (`modal={false}`) | Task 1 |
| `conceptLabels.ts` with NATURE_LABELS, NATURE_COLORS, COMPOSITION_LABELS, SCOPE_LABELS | Task 2 |
| Expand `ConceptNodeData` with 3 fields | Task 3 |
| Map new fields in `useConceptsQuery` | Task 3 |
| `ConceptDetailPanel` renders all 5 fields with correct labels | Task 4 |
| Shows "—" for null `payslipOrderCode` | Task 4 |
| Delete disabled + "Usado por N conceptos" when `hasDependents` | Task 4 |
| Two-step delete: confirm/cancel inline | Task 4 |
| Delete calls `conceptsApi.deleteConcept` then `onDeleted` | Task 4 |
| Wire `ConceptDetailPanel` into `CanvasPage` | Task 5 |
| Remove duplicate label constants from `CanvasPage` | Task 5 |

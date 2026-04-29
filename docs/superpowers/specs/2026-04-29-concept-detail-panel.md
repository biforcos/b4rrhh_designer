# Concept Detail Panel — Design Spec

**Date:** 2026-04-29

## Goal

Enhance the right-side detail panel in the payroll designer canvas to show all concept fields, and allow deleting a concept when it has no dependents — using a two-step inline confirmation.

## Scope

Two independent concerns bundled together because they touch the same files:

1. **Dropdown bug fix** — `CreateConceptDrawer` dropdowns don't open (vaul modal blocks portal events).
2. **Detail panel** — show all concept fields, extract to its own component, add two-step delete.

---

## Bug: Dropdowns in CreateConceptDrawer

**Cause:** `vaul`'s `<Drawer>` runs in modal mode by default. When open, it adds `pointer-events: none` (or equivalent inert behavior) to elements outside the drawer's DOM subtree. The `@base-ui/react/select` dropdowns render via `SelectPrimitive.Portal` into `document.body` — outside the drawer — so pointer events on the dropdown popup are blocked.

**Fix:** Add `modal={false}` to the `<Drawer>` in `CreateConceptDrawer.tsx`. This disables vaul's focus-trap and inert-outside behavior while keeping the drawer's visual appearance unchanged. The drawer already handles its own close-on-outside-click via its `onClose` prop.

**File:** `src/app/canvas/CreateConceptDrawer.tsx` — one-line change on the `<Drawer>` element.

---

## Data Model Changes

### `ConceptNodeData` (types.ts)

Add three fields that are currently fetched by the API but discarded:

```ts
export interface ConceptNodeData extends Record<string, unknown> {
  conceptCode: string
  conceptMnemonic: string
  calculationType: CalculationType
  functionalNature: FunctionalNature
  resultCompositionMode: ResultCompositionMode   // new
  executionScope: ExecutionScope                 // new
  payslipOrderCode: string | null               // new
  isDirty?: boolean
}
```

### `useConceptsQuery.ts`

Map the three new fields when building `ConceptFlowNode` objects:

```ts
data: {
  conceptCode: c.conceptCode,
  conceptMnemonic: c.conceptMnemonic,
  calculationType: c.calculationType as CalculationType,
  functionalNature: c.functionalNature as FunctionalNature,
  resultCompositionMode: c.resultCompositionMode as ResultCompositionMode,   // new
  executionScope: c.executionScope as ExecutionScope,                         // new
  payslipOrderCode: c.payslipOrderCode ?? null,                              // new
},
```

---

## New Component: `ConceptDetailPanel`

**File:** `src/app/canvas/ConceptDetailPanel.tsx`

### Props

```tsx
interface Props {
  node: ConceptFlowNode
  edges: ConceptFlowEdge[]
  ruleSystemCode: string
  onDeleted: () => void
}
```

### Dependency check

Computed from the in-memory graph — no extra API call:

```ts
const hasDependents = edges.some(e => e.source === node.id)
const dependentCount = edges.filter(e => e.source === node.id).length
```

A concept "has dependents" if it is the `source` of any edge (i.e., it feeds into or is an operand of another concept). It is safe to delete only when `hasDependents === false`.

### Fields displayed

All fields are read-only. Labels and value translations:

| Field | Label | Value display |
|-------|-------|---------------|
| `calculationType` | Tipo de cálculo | Raw enum value (RATE_BY_QUANTITY, etc.) |
| `functionalNature` | Naturaleza | Spanish label from `NATURE_LABELS` |
| `resultCompositionMode` | Composición | REPLACE → "Reemplaza" · ACCUMULATE → "Acumula" |
| `executionScope` | Ámbito | SEGMENT → "Segmento" · PERIOD → "Período" |
| `payslipOrderCode` | Orden nómina | Value, or "—" in muted color if null |

`NATURE_LABELS` is extracted from `CanvasPage.tsx` into a separate `src/app/canvas/conceptLabels.ts` file so both `CanvasPage` and `ConceptDetailPanel` can import it without duplication.

### Delete UX

Internal state: `confirmDelete: boolean` (initially `false`).

**Normal state** (`confirmDelete === false`):
- Button "🗑 Borrar concepto" — red outline, `disabled` when `hasDependents`
- If `hasDependents`: small muted note "Usado por N conceptos" below the button

**Confirming state** (`confirmDelete === true`):
- Button "⚠ Confirmar borrado" — solid red, triggers the delete mutation
- Button "Cancelar" — muted outline, sets `confirmDelete = false`
- Small text "Esta acción no se puede deshacer"

### Delete mutation

```ts
const mutation = useMutation({
  mutationFn: () => conceptsApi.deleteConcept(ruleSystemCode, node.data.conceptCode),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['concepts', ruleSystemCode] })
    onDeleted()
  },
})
```

`onDeleted()` is called in `CanvasPage` to:
1. Filter the deleted node from `nodes` state
2. Set `selectedNode` to `null`

### Panel width

Keeps `w-52` (existing). All new fields fit within this width.

---

## Changes to `CanvasPage.tsx`

- Remove the inline `<aside>` block and the `Field` helper function.
- Import and render `<ConceptDetailPanel>` with the required props.
- `onDeleted` is an inline callback that captures `selectedNode` via closure:

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

- Pass `edges` to `ConceptDetailPanel` for the dependency check.
- Import `NATURE_LABELS` and `NATURE_COLORS` from `conceptLabels.ts` instead of defining them inline.

---

## New File: `conceptLabels.ts`

**File:** `src/app/canvas/conceptLabels.ts`

Extracts label maps from `CanvasPage.tsx` so they can be shared:

```ts
export const NATURE_LABELS: Record<FunctionalNature, string> = { ... }
export const NATURE_COLORS: Record<FunctionalNature, string> = { ... }
export const COMPOSITION_LABELS: Record<ResultCompositionMode, string> = {
  REPLACE: 'Reemplaza',
  ACCUMULATE: 'Acumula',
}
export const SCOPE_LABELS: Record<ExecutionScope, string> = {
  SEGMENT: 'Segmento',
  PERIOD: 'Período',
}
```

---

## Files Summary

| Action | File | Change |
|--------|------|--------|
| Create | `src/app/canvas/ConceptDetailPanel.tsx` | New panel component |
| Create | `src/app/canvas/conceptLabels.ts` | Shared label maps |
| Modify | `src/app/canvas/types.ts` | Add 3 fields to `ConceptNodeData` |
| Modify | `src/app/canvas/useConceptsQuery.ts` | Map 3 new fields |
| Modify | `src/app/canvas/CanvasPage.tsx` | Use `ConceptDetailPanel`, add `handleDeleteNode` |
| Modify | `src/app/canvas/CreateConceptDrawer.tsx` | `modal={false}` on `<Drawer>` |

---

## Out of Scope

- Editing concept fields (no `updateConcept` endpoint exists on the backend)
- Showing operands/feeds list in the panel
- Pagination or lazy loading of the graph

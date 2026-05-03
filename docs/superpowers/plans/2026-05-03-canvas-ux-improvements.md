# Canvas UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir seis mejoras de UX al canvas del designer: auto-layout DAG con Dagre, modo foco con dimming al seleccionar nodos, traza de dependencias upstream, búsqueda de conceptos con Ctrl+K, botón fit-to-view y etiquetas de aristas en hover.

**Architecture:** Todo el código vive en `src/app/canvas/`. Se añaden dos módulos de lógica pura (`autoLayout.ts`, `useGraphFocus.ts`), un componente UI nuevo (`SearchPalette.tsx`), y se modifican `types.ts`, `graphPositions.ts`, `CanvasPage.tsx`, `ConceptNode.tsx` y `DeletableEdge.tsx`. La única dependencia nueva es `@dagrejs/dagre`. La instancia de ReactFlow se captura via `onInit` porque `CanvasPage` renderiza `<ReactFlow>` directamente y no puede usar `useReactFlow()`.

**Tech Stack:** React 18, `@xyflow/react`, `@dagrejs/dagre`, Vitest + React Testing Library, Tailwind CSS.

---

### Task 1: Instalar dependencias y extender tipos

**Files:**
- Modify: `package.json`
- Modify: `src/app/canvas/types.ts`

- [ ] **Step 1: Instalar dagre**

```bash
cd b4rrhh_designer
npm install @dagrejs/dagre
npm install --save-dev @types/dagre
```

Expected: `package.json` actualizado con `@dagrejs/dagre` en `dependencies` y `@types/dagre` en `devDependencies`.

- [ ] **Step 2: Añadir campos de foco a `ConceptNodeData`**

En `src/app/canvas/types.ts`, añadir tres campos opcionales al interface `ConceptNodeData` justo antes del cierre del interface (después de `onEditSummary`):

```ts
export interface ConceptNodeData extends Record<string, unknown> {
  conceptCode: string
  conceptMnemonic: string
  calculationType: CalculationType
  functionalNature: FunctionalNature
  resultCompositionMode: ResultCompositionMode
  executionScope: ExecutionScope
  payslipOrderCode: string | null
  persistToConcepts: boolean
  summary: string | null
  isDirty?: boolean
  onEditSummary?: (conceptCode: string) => void
  dimmed?: boolean
  neighborHighlight?: boolean
  ancestorHighlight?: boolean
}
```

- [ ] **Step 3: Verificar que el proyecto compila**

```bash
npx tsc --noEmit
```

Expected: sin errores de compilación.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/app/canvas/types.ts
git commit -m "feat: install dagre and extend ConceptNodeData with focus fields"
```

---

### Task 2: `autoLayout.ts` — wrapper de Dagre + tests

**Files:**
- Create: `src/app/canvas/autoLayout.ts`
- Create: `src/app/canvas/autoLayout.test.ts`

- [ ] **Step 1: Escribir el test en fallo**

Crear `src/app/canvas/autoLayout.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { applyDagreLayout } from './autoLayout'
import type { ConceptFlowNode, ConceptFlowEdge } from './types'

function node(id: string): ConceptFlowNode {
  return {
    id,
    type: 'concept',
    position: { x: 0, y: 0 },
    data: {
      conceptCode: id,
      conceptMnemonic: id,
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

function edge(source: string, target: string): ConceptFlowEdge {
  return { id: `e-${source}-${target}`, source, target }
}

describe('applyDagreLayout', () => {
  it('coloca los nodos en x creciente para una cadena A→B→C', () => {
    const nodes = [node('A'), node('B'), node('C')]
    const edges = [edge('A', 'B'), edge('B', 'C')]
    const result = applyDagreLayout(nodes, edges)
    const xById = Object.fromEntries(result.map(n => [n.id, n.position.x]))
    expect(xById['A']).toBeLessThan(xById['B'])
    expect(xById['B']).toBeLessThan(xById['C'])
  })

  it('nodo descendiente tiene x mayor que la fuente', () => {
    const nodes = [node('A'), node('B'), node('C')]
    const edges = [edge('A', 'B'), edge('A', 'C')]
    const result = applyDagreLayout(nodes, edges)
    const xA = result.find(n => n.id === 'A')!.position.x
    const xB = result.find(n => n.id === 'B')!.position.x
    expect(xB).toBeGreaterThan(xA)
  })

  it('funciona con un único nodo sin aristas', () => {
    const result = applyDagreLayout([node('X')], [])
    expect(result).toHaveLength(1)
    expect(typeof result[0].position.x).toBe('number')
    expect(typeof result[0].position.y).toBe('number')
  })

  it('devuelve los mismos IDs que recibió', () => {
    const nodes = [node('P01'), node('B01'), node('722')]
    const edges = [edge('P01', 'B01'), edge('B01', '722')]
    const result = applyDagreLayout(nodes, edges)
    expect(result.map(n => n.id).sort()).toEqual(['722', 'B01', 'P01'])
  })
})
```

- [ ] **Step 2: Ejecutar test — verificar que falla**

```bash
npm run test -- autoLayout.test.ts
```

Expected: FAIL — "Cannot find module './autoLayout'"

- [ ] **Step 3: Implementar `autoLayout.ts`**

Crear `src/app/canvas/autoLayout.ts`:

```ts
import dagre from '@dagrejs/dagre'
import type { ConceptFlowNode, ConceptFlowEdge } from './types'

const NODE_WIDTH = 160
const NODE_HEIGHT = 80

export function applyDagreLayout(
  nodes: ConceptFlowNode[],
  edges: ConceptFlowEdge[],
): ConceptFlowNode[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 80 })

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  return nodes.map(node => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    }
  })
}
```

- [ ] **Step 4: Ejecutar test — verificar que pasa**

```bash
npm run test -- autoLayout.test.ts
```

Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/app/canvas/autoLayout.ts src/app/canvas/autoLayout.test.ts
git commit -m "feat: add Dagre auto-layout for canvas"
```

---

### Task 3: `graphPositions.ts` + integración en `CanvasPage`

**Files:**
- Modify: `src/app/canvas/graphPositions.ts`
- Modify: `src/app/canvas/CanvasPage.tsx`

- [ ] **Step 1: Añadir `loadPositionsOrLayout` a `graphPositions.ts`**

El archivo actual tiene `loadPositions` y `savePositions`. Añadir al final:

```ts
import { applyDagreLayout } from './autoLayout'
import type { ConceptFlowNode, ConceptFlowEdge } from './types'

export function loadPositionsOrLayout(
  ruleSystemCode: string,
  nodes: ConceptFlowNode[],
  edges: ConceptFlowEdge[],
): ConceptFlowNode[] {
  const saved = loadPositions(ruleSystemCode)
  if (Object.keys(saved).length === 0) {
    return applyDagreLayout(nodes, edges)
  }
  return nodes.map(n => ({
    ...n,
    position: saved[n.id] ?? n.position,
  }))
}
```

El archivo completo queda:

```ts
import { applyDagreLayout } from './autoLayout'
import type { ConceptFlowNode, ConceptFlowEdge } from './types'

const storageKey = (ruleSystemCode: string) => `graph-positions-${ruleSystemCode}`

type PositionMap = Record<string, { x: number; y: number }>

export function loadPositions(ruleSystemCode: string): PositionMap {
  try {
    return JSON.parse(localStorage.getItem(storageKey(ruleSystemCode)) ?? '{}')
  } catch {
    return {}
  }
}

export function savePositions(ruleSystemCode: string, nodes: { id: string; position: { x: number; y: number } }[]) {
  const map: PositionMap = {}
  for (const n of nodes) map[n.id] = n.position
  localStorage.setItem(storageKey(ruleSystemCode), JSON.stringify(map))
}

export function loadPositionsOrLayout(
  ruleSystemCode: string,
  nodes: ConceptFlowNode[],
  edges: ConceptFlowEdge[],
): ConceptFlowNode[] {
  const saved = loadPositions(ruleSystemCode)
  if (Object.keys(saved).length === 0) {
    return applyDagreLayout(nodes, edges)
  }
  return nodes.map(n => ({
    ...n,
    position: saved[n.id] ?? n.position,
  }))
}
```

- [ ] **Step 2: Integrar en `CanvasPage.tsx`**

En `CanvasPage.tsx`, cambiar la importación añadiendo `loadPositionsOrLayout`:

```ts
import { savePositions, loadPositionsOrLayout } from './graphPositions'
```

Y cambiar el `useEffect` que carga el grafo (actualmente en línea ~66-71):

```ts
useEffect(() => {
  if (data) {
    setNodes(loadPositionsOrLayout(ruleSystemCode, data.nodes, data.edges))
    setEdges(data.edges)
  }
}, [data, setNodes, setEdges, ruleSystemCode])
```

- [ ] **Step 3: Verificar compilación**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 4: Probar manualmente**

Arrancar el servidor (`npm start`) y navegar a `/canvas`. Borrar el localStorage del sistema de prueba (`localStorage.clear()` en la consola) y recargar. Los nodos deben aparecer organizados de izquierda a derecha siguiendo el flujo de dependencias, sin apilamiento.

- [ ] **Step 5: Commit**

```bash
git add src/app/canvas/graphPositions.ts src/app/canvas/CanvasPage.tsx
git commit -m "feat: auto-layout with Dagre on first canvas load"
```

---

### Task 4: `useGraphFocus.ts` — lógica de foco + tests

**Files:**
- Create: `src/app/canvas/useGraphFocus.ts`
- Create: `src/app/canvas/useGraphFocus.test.ts`

- [ ] **Step 1: Escribir el test en fallo**

Crear `src/app/canvas/useGraphFocus.test.ts`:

```ts
import { renderHook } from '@testing-library/react'
import { useGraphFocus } from './useGraphFocus'
import type { ConceptFlowEdge } from './types'

function edge(source: string, target: string): ConceptFlowEdge {
  return { id: `e-${source}-${target}`, source, target }
}

describe('useGraphFocus', () => {
  const edges = [edge('A', 'B'), edge('B', 'C')]

  it('devuelve conjuntos vacíos cuando selectedNodeId es null', () => {
    const { result } = renderHook(() => useGraphFocus(null, edges))
    expect(result.current.focusedNodeIds.size).toBe(0)
    expect(result.current.neighborNodeIds.size).toBe(0)
    expect(result.current.ancestorNodeIds.size).toBe(0)
    expect(result.current.focusedEdgeIds.size).toBe(0)
    expect(result.current.ancestorEdgeIds.size).toBe(0)
  })

  it('seleccionando B: vecinos directos son A y C', () => {
    const { result } = renderHook(() => useGraphFocus('B', edges))
    expect(result.current.neighborNodeIds).toEqual(new Set(['A', 'C']))
  })

  it('seleccionando B: ancestro upstream es A (no C)', () => {
    const { result } = renderHook(() => useGraphFocus('B', edges))
    expect(result.current.ancestorNodeIds).toEqual(new Set(['A']))
  })

  it('seleccionando B: focusedNodeIds incluye A, B y C', () => {
    const { result } = renderHook(() => useGraphFocus('B', edges))
    expect(result.current.focusedNodeIds).toEqual(new Set(['A', 'B', 'C']))
  })

  it('seleccionando B: focusedEdgeIds contiene las dos aristas que tocan B', () => {
    const { result } = renderHook(() => useGraphFocus('B', edges))
    expect(result.current.focusedEdgeIds).toEqual(new Set(['e-A-B', 'e-B-C']))
  })

  it('seleccionando B: ancestorEdgeIds contiene e-A-B (conecta ancestro con seleccionado)', () => {
    const { result } = renderHook(() => useGraphFocus('B', edges))
    expect(result.current.ancestorEdgeIds.has('e-A-B')).toBe(true)
  })

  it('seleccionando A (fuente): sin ancestros, vecino es B', () => {
    const { result } = renderHook(() => useGraphFocus('A', edges))
    expect(result.current.ancestorNodeIds.size).toBe(0)
    expect(result.current.neighborNodeIds).toEqual(new Set(['B']))
  })

  it('seleccionando C (hoja): ancestros son A y B', () => {
    const { result } = renderHook(() => useGraphFocus('C', edges))
    expect(result.current.ancestorNodeIds).toEqual(new Set(['A', 'B']))
  })
})
```

- [ ] **Step 2: Ejecutar test — verificar que falla**

```bash
npm run test -- useGraphFocus.test.ts
```

Expected: FAIL — "Cannot find module './useGraphFocus'"

- [ ] **Step 3: Implementar `useGraphFocus.ts`**

Crear `src/app/canvas/useGraphFocus.ts`:

```ts
import { useMemo } from 'react'
import type { ConceptFlowEdge } from './types'

export interface GraphFocus {
  focusedNodeIds: Set<string>
  neighborNodeIds: Set<string>
  ancestorNodeIds: Set<string>
  focusedEdgeIds: Set<string>
  ancestorEdgeIds: Set<string>
}

const EMPTY: GraphFocus = {
  focusedNodeIds: new Set(),
  neighborNodeIds: new Set(),
  ancestorNodeIds: new Set(),
  focusedEdgeIds: new Set(),
  ancestorEdgeIds: new Set(),
}

export function useGraphFocus(
  selectedNodeId: string | null,
  edges: ConceptFlowEdge[],
): GraphFocus {
  return useMemo(() => {
    if (!selectedNodeId) return EMPTY

    const neighborNodeIds = new Set<string>()
    const focusedEdgeIds = new Set<string>()

    for (const e of edges) {
      if (e.source === selectedNodeId) {
        neighborNodeIds.add(e.target)
        focusedEdgeIds.add(e.id)
      }
      if (e.target === selectedNodeId) {
        neighborNodeIds.add(e.source)
        focusedEdgeIds.add(e.id)
      }
    }

    // BFS upstream: seguir aristas hacia atrás (target → source)
    const ancestorNodeIds = new Set<string>()
    const queue = [selectedNodeId]
    const visited = new Set([selectedNodeId])
    while (queue.length > 0) {
      const current = queue.shift()!
      for (const e of edges) {
        if (e.target === current && !visited.has(e.source)) {
          visited.add(e.source)
          ancestorNodeIds.add(e.source)
          queue.push(e.source)
        }
      }
    }

    // Aristas ancestro: ambos extremos en el scope {ancestros ∪ selectedNode}
    const ancestorScope = new Set([...ancestorNodeIds, selectedNodeId])
    const ancestorEdgeIds = new Set<string>()
    for (const e of edges) {
      if (ancestorScope.has(e.source) && ancestorScope.has(e.target)) {
        ancestorEdgeIds.add(e.id)
      }
    }

    const focusedNodeIds = new Set([selectedNodeId, ...neighborNodeIds, ...ancestorNodeIds])

    return { focusedNodeIds, neighborNodeIds, ancestorNodeIds, focusedEdgeIds, ancestorEdgeIds }
  }, [selectedNodeId, edges])
}
```

- [ ] **Step 4: Ejecutar test — verificar que pasa**

```bash
npm run test -- useGraphFocus.test.ts
```

Expected: PASS — 8 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/app/canvas/useGraphFocus.ts src/app/canvas/useGraphFocus.test.ts
git commit -m "feat: add useGraphFocus hook for node focus/dimming logic"
```

---

### Task 5: `ConceptNode.tsx` — visual de dimming y highlight

**Files:**
- Modify: `src/app/canvas/nodes/ConceptNode.tsx`
- Modify: `src/app/canvas/nodes/ConceptNode.test.tsx`

- [ ] **Step 1: Escribir tests nuevos en fallo**

Añadir al final de `src/app/canvas/nodes/ConceptNode.test.tsx`, dentro del bloque `describe('ConceptNode', ...)`:

```tsx
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
```

- [ ] **Step 2: Ejecutar tests — verificar que fallan**

```bash
npm run test -- ConceptNode.test.tsx
```

Expected: FAIL en los 2 tests nuevos; los 4 originales siguen pasando.

- [ ] **Step 3: Actualizar `ConceptNode.tsx`**

Reemplazar el componente completo con:

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { type ConceptFlowNode, INPUT_PORTS, PORT_COLORS, PORT_LABEL_COLORS, TYPE_BADGE_COLORS } from '../types'

export function ConceptNode({ data, selected }: NodeProps<ConceptFlowNode>) {
  const inputPorts = INPUT_PORTS[data.calculationType]

  const borderClass = data.dimmed
    ? 'border-slate-800'
    : data.neighborHighlight
    ? 'border-violet-500 shadow-lg shadow-violet-500/20'
    : data.ancestorHighlight
    ? 'border-indigo-600'
    : selected
    ? 'border-sky-500 shadow-lg shadow-sky-500/20'
    : 'border-slate-700'

  return (
    <div className={`
      min-w-[120px] rounded-lg border bg-slate-900 text-xs transition-opacity duration-200
      ${data.dimmed ? 'opacity-[0.12] pointer-events-none' : 'opacity-100'}
      ${borderClass}
      ${data.isDirty ? 'border-dashed' : ''}
    `}>
      {/* Header */}
      <div className="px-2 py-1 rounded-t-lg bg-slate-800/60 flex items-center gap-1">
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded flex-1 ${TYPE_BADGE_COLORS[data.calculationType]}`}>
          {data.calculationType === 'RATE_BY_QUANTITY' ? 'RATE×QTY' : data.calculationType.replace('_', ' ')}
        </span>
        {data.onEditSummary && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); data.onEditSummary!(data.conceptCode) }}
            className="text-[9px] text-slate-500 hover:text-slate-300 px-0.5"
            title="Editar summary"
          >
            ✎
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-2 pb-2 pt-1">
        <div className="font-bold text-sm text-slate-100">{data.conceptCode}</div>
        <div className="text-slate-500 text-[9px]">{data.conceptMnemonic}</div>

        {data.summary && (
          <div className="text-slate-500 text-[9px] italic mt-0.5 line-clamp-2">{data.summary}</div>
        )}

        {/* Input ports */}
        {inputPorts.length > 0 && (
          <div className="mt-1.5 flex flex-col gap-1">
            {inputPorts.map((port) => (
              <div key={port} className="flex items-center gap-1 relative">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={port}
                  title={port}
                  className={`!w-2.5 !h-2.5 !border-2 !-left-3 ${PORT_COLORS[port]}`}
                  style={{ top: 'auto', transform: 'none' }}
                />
                <span className={`text-[9px] font-medium ml-1 ${PORT_LABEL_COLORS[port]}`}>{port}</span>
              </div>
            ))}
          </div>
        )}

        {/* Output port */}
        <div className="flex justify-end mt-1">
          <Handle
            type="source"
            position={Position.Right}
            id="out"
            title="out"
            className={`!w-2.5 !h-2.5 !border-2 !-right-3 ${PORT_COLORS['out']}`}
            style={{ top: 'auto', transform: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Ejecutar todos los tests del nodo — verificar que pasan**

```bash
npm run test -- ConceptNode.test.tsx
```

Expected: PASS — 6 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/app/canvas/nodes/ConceptNode.tsx src/app/canvas/nodes/ConceptNode.test.tsx
git commit -m "feat: ConceptNode visual dimming and neighbor/ancestor highlights"
```

---

### Task 6: `CanvasPage.tsx` — integrar modo foco

**Files:**
- Modify: `src/app/canvas/CanvasPage.tsx`

- [ ] **Step 1: Añadir `useGraphFocus` y `displayEdges` a `CanvasPage.tsx`**

Añadir la importación al bloque de imports existente:

```ts
import { useGraphFocus } from './useGraphFocus'
import type { ReactFlowInstance } from '@xyflow/react'
```

Y añadir a los imports de `@xyflow/react` el tipo `ReactFlowInstance` si no está (añadirlo a la línea existente del import de `@xyflow/react`).

Añadir estos estados/hooks justo después de la declaración de `saveGraph`:

```ts
const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)
const [searchOpen, setSearchOpen] = useState(false)
const { focusedNodeIds, neighborNodeIds, ancestorNodeIds, focusedEdgeIds, ancestorEdgeIds } =
  useGraphFocus(selectedNode?.id ?? null, edges)
```

- [ ] **Step 2: Extender `displayNodes` con foco**

El memo `displayNodes` actual (líneas ~112-120) aplica callbacks y filtro de naturaleza. Reemplazarlo con:

```ts
const displayNodes = useMemo(() => {
  const withState = nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      onEditSummary: handleEditSummary,
      dimmed: selectedNode != null && !focusedNodeIds.has(n.id),
      neighborHighlight: selectedNode != null && neighborNodeIds.has(n.id),
      ancestorHighlight: selectedNode != null && ancestorNodeIds.has(n.id) && !neighborNodeIds.has(n.id),
    },
  }))
  return filterNatures.size === 0
    ? withState
    : withState.map(n => ({ ...n, hidden: !filterNatures.has(n.data.functionalNature) }))
}, [nodes, filterNatures, handleEditSummary, selectedNode, focusedNodeIds, neighborNodeIds, ancestorNodeIds])
```

- [ ] **Step 3: Añadir `displayEdges` memo**

Añadir después del memo de `displayNodes`:

```ts
const displayEdges = useMemo(() => {
  if (!selectedNode) return edges
  return edges.map(e => {
    if (focusedEdgeIds.has(e.id)) {
      return { ...e, style: { ...e.style, stroke: '#a78bfa', strokeWidth: 2, opacity: 1 } }
    }
    if (ancestorEdgeIds.has(e.id)) {
      return { ...e, style: { ...e.style, stroke: '#6366f1', strokeWidth: 1.5, opacity: 0.6 } }
    }
    return { ...e, style: { ...e.style, opacity: 0.08 } }
  })
}, [edges, selectedNode, focusedEdgeIds, ancestorEdgeIds])
```

- [ ] **Step 4: Actualizar el componente `<ReactFlow>`**

En el JSX, cambiar `edges={edges}` por `edges={displayEdges}` y añadir `onPaneClick` y `onInit`:

```tsx
<ReactFlow
  nodes={displayNodes}
  edges={displayEdges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  onNodeClick={(_, node) => { if (node.type === 'concept') setSelectedNode(node as ConceptFlowNode) }}
  onNodeDragStop={onNodeDragStop}
  onPaneClick={() => setSelectedNode(null)}
  onInit={setRfInstance}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  fitView
  colorMode="dark"
>
```

- [ ] **Step 5: Verificar compilación**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 6: Probar manualmente**

Arrancar `npm start`, ir a `/canvas`, clicar un nodo. Los nodos no relacionados deben atenuarse. Clicar en el fondo debe restaurar la opacidad normal.

- [ ] **Step 7: Commit**

```bash
git add src/app/canvas/CanvasPage.tsx
git commit -m "feat: focus mode with dimming on node selection"
```

---

### Task 7: `SearchPalette.tsx` — command palette + tests

**Files:**
- Create: `src/app/canvas/SearchPalette.tsx`
- Create: `src/app/canvas/SearchPalette.test.tsx`

- [ ] **Step 1: Escribir el test en fallo**

Crear `src/app/canvas/SearchPalette.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
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
      calculationType: 'ENGINE_PROVIDED',
      functionalNature: 'TECHNICAL',
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
```

- [ ] **Step 2: Ejecutar test — verificar que falla**

```bash
npm run test -- SearchPalette.test.tsx
```

Expected: FAIL — "Cannot find module './SearchPalette'"

- [ ] **Step 3: Implementar `SearchPalette.tsx`**

Crear `src/app/canvas/SearchPalette.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import type { ConceptFlowNode } from './types'
import { TYPE_BADGE_COLORS } from './types'

interface Props {
  nodes: ConceptFlowNode[]
  onSelect: (nodeId: string) => void
  onClose: () => void
}

export function SearchPalette({ nodes, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const filtered = query.trim() === ''
    ? nodes
    : nodes.filter(n =>
        n.data.conceptCode.toLowerCase().includes(query.toLowerCase()) ||
        n.data.conceptMnemonic.toLowerCase().includes(query.toLowerCase())
      )
  const visible = filtered.slice(0, 8)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, visible.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && visible[activeIndex]) { onSelect(visible[activeIndex].id) }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed z-50 left-1/2 top-[20%] -translate-x-1/2 w-[440px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-800">
          <span className="text-slate-500 text-sm">⌕</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar concepto..."
            className="flex-1 bg-transparent outline-none text-sm text-slate-200 placeholder-slate-600 font-mono"
          />
          <kbd className="text-[9px] border border-slate-700 rounded px-1 text-slate-500">Esc</kbd>
        </div>

        <div className="max-h-[280px] overflow-y-auto">
          {visible.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-slate-500">Sin resultados</div>
          )}
          {visible.map((node, i) => (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelect(node.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left border-l-2 transition-colors ${
                i === activeIndex
                  ? 'bg-slate-800 border-sky-500'
                  : 'border-transparent hover:bg-slate-800/50'
              }`}
            >
              <span className="font-mono font-bold text-xs text-slate-100 w-32 truncate">
                {node.data.conceptCode}
              </span>
              <span className="text-[10px] text-slate-500 flex-1 truncate">
                {node.data.conceptMnemonic}
              </span>
              <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded ${TYPE_BADGE_COLORS[node.data.calculationType]}`}>
                {node.data.calculationType.replace(/_/g, ' ')}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-4 px-3 py-1.5 border-t border-slate-800">
          <span className="text-[9px] text-slate-600">
            <kbd className="border border-slate-700 rounded px-0.5">↵</kbd> ir al nodo
          </span>
          <span className="text-[9px] text-slate-600">
            <kbd className="border border-slate-700 rounded px-0.5">↑↓</kbd> navegar
          </span>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Ejecutar test — verificar que pasa**

```bash
npm run test -- SearchPalette.test.tsx
```

Expected: PASS — 6 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/app/canvas/SearchPalette.tsx src/app/canvas/SearchPalette.test.tsx
git commit -m "feat: add SearchPalette command palette component"
```

---

### Task 8: `CanvasPage.tsx` — integrar búsqueda, botón Fit y rfInstance

**Files:**
- Modify: `src/app/canvas/CanvasPage.tsx`

- [ ] **Step 1: Añadir importación de `SearchPalette`**

En el bloque de imports de `CanvasPage.tsx`, añadir (el `type ReactFlowInstance` ya fue añadido en Task 6):

```ts
import { SearchPalette } from './SearchPalette'
```

- [ ] **Step 2: Añadir keyboard listener para Ctrl+K**

Justo después del `useEffect` que cierra el filtro al hacer clic fuera (líneas ~73-83), añadir:

```ts
useEffect(() => {
  function onKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setSearchOpen(true)
    }
  }
  document.addEventListener('keydown', onKeyDown)
  return () => document.removeEventListener('keydown', onKeyDown)
}, [])
```

- [ ] **Step 3: Añadir `handleSearchSelect`**

Añadir después de `handleDeleted`:

```ts
const handleSearchSelect = useCallback((nodeId: string) => {
  const node = nodes.find(n => n.id === nodeId)
  if (!node || !rfInstance) return
  rfInstance.setCenter(node.position.x + 80, node.position.y + 40, { zoom: 1.5, duration: 500 })
  setSelectedNode(node as ConceptFlowNode)
  setSearchOpen(false)
}, [nodes, rfInstance])
```

- [ ] **Step 4: Añadir botones Fit y Buscar a la toolbar**

En el JSX de la toolbar (bloque `<div className="absolute top-2 right-2 ...">`) añadir los botones entre "Guardar" y el filtro de naturaleza:

```tsx
<button
  type="button"
  onClick={() => rfInstance?.fitView({ duration: 400, padding: 0.1 })}
  className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-700"
>
  ⊡ Fit
</button>
<button
  type="button"
  onClick={() => setSearchOpen(true)}
  className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-700"
>
  ⌕ Buscar
</button>
```

- [ ] **Step 5: Montar `SearchPalette` en el JSX**

En el JSX, justo antes del cierre `</div>` del wrapper `<div className="flex h-full">`, añadir:

```tsx
{searchOpen && (
  <SearchPalette
    nodes={nodes.filter(n => !n.hidden)}
    onSelect={handleSearchSelect}
    onClose={() => setSearchOpen(false)}
  />
)}
```

- [ ] **Step 6: Verificar compilación**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 7: Probar manualmente**

Arrancar `npm start` y verificar:
- Pulsar Ctrl+K abre la paleta de búsqueda
- Escribir filtra conceptos por código y mnemónico
- Seleccionar un concepto hace pan+zoom y abre el panel de detalle
- El botón "Fit" ajusta el zoom para ver todo el grafo

- [ ] **Step 8: Commit**

```bash
git add src/app/canvas/CanvasPage.tsx
git commit -m "feat: integrate search palette, fit button and rfInstance in CanvasPage"
```

---

### Task 9: `DeletableEdge.tsx` — etiqueta de puerto en hover + tests

**Files:**
- Modify: `src/app/canvas/edges/DeletableEdge.tsx`
- Create: `src/app/canvas/edges/DeletableEdge.test.tsx`

- [ ] **Step 1: Escribir el test en fallo**

Crear `src/app/canvas/edges/DeletableEdge.test.tsx`:

```tsx
import { render, fireEvent } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { DeletableEdge } from './DeletableEdge'

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
```

- [ ] **Step 2: Ejecutar test — verificar que falla**

```bash
npm run test -- DeletableEdge.test.tsx
```

Expected: FAIL — "Cannot find 'path[stroke=transparent]'"

- [ ] **Step 3: Actualizar `DeletableEdge.tsx`**

Reemplazar el archivo completo con:

```tsx
import { useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from '@xyflow/react'

export function DeletableEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  targetHandle,
  style,
  markerEnd,
  selected,
}: EdgeProps) {
  const { setEdges } = useReactFlow()
  const [hovered, setHovered] = useState(false)
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  return (
    <>
      {/* Hit area: path transparente más ancho para capturar hover */}
      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth={12}
        fill="none"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: hovered && !selected ? '#a78bfa' : style?.stroke,
          strokeWidth: selected ? 2 : hovered ? 2 : (style?.strokeWidth ?? 1.5),
        }}
      />
      <EdgeLabelRenderer>
        {selected && (
          <button
            type="button"
            title="Eliminar conexión"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan w-5 h-5 bg-red-950 border border-red-700 text-red-400 rounded-full text-sm leading-none flex items-center justify-center hover:bg-red-800 hover:text-red-300 cursor-pointer"
            onClick={() => setEdges(eds => eds.filter(e => e.id !== id))}
          >
            ×
          </button>
        )}
        {hovered && targetHandle && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 14}px)`,
              pointerEvents: 'none',
            }}
            className="bg-slate-700 border border-slate-500 text-slate-200 text-[8px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap"
          >
            → {targetHandle}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}
```

- [ ] **Step 4: Ejecutar test — verificar que pasa**

```bash
npm run test -- DeletableEdge.test.tsx
```

Expected: PASS — 3 tests passed.

- [ ] **Step 5: Ejecutar toda la suite**

```bash
npm run test
```

Expected: todos los tests pasan.

- [ ] **Step 6: Commit**

```bash
git add src/app/canvas/edges/DeletableEdge.tsx src/app/canvas/edges/DeletableEdge.test.tsx
git commit -m "feat: show port label on edge hover"
```

---

## Resumen de archivos

| Archivo | Acción |
|---|---|
| `package.json` | Añade `@dagrejs/dagre` + `@types/dagre` |
| `src/app/canvas/types.ts` | Añade `dimmed?`, `neighborHighlight?`, `ancestorHighlight?` a `ConceptNodeData` |
| `src/app/canvas/autoLayout.ts` | **Nuevo** — wrapper Dagre LR |
| `src/app/canvas/autoLayout.test.ts` | **Nuevo** — 4 tests |
| `src/app/canvas/graphPositions.ts` | Añade `loadPositionsOrLayout` |
| `src/app/canvas/useGraphFocus.ts` | **Nuevo** — hook BFS upstream |
| `src/app/canvas/useGraphFocus.test.ts` | **Nuevo** — 8 tests |
| `src/app/canvas/SearchPalette.tsx` | **Nuevo** — command palette |
| `src/app/canvas/SearchPalette.test.tsx` | **Nuevo** — 6 tests |
| `src/app/canvas/CanvasPage.tsx` | Integra todo: rfInstance, foco, búsqueda, fit |
| `src/app/canvas/nodes/ConceptNode.tsx` | Dimming visual + border highlights |
| `src/app/canvas/nodes/ConceptNode.test.tsx` | 2 tests nuevos |
| `src/app/canvas/edges/DeletableEdge.tsx` | Hover hit-area + port label |
| `src/app/canvas/edges/DeletableEdge.test.tsx` | **Nuevo** — 3 tests |

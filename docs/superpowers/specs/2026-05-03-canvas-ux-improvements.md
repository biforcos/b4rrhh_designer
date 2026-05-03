# Canvas UX Improvements — Design Spec

**Goal:** Mejorar la navegación y usabilidad del canvas del designer de nómina con seis mejoras independientes: auto-layout DAG, modo foco con dimming, traza de dependencias, búsqueda de conceptos, botón fit-to-view y etiquetas de aristas en hover.

**Architecture:** Todas las features viven en el módulo `src/app/canvas/`. Se añade `@dagrejs/dagre` como única dependencia nueva. Los cambios se dividen en tres capas: lógica de grafo (`autoLayout.ts`, `useGraphFocus.ts`), componentes UI (`SearchPalette.tsx`, modificaciones a `ConceptNode` y `DeletableEdge`), y orquestación en `CanvasPage.tsx`.

**Tech Stack:** React 18, ReactFlow (`@xyflow/react`), `@dagrejs/dagre`, TanStack Query, Tailwind CSS, Zustand (ruleSystemStore).

---

## Archivos

### Nuevos
- `src/app/canvas/autoLayout.ts` — wrapper de Dagre: recibe nodos y aristas, devuelve nodos con posiciones calculadas (dirección LR, nodeWidth=160, nodeHeight=80)
- `src/app/canvas/useGraphFocus.ts` — hook que dado `selectedNodeId` y `edges` devuelve `{ focusedNodeIds, neighborNodeIds, ancestorNodeIds, focusedEdgeIds }` con conjuntos computados vía BFS/DFS sobre el grafo
- `src/app/canvas/SearchPalette.tsx` — command palette overlay (Ctrl+K / Cmd+K), filtra por `conceptCode` y `conceptMnemonic`, navega con ↑↓, selecciona con Enter y hace pan+zoom al nodo

### Modificados
- `src/app/canvas/types.ts` — añade `dimmed`, `neighborHighlight`, `ancestorHighlight` a `ConceptNodeData`
- `src/app/canvas/graphPositions.ts` — añade `loadPositionsOrLayout(ruleSystemCode, nodes, edges)`: si el mapa de posiciones en localStorage está vacío, llama a `applyDagreLayout`; si no, merge con posiciones guardadas
- `src/app/canvas/CanvasPage.tsx` — integra `useGraphFocus`, aplica dimming a `displayNodes` y `displayEdges`, monta `SearchPalette`, añade botón "Fit" y botón "Buscar" en toolbar, maneja `onPaneClick` para limpiar selección; captura la instancia de ReactFlow via `onInit` (necesario porque `CanvasPage` no está dentro del provider de ReactFlow)
- `src/app/canvas/nodes/ConceptNode.tsx` — acepta `dimmed`, `neighborHighlight` y `ancestorHighlight` en `data`; aplica `opacity-[0.12] pointer-events-none` para `dimmed`, borde violeta para `neighborHighlight`, borde índigo para `ancestorHighlight`
- `src/app/canvas/edges/DeletableEdge.tsx` — muestra `EdgeLabelRenderer` con el nombre del puerto destino (`targetHandle`) al hacer hover sobre la arista; la arista se colorea en violeta mientras está en hover
- `package.json` — añade `@dagrejs/dagre` y `@types/dagre`

---

## Feature 1: Auto-layout (Dagre)

`autoLayout.ts` exporta `applyDagreLayout(nodes: ConceptFlowNode[], edges: ConceptFlowEdge[]): ConceptFlowNode[]`.

Configuración de Dagre:
- `rankdir: 'LR'` (izquierda a derecha)
- `nodesep: 60`, `ranksep: 80`
- Dimensión de nodo: 160×80 px (aproximación conservadora)

`graphPositions.ts` añade:
```ts
export function loadPositionsOrLayout(
  ruleSystemCode: string,
  nodes: ConceptFlowNode[],
  edges: ConceptFlowEdge[]
): ConceptFlowNode[]
```
Lógica:
1. Cargar mapa de posiciones con `loadPositions(ruleSystemCode)`
2. Si el mapa está vacío → devolver `applyDagreLayout(nodes, edges)`
3. Si no → devolver `nodes` con las posiciones del mapa mergeadas (los nodos nuevos sin posición guardada quedan donde los coloca el backend)

`CanvasPage.tsx` reemplaza la asignación directa `setNodes(data.nodes)` por `setNodes(loadPositionsOrLayout(ruleSystemCode, data.nodes, data.edges))`.

---

## Feature 2: Modo foco con dimming

`useGraphFocus.ts` exporta:
```ts
function useGraphFocus(
  selectedNodeId: string | null,
  edges: ConceptFlowEdge[]
): {
  focusedNodeIds: Set<string>      // selectedNode + vecinos + ancestros
  neighborNodeIds: Set<string>     // vecinos directos (1 hop)
  ancestorNodeIds: Set<string>     // antecesores upstream (todos los niveles)
  focusedEdgeIds: Set<string>      // aristas que tocan directamente el nodo seleccionado
  ancestorEdgeIds: Set<string>     // aristas que conectan ancestros upstream entre sí o al nodo seleccionado
}
```

Lógica:
- **vecinos directos**: nodos conectados por una arista (source o target del selectedNode)
- **ancestros upstream**: BFS hacia atrás siguiendo `source → target`; todos los antecesores transitivos del nodo seleccionado
- `focusedNodeIds` = selectedNode + neighborNodeIds + ancestorNodeIds
- `focusedEdgeIds` = aristas donde `source` o `target` es el selectedNode

En `CanvasPage.tsx`, el `displayNodes` memo existente se extiende:
- Si `selectedNode` es null → todos los nodos con opacidad normal
- Si hay selección → nodos en `focusedNodeIds` con opacidad normal; el resto con `data.dimmed = true`
- El nodo seleccionado: `selected = true` (borde azul, ya maneja ReactFlow)
- Vecinos directos: `data.neighborHighlight = true` → borde violeta en `ConceptNode`
- Ancestros: `data.ancestorHighlight = true` → borde índigo en `ConceptNode`

Se añade `onPaneClick` al `ReactFlow`: limpia `selectedNode` (vuelve al estado normal).

`ConceptNode.tsx` aplica clases según `data.dimmed`, `data.neighborHighlight`, `data.ancestorHighlight`.

---

## Feature 3: Traza de dependencias

Incluida en `useGraphFocus` como `ancestorNodeIds`. No requiere archivo adicional. Las aristas que conectan ancestros al nodo seleccionado reciben color índigo en `DeletableEdge` cuando el ID del edge está en un conjunto `ancestorEdgeIds` (calculado en el hook, propagado via `data` en las aristas del `displayEdges` memo).

---

## Feature 4: Búsqueda (Ctrl+K)

`SearchPalette.tsx`:
- Overlay centrado con `position: fixed`, fondo semitransparente
- Input controlado que filtra `nodes` por `conceptCode.includes(query)` o `conceptMnemonic.includes(query)` (case-insensitive)
- Lista de resultados con scroll, máximo 8 visibles
- Cada item muestra: código, mnemónico, badge de `calculationType`
- Al seleccionar (Enter o clic): llama a `onSelect(nodeId)`, que en `CanvasPage` ejecuta `setCenter` + `setSelectedNode`
- Navegación teclado: ↑↓ mueven `activeIndex`; Escape cierra

En `CanvasPage.tsx`, la instancia de ReactFlow se captura via el prop `onInit` porque `CanvasPage` renderiza `<ReactFlow>` directamente y no está dentro del provider interno — `useReactFlow()` no funcionaría aquí:
```ts
const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)

function handleSearchSelect(nodeId: string) {
  const node = nodes.find(n => n.id === nodeId)
  if (!node || !rfInstance) return
  rfInstance.setCenter(node.position.x + 80, node.position.y + 40, { zoom: 1.5, duration: 500 })
  setSelectedNode(node as ConceptFlowNode)
  setSearchOpen(false)
}
```

Listener de teclado en `useEffect`:
```ts
function onKeyDown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    setSearchOpen(true)
  }
}
```

---

## Feature 5: Botón Fit

En la toolbar de `CanvasPage.tsx`, entre "Guardar" y "Filtro":
```tsx
<button onClick={() => rfInstance?.fitView({ duration: 400, padding: 0.1 })}>
  ⊡ Fit
</button>
```

El minimapa de ReactFlow ya soporta pan con clic por defecto — no requiere cambios.

---

## Feature 6: Edge labels en hover

En `DeletableEdge.tsx`:
- Añadir estado `const [hovered, setHovered] = useState(false)`
- En el `<path>` de la arista: `onMouseEnter={() => setHovered(true)}` y `onMouseLeave={() => setHovered(false)}`; cuando `hovered`, `stroke` cambia a `#a78bfa` y `strokeWidth` a 2
- Cuando `hovered && targetHandle`: renderizar con `EdgeLabelRenderer` una burbuja centrada en el punto medio de la arista con el texto `→ {targetHandle}`
- El punto medio se calcula con las props `sourceX/Y` y `targetX/Y` que ReactFlow pasa al edge component

---

## Testing

Cada feature tiene su test unitario o de integración correspondiente:

| Feature | Test |
|---|---|
| `autoLayout.ts` | Test unitario: dado un grafo de 3 nodos en cadena, los nodos de salida tienen `x` creciente y no se solapan |
| `useGraphFocus` | Test unitario con `renderHook`: dado un grafo A→B→C, seleccionar B produce `neighborNodeIds={A,C}` y `ancestorNodeIds={A}` |
| `SearchPalette` | Test de componente: escribir "tope" filtra a los nodos que contienen "tope" en código o mnemónico |
| `DeletableEdge` | Test existente + caso hover: simular `mouseenter` sobre el path y verificar que aparece el label |
| `CanvasPage` (integración) | Test existente: clicar un nodo setea `selectedNode`; clicar el fondo lo limpia |

---

## Comportamiento de bordes

- **Nodo sin posición guardada y sin vecinos** (grafo con un solo nodo): Dagre lo coloca en el centro; no hay error.
- **Grafo con ciclos**: el grafo de payroll es un DAG por diseño; si existiera un ciclo, Dagre lo maneja (coloca los nodos en algún rank sin crashear).
- **Búsqueda con query vacío**: muestra todos los nodos (sin filtrar), útil como listado completo.
- **Selección de nodo oculto por filtro de naturaleza**: el filtro de naturaleza y el modo foco son independientes; si un nodo está oculto (`hidden: true`), no aparece en la búsqueda.

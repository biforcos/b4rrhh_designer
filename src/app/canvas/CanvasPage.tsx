import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ReactFlow, Background, MiniMap, Controls, Panel, addEdge, useNodesState, useEdgesState, type Connection } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ConceptNode } from './nodes/ConceptNode'
import { DeletableEdge } from './edges/DeletableEdge'
import { useConceptGraph } from './useConceptsQuery'
import type { ConceptFlowNode, ConceptFlowEdge, FunctionalNature } from './types'
import { CreateConceptDrawer } from './CreateConceptDrawer'
import { useSaveGraph } from './useSaveGraph'
import { CanvasLegend } from './CanvasLegend'
import { savePositions } from './graphPositions'
import { ConceptDetailPanel } from './ConceptDetailPanel'
import { NATURE_LABELS, NATURE_COLORS } from './conceptLabels'
import { useRuleSystemStore } from '../../ruleSystemStore'

const nodeTypes = { concept: ConceptNode }
const edgeTypes = { deletable: DeletableEdge }

const ALL_NATURES = Object.keys(NATURE_LABELS) as FunctionalNature[]

export function CanvasPage() {
  const { ruleSystemCode } = useRuleSystemStore()
  const { data, isLoading } = useConceptGraph(ruleSystemCode)
  const [nodes, setNodes, onNodesChange] = useNodesState<ConceptFlowNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<ConceptFlowEdge>([])
  const [selectedNode, setSelectedNode] = useState<ConceptFlowNode | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterNatures, setFilterNatures] = useState<Set<FunctionalNature>>(new Set())
  const filterRef = useRef<HTMLDivElement>(null)
  const saveGraph = useSaveGraph(ruleSystemCode)

  useEffect(() => {
    if (data) {
      setNodes(data.nodes)
      setEdges(data.edges)
    }
  }, [data, setNodes, setEdges])

  // Close filter dropdown when clicking outside
  useEffect(() => {
    if (!filterOpen) return
    function onPointerDown(e: PointerEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [filterOpen])

  const onNodeDragStop = useCallback(() => {
    savePositions(ruleSystemCode, nodes)
  }, [ruleSystemCode, nodes])

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({
      ...params,
      id: `e-${params.source}-${params.target}-${params.targetHandle}`,
      type: 'deletable',
    }, eds)),
    [setEdges]
  )

  const handleDeleted = useCallback(() => {
    setNodes(ns => ns.filter(n => n.id !== selectedNode!.id))
    setSelectedNode(null)
  }, [selectedNode, setNodes])

  function toggleNature(nature: FunctionalNature) {
    setFilterNatures(prev => {
      const next = new Set(prev)
      if (next.has(nature)) next.delete(nature)
      else next.add(nature)
      return next
    })
  }

  const displayNodes = useMemo(
    () => filterNatures.size === 0
      ? nodes
      : nodes.map(n => ({ ...n, hidden: !filterNatures.has(n.data.functionalNature) })),
    [nodes, filterNatures]
  )

  if (isLoading) return <div className="flex items-center justify-center h-full text-slate-500">Cargando grafo...</div>

  return (
    <div className="flex h-full">
      <div className="flex-1 relative">
        {/* Toolbar */}
        <div className="absolute top-2 right-2 z-10 flex gap-2 items-start">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-700"
          >
            + Concepto
          </button>
          <button
            type="button"
            onClick={() => saveGraph.mutate({ nodes, edges })}
            disabled={saveGraph.isPending}
            className="text-xs px-3 py-1.5 bg-green-900 border border-green-700 text-green-300 rounded-md hover:bg-green-800 disabled:opacity-50"
          >
            {saveGraph.isPending ? 'Guardando...' : '↑ Guardar'}
          </button>

          {/* Nature filter */}
          <div ref={filterRef} className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen(o => !o)}
              className={`text-xs px-3 py-1.5 border rounded-md transition-colors ${
                filterNatures.size > 0
                  ? 'bg-sky-900 border-sky-700 text-sky-300 hover:bg-sky-800'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Filtro {filterNatures.size > 0 ? `(${filterNatures.size})` : '▾'}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 w-48 z-20 shadow-xl">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wide">Naturaleza</span>
                  {filterNatures.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterNatures(new Set())}
                      className="text-[9px] text-slate-500 hover:text-slate-300"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="space-y-0.5">
                  {ALL_NATURES.map(nature => (
                    <label key={nature} className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterNatures.has(nature)}
                        onChange={() => toggleNature(nature)}
                        className="accent-sky-500"
                      />
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${NATURE_COLORS[nature]}`}>
                        {NATURE_LABELS[nature]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <ReactFlow
          nodes={displayNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => { if (node.type === 'concept') setSelectedNode(node as ConceptFlowNode) }}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          colorMode="dark"
        >
          <Background color="#1e293b" gap={22} size={1} />
          <MiniMap className="!bg-slate-900" nodeColor="#334155" />
          <Controls className="!bg-slate-900 !border-slate-700" />
          <Panel position="bottom-right">
            <CanvasLegend />
          </Panel>
        </ReactFlow>

        <CreateConceptDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ruleSystemCode={ruleSystemCode}
        />
      </div>

      {selectedNode && (
        <ConceptDetailPanel
          node={selectedNode}
          edges={edges}
          ruleSystemCode={ruleSystemCode}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}

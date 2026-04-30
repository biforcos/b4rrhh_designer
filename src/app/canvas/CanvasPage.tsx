import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { conceptsApi } from './api/conceptsApi'
import { validateGraph } from './validateGraph'
import type { GraphValidationResult } from './validateGraph'

const nodeTypes = { concept: ConceptNode }
const edgeTypes = { deletable: DeletableEdge }

const ALL_NATURES = Object.keys(NATURE_LABELS) as FunctionalNature[]

export function CanvasPage() {
  const { ruleSystemCode } = useRuleSystemStore()
  const queryClient = useQueryClient()
  const { data, isLoading } = useConceptGraph(ruleSystemCode)
  const [nodes, setNodes, onNodesChange] = useNodesState<ConceptFlowNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<ConceptFlowEdge>([])
  const [selectedNode, setSelectedNode] = useState<ConceptFlowNode | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterNatures, setFilterNatures] = useState<Set<FunctionalNature>>(new Set())
  const filterRef = useRef<HTMLDivElement>(null)
  const [summaryEditTarget, setSummaryEditTarget] = useState<string | null>(null)
  const [summaryDraft, setSummaryDraft] = useState('')
  const [pendingSave, setPendingSave] = useState<{ nodes: typeof nodes; edges: typeof edges; validation: GraphValidationResult } | null>(null)
  const saveGraph = useSaveGraph(ruleSystemCode)

  function handleSave() {
    const visible = nodes.filter(n => !n.hidden)
    const validation = validateGraph(visible, edges)
    if (validation.errors.length > 0 || validation.warnings.length > 0) {
      setPendingSave({ nodes: visible, edges, validation })
    } else {
      saveGraph.mutate({ nodes: visible, edges })
    }
  }

  const updateSummaryMutation = useMutation({
    mutationFn: ({ conceptCode, summary }: { conceptCode: string; summary: string | null }) =>
      conceptsApi.updateSummary(ruleSystemCode, conceptCode, summary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concepts', ruleSystemCode] })
      setSummaryEditTarget(null)
    },
  })

  const handleEditSummary = useCallback((conceptCode: string) => {
    const node = nodes.find(n => n.id === conceptCode)
    setSummaryDraft(node?.data.summary ?? '')
    setSummaryEditTarget(conceptCode)
  }, [nodes])

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

  const displayNodes = useMemo(() => {
    const withCallbacks = nodes.map(n => ({
      ...n,
      data: { ...n.data, onEditSummary: handleEditSummary },
    }))
    return filterNatures.size === 0
      ? withCallbacks
      : withCallbacks.map(n => ({ ...n, hidden: !filterNatures.has(n.data.functionalNature) }))
  }, [nodes, filterNatures, handleEditSummary])

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
            onClick={handleSave}
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

      {pendingSave && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setPendingSave(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4">
            <p className="text-sm font-medium text-slate-200 mb-3">Validación del grafo</p>

            {pendingSave.validation.errors.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wide text-red-400 font-semibold mb-1.5">
                  Errores — el grafo no se puede guardar
                </p>
                <ul className="space-y-1">
                  {pendingSave.validation.errors.map((e, i) => (
                    <li key={i} className="text-xs text-red-300 bg-red-950/40 border border-red-900 rounded px-2 py-1">
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pendingSave.validation.warnings.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wide text-amber-400 font-semibold mb-1.5">
                  Avisos
                </p>
                <ul className="space-y-1">
                  {pendingSave.validation.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-amber-300 bg-amber-950/40 border border-amber-900 rounded px-2 py-1">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setPendingSave(null)}
                className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-700"
              >
                Cancelar
              </button>
              {pendingSave.validation.errors.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    saveGraph.mutate({ nodes: pendingSave.nodes, edges: pendingSave.edges })
                    setPendingSave(null)
                  }}
                  className="text-xs px-3 py-1.5 bg-amber-800 border border-amber-700 text-amber-200 rounded-md hover:bg-amber-700"
                >
                  Guardar igualmente
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {summaryEditTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setSummaryEditTarget(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4">
            <p className="text-xs text-slate-400 mb-1">
              Summary — <span className="font-mono text-slate-300">{summaryEditTarget}</span>
            </p>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-200 p-2 resize-none focus:outline-none focus:border-sky-500"
              rows={4}
              value={summaryDraft}
              onChange={e => setSummaryDraft(e.target.value)}
              placeholder="Descripción funcional del concepto..."
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setSummaryEditTarget(null)}
                className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={updateSummaryMutation.isPending}
                onClick={() => updateSummaryMutation.mutate({
                  conceptCode: summaryEditTarget,
                  summary: summaryDraft.trim() || null,
                })}
                className="text-xs px-3 py-1.5 bg-sky-900 border border-sky-700 text-sky-300 rounded-md hover:bg-sky-800 disabled:opacity-50"
              >
                {updateSummaryMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { ReactFlow, Background, MiniMap, Controls, addEdge, useNodesState, useEdgesState, type Connection } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ConceptNode } from './nodes/ConceptNode'
import { useConceptGraph } from './useConceptsQuery'
import type { ConceptFlowNode, ConceptFlowEdge } from './types'
import { CreateConceptDrawer } from './CreateConceptDrawer'
import { useSaveGraph } from './useSaveGraph'

const nodeTypes = { concept: ConceptNode }
const RULE_SYSTEM = 'ESP'

export function CanvasPage() {
  const { data, isLoading } = useConceptGraph(RULE_SYSTEM)
  const [nodes, setNodes, onNodesChange] = useNodesState<ConceptFlowNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<ConceptFlowEdge>([])
  const [selectedNode, setSelectedNode] = useState<ConceptFlowNode | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const saveGraph = useSaveGraph(RULE_SYSTEM)

  useEffect(() => {
    if (data) {
      setNodes(data.nodes)
      setEdges(data.edges)
    }
  }, [data, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({ ...params, id: `e-${params.source}-${params.target}-${params.targetHandle}` }, eds)),
    [setEdges]
  )

  if (isLoading) return <div className="flex items-center justify-center h-full text-slate-500">Cargando grafo...</div>

  return (
    <div className="flex h-full">
      <div className="flex-1 relative">
        <div className="absolute top-2 right-2 z-10 flex gap-2">
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
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNode(node as ConceptFlowNode)}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
        >
          <Background color="#1e293b" gap={22} size={1} />
          <MiniMap className="!bg-slate-900" nodeColor="#334155" />
          <Controls className="!bg-slate-900 !border-slate-700" />
        </ReactFlow>
        <CreateConceptDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ruleSystemCode={RULE_SYSTEM}
        />
      </div>

      {selectedNode && (
        <aside className="w-52 bg-slate-900 border-l border-slate-800 p-3 text-xs overflow-y-auto flex-shrink-0">
          <div className="font-bold text-sky-400 mb-1">{selectedNode.data.conceptCode} · {selectedNode.data.conceptMnemonic}</div>
          <div className="text-slate-500 text-[9px] mb-3">PayrollConcept</div>
          <div className="space-y-2">
            <Field label="Tipo" value={selectedNode.data.calculationType} />
            <Field label="Naturaleza" value={selectedNode.data.functionalNature} />
          </div>
        </aside>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-slate-600 text-[9px] uppercase tracking-wide mb-0.5">{label}</div>
      <div className="bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{value}</div>
    </div>
  )
}

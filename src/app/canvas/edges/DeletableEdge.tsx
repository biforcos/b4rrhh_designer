import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from '@xyflow/react'

export function DeletableEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style,
  markerEnd,
  selected,
}: EdgeProps) {
  const { setEdges } = useReactFlow()
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, strokeWidth: selected ? 2 : (style?.strokeWidth ?? 1.5) }}
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
      </EdgeLabelRenderer>
    </>
  )
}

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
      {/* Wide transparent hit area for hover detection */}
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

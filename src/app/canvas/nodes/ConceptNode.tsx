import { Handle, Position, type NodeProps } from '@xyflow/react'
import { type ConceptFlowNode, INPUT_PORTS, PORT_COLORS, PORT_LABEL_COLORS, TYPE_BADGE_COLORS } from '../types'

export function ConceptNode({ data, selected }: NodeProps<ConceptFlowNode>) {
  const inputPorts = INPUT_PORTS[data.calculationType]

  return (
    <div className={`
      min-w-[120px] rounded-lg border bg-slate-900 text-xs
      ${selected ? 'border-sky-500 shadow-lg shadow-sky-500/20' : 'border-slate-700'}
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

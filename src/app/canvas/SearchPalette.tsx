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

import { useState } from 'react'
import { TYPE_BADGE_COLORS, PORT_COLORS, PORT_LABEL_COLORS } from './types'
import type { CalculationType } from './types'

const TYPE_LABELS: Record<CalculationType, string> = {
  DIRECT_AMOUNT:    'DIRECT AMOUNT',
  JAVA_PROVIDED:    'JAVA PROVIDED',
  RATE_BY_QUANTITY: 'RATE×QTY',
  PERCENTAGE:       'PERCENTAGE',
  AGGREGATE:        'AGGREGATE',
}

const PORTS = ['qty', 'rate', 'base', 'pct', 'feed', 'out'] as const

export function CanvasLegend() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Leyenda"
        className="text-[10px] px-2 py-1 bg-slate-800 border border-slate-700 text-slate-400 rounded-md hover:bg-slate-700"
      >
        {open ? '× Leyenda' : '? Leyenda'}
      </button>

      {open && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-[10px] space-y-3 w-52">
          <section>
            <div className="text-slate-500 uppercase tracking-wide text-[9px] mb-1.5">Tipos de cálculo</div>
            <div className="space-y-1">
              {(Object.entries(TYPE_BADGE_COLORS) as [CalculationType, string][]).map(([type, cls]) => (
                <span key={type} className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded ${cls}`}>
                  {TYPE_LABELS[type]}
                </span>
              ))}
            </div>
          </section>

          <section>
            <div className="text-slate-500 uppercase tracking-wide text-[9px] mb-1.5">Puertos</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {PORTS.map(port => (
                <div key={port} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${PORT_COLORS[port]}`} />
                  <span className={`${PORT_LABEL_COLORS[port]}`}>{port}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="text-slate-500 uppercase tracking-wide text-[9px] mb-1.5">Aristas</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-green-400 flex-shrink-0" />
                <span className="text-slate-400">Feed positivo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-red-400 flex-shrink-0" />
                <span className="text-slate-400">Feed negativo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-sky-400 flex-shrink-0" />
                <span className="text-slate-400">Operando qty</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-amber-400 flex-shrink-0" />
                <span className="text-slate-400">Operando rate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-violet-400 flex-shrink-0" />
                <span className="text-slate-400">Operando base</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-pink-400 flex-shrink-0" />
                <span className="text-slate-400">Operando pct</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

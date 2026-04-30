import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tableRowsApi, type TableRowDto } from './api/tableRowsApi'

interface Props {
  ruleSystemCode: string
  tableCode: string
  row: TableRowDto | null  // null = create mode
  onClose: () => void
}

interface FormState {
  searchCode: string
  startDate: string
  endDate: string
  monthlyValue: string
  annualValue: string
  dailyValue: string
  hourlyValue: string
  active: boolean
}

function emptyForm(): FormState {
  return { searchCode: '', startDate: '', endDate: '', monthlyValue: '', annualValue: '', dailyValue: '', hourlyValue: '', active: true }
}

function rowToForm(row: TableRowDto): FormState {
  return {
    searchCode: row.searchCode,
    startDate: row.startDate,
    endDate: row.endDate ?? '',
    monthlyValue: String(row.monthlyValue),
    annualValue: String(row.annualValue),
    dailyValue: String(row.dailyValue),
    hourlyValue: String(row.hourlyValue),
    active: row.active,
  }
}

export function TableRowModal({ ruleSystemCode, tableCode, row, onClose }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState<FormState>(row ? rowToForm(row) : emptyForm())

  useEffect(() => {
    setForm(row ? rowToForm(row) : emptyForm())
  }, [row])

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: field === 'active' ? (e.target as HTMLInputElement).checked : e.target.value }))

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        searchCode: form.searchCode,
        startDate: form.startDate,
        endDate: form.endDate || null,
        monthlyValue: parseFloat(form.monthlyValue),
        annualValue: parseFloat(form.annualValue),
        dailyValue: parseFloat(form.dailyValue),
        hourlyValue: parseFloat(form.hourlyValue),
      }
      return row
        ? tableRowsApi.updateRow(ruleSystemCode, tableCode, row.id, { ...body, active: form.active })
        : tableRowsApi.createRow(ruleSystemCode, tableCode, body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['table-rows', ruleSystemCode, tableCode] })
      onClose()
    },
  })

  const isValid = form.searchCode && form.startDate && form.monthlyValue && form.annualValue && form.dailyValue && form.hourlyValue

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4">
        <p className="text-sm font-medium text-slate-200 mb-1">
          {row ? 'Editar fila' : 'Nueva fila'} · <span className="font-mono text-sky-400">{tableCode}</span>
        </p>
        <p className="text-[9px] text-slate-500 mb-4">
          Los valores se usan en el motor de cálculo para resolver conceptos de tipo DIRECT_AMOUNT.
        </p>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="col-span-1">
            <label className="text-[9px] text-slate-500 uppercase tracking-wide">Código búsqueda *</label>
            <input type="text" value={form.searchCode} onChange={set('searchCode')}
              className="mt-0.5 w-full bg-slate-950 border border-slate-700 rounded text-[10px] text-slate-200 font-mono px-1.5 py-1 focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="text-[9px] text-slate-500 uppercase tracking-wide">Desde *</label>
            <input type="date" value={form.startDate} onChange={set('startDate')}
              className="mt-0.5 w-full bg-slate-950 border border-slate-700 rounded text-[10px] text-slate-200 px-1.5 py-1 focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="text-[9px] text-slate-500 uppercase tracking-wide">Hasta</label>
            <input type="date" value={form.endDate} onChange={set('endDate')}
              className="mt-0.5 w-full bg-slate-950 border border-slate-700 rounded text-[10px] text-slate-200 px-1.5 py-1 focus:outline-none focus:border-sky-500" />
          </div>
        </div>

        <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1.5">Valores salariales *</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {(['monthlyValue', 'annualValue', 'dailyValue', 'hourlyValue'] as const).map(field => (
            <div key={field}>
              <label className="text-[9px] text-slate-500">
                {{ monthlyValue: 'Mensual (€)', annualValue: 'Anual (€)', dailyValue: 'Diario (€)', hourlyValue: 'Por hora (€)' }[field]}
              </label>
              <input type="number" step="0.01" value={form[field]} onChange={set(field)}
                className="mt-0.5 w-full bg-slate-950 border border-slate-700 rounded text-[10px] text-slate-200 px-1.5 py-1 focus:outline-none focus:border-sky-500" />
            </div>
          ))}
        </div>

        {row && (
          <label className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="accent-sky-500" />
            <span className="text-[10px] text-slate-400">Activo</span>
          </label>
        )}

        {mutation.isError && (
          <p className="text-red-400 text-[9px] mb-2">Error al guardar la fila</p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-700">
            Cancelar
          </button>
          <button type="button" disabled={mutation.isPending || !isValid} onClick={() => mutation.mutate()}
            className="text-xs px-3 py-1.5 bg-sky-900 border border-sky-700 text-sky-300 rounded-md hover:bg-sky-800 disabled:opacity-50">
            {mutation.isPending ? 'Guardando...' : 'Guardar fila'}
          </button>
        </div>
      </div>
    </>
  )
}

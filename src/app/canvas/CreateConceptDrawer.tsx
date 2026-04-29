import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { conceptsApi } from './api/conceptsApi'

interface Props { open: boolean; onClose: () => void; ruleSystemCode: string }

export function CreateConceptDrawer({ open, onClose, ruleSystemCode }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    conceptCode: '',
    conceptMnemonic: '',
    calculationType: 'RATE_BY_QUANTITY',
    functionalNature: 'EARNING',
    resultCompositionMode: 'ACCUMULATE',
    executionScope: 'SEGMENT',
    payslipOrderCode: '',
  })

  const mutation = useMutation({
    mutationFn: () => conceptsApi.createConcept(ruleSystemCode, {
      ...form,
      payslipOrderCode: form.payslipOrderCode || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['concepts', ruleSystemCode] })
      onClose()
    },
  })

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col bg-slate-900 border-l border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-base font-medium text-slate-200">Nuevo concepto</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
          <div>
            <Label className="text-slate-400">Código</Label>
            <Input
              className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              value={form.conceptCode}
              onChange={e => setForm(f => ({ ...f, conceptCode: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-slate-400">Mnemónico</Label>
            <Input
              className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              value={form.conceptMnemonic}
              onChange={e => setForm(f => ({ ...f, conceptMnemonic: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-slate-400">Tipo de cálculo</Label>
            <Select value={form.calculationType} onValueChange={v => { if (v) setForm(f => ({ ...f, calculationType: v })) }}>
              <SelectTrigger className="w-full bg-slate-950 border-slate-700 text-slate-200 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {['DIRECT_AMOUNT', 'RATE_BY_QUANTITY', 'PERCENTAGE', 'AGGREGATE', 'JAVA_PROVIDED'].map(t => (
                  <SelectItem key={t} value={t} className="text-slate-200">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-400">Naturaleza funcional</Label>
            <Select value={form.functionalNature} onValueChange={v => { if (v) setForm(f => ({ ...f, functionalNature: v })) }}>
              <SelectTrigger className="w-full bg-slate-950 border-slate-700 text-slate-200 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {['EARNING', 'DEDUCTION', 'BASE', 'INFORMATIONAL', 'TECHNICAL', 'TOTAL_EARNING', 'TOTAL_DEDUCTION', 'NET_PAY'].map(n => (
                  <SelectItem key={n} value={n} className="text-slate-200">{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-400">Ámbito</Label>
            <Select value={form.executionScope} onValueChange={v => { if (v) setForm(f => ({ ...f, executionScope: v })) }}>
              <SelectTrigger className="w-full bg-slate-950 border-slate-700 text-slate-200 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="SEGMENT" className="text-slate-200">SEGMENT</SelectItem>
                <SelectItem value="PERIOD" className="text-slate-200">PERIOD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-400">Orden nómina (opcional)</Label>
            <Input
              className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              value={form.payslipOrderCode}
              onChange={e => setForm(f => ({ ...f, payslipOrderCode: e.target.value }))}
            />
          </div>
          {mutation.isError && (
            <div className="text-red-400 text-xs">Error al crear concepto</div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.conceptCode || !form.conceptMnemonic}
            className="w-full bg-sky-600 hover:bg-sky-500"
          >
            {mutation.isPending ? 'Creando...' : 'Crear concepto'}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full border-slate-700 text-slate-300">
            Cancelar
          </Button>
        </div>
      </div>
    </>
  )
}

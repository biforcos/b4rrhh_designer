import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { conceptsApi } from '../canvas/api/conceptsApi'
import { assignmentsApi } from './api/assignmentsApi'

interface Props {
  open: boolean
  onClose: () => void
  ruleSystemCode: string
}

const initialForm = {
  conceptCode: '',
  companyCode: '',
  agreementCode: '',
  employeeTypeCode: '',
  validFrom: '',
  validTo: '',
  priority: '',
}

export function CreateAssignmentDrawer({ open, onClose, ruleSystemCode }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    if (!open) setForm(initialForm)
  }, [open])

  const { data: concepts = [] } = useQuery({
    queryKey: ['concepts', ruleSystemCode],
    queryFn: () => conceptsApi.listConcepts(ruleSystemCode),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: () =>
      assignmentsApi.create(ruleSystemCode, {
        conceptCode: form.conceptCode,
        companyCode: form.companyCode || null,
        agreementCode: form.agreementCode || null,
        employeeTypeCode: form.employeeTypeCode || null,
        validFrom: form.validFrom,
        validTo: form.validTo || null,
        priority: parseInt(form.priority, 10),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', ruleSystemCode] })
      onClose()
    },
  })

  if (!open) return null

  const isValid = form.conceptCode !== '' && form.validFrom !== '' && form.priority !== ''

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col bg-slate-900 border-l border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-base font-medium text-slate-200">Nueva asignación</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
          <div>
            <Label htmlFor="conceptCode" className="text-slate-400">Concepto</Label>
            <Select value={form.conceptCode} onValueChange={v => setForm(f => ({ ...f, conceptCode: v }))}>
              <SelectTrigger
                id="conceptCode"
                aria-label="Concepto"
                className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              >
                <SelectValue placeholder="— selecciona un concepto —" />
              </SelectTrigger>
              <SelectContent>
                {concepts.map(c => (
                  <SelectItem key={c.conceptCode} value={c.conceptCode}>
                    {c.conceptCode} — {c.conceptMnemonic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="companyCode" className="text-slate-400">Empresa</Label>
            <Input
              id="companyCode"
              className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              placeholder="* cualquier empresa"
              value={form.companyCode}
              onChange={e => setForm(f => ({ ...f, companyCode: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="agreementCode" className="text-slate-400">Convenio</Label>
            <Input
              id="agreementCode"
              className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              placeholder="* cualquier convenio"
              value={form.agreementCode}
              onChange={e => setForm(f => ({ ...f, agreementCode: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="employeeTypeCode" className="text-slate-400">Tipo de empleado</Label>
            <Input
              id="employeeTypeCode"
              className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              placeholder="* cualquier tipo"
              value={form.employeeTypeCode}
              onChange={e => setForm(f => ({ ...f, employeeTypeCode: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="validFrom" className="text-slate-400">Desde</Label>
            <Input
              id="validFrom"
              type="date"
              className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              value={form.validFrom}
              onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="validTo" className="text-slate-400">Hasta (opcional)</Label>
            <Input
              id="validTo"
              type="date"
              className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              value={form.validTo}
              onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="priority" className="text-slate-400">Prioridad</Label>
            <Input
              id="priority"
              type="number"
              min={1}
              className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            />
          </div>

          {mutation.isError && (
            <div className="text-red-400 text-xs">Error al crear la asignación</div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !isValid}
            className="w-full bg-sky-600 hover:bg-sky-500"
          >
            {mutation.isPending ? 'Creando...' : 'Crear asignación'}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full border-slate-700 text-slate-300">
            Cancelar
          </Button>
        </div>
      </div>
    </>
  )
}

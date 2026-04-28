import { apiFetch } from '../../../api/client'

export interface AssignmentDto {
  assignmentCode: string
  ruleSystemCode: string
  conceptCode: string
  companyCode: string | null
  agreementCode: string | null
  employeeTypeCode: string | null
  validFrom: string
  validTo: string | null
  priority: number
}

export const assignmentsApi = {
  list: (ruleSystemCode: string, conceptCode?: string) => {
    const qs = conceptCode ? `?conceptCode=${conceptCode}` : ''
    return apiFetch<AssignmentDto[]>(`/payroll-engine/${ruleSystemCode}/assignments${qs}`)
  },
  create: (ruleSystemCode: string, body: Omit<AssignmentDto, 'assignmentCode' | 'ruleSystemCode'>) =>
    apiFetch<AssignmentDto>(`/payroll-engine/${ruleSystemCode}/assignments`, {
      method: 'POST', body: JSON.stringify(body),
    }),
  delete: (ruleSystemCode: string, assignmentCode: string) =>
    apiFetch<void>(`/payroll-engine/${ruleSystemCode}/assignments/${assignmentCode}`, { method: 'DELETE' }),
}

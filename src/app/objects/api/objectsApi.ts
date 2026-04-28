import { apiFetch } from '../../../api/client'

export interface PayrollObjectDto {
  ruleSystemCode: string
  objectCode: string
  objectTypeCode: 'TABLE' | 'CONSTANT'
  displayOrder: number | null
  active: boolean
}

export const objectsApi = {
  list: (ruleSystemCode: string, type: 'TABLE' | 'CONSTANT') =>
    apiFetch<PayrollObjectDto[]>(`/payroll-engine/${ruleSystemCode}/objects?type=${type}`),
}

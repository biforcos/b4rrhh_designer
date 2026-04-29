import { apiFetch } from './client'

export interface RuleSystemDto {
  code: string
  name: string
  active: boolean
}

export const ruleSystemsApi = {
  list: () => apiFetch<RuleSystemDto[]>('/rule-systems'),
}

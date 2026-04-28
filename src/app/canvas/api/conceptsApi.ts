import { apiFetch } from '../../../api/client'

export interface ConceptDto {
  ruleSystemCode: string
  conceptCode: string
  conceptMnemonic: string
  calculationType: string
  functionalNature: string
  resultCompositionMode: string
  executionScope: string
  payslipOrderCode: string | null
}

export interface OperandDto { operandRole: string; sourceObjectCode: string }
export interface FeedDto { sourceObjectCode: string; invertSign: boolean; effectiveFrom: string; effectiveTo: string | null }

export const conceptsApi = {
  listConcepts: (ruleSystemCode: string) =>
    apiFetch<ConceptDto[]>(`/payroll-engine/${ruleSystemCode}/concepts`),

  listOperands: (ruleSystemCode: string, conceptCode: string) =>
    apiFetch<OperandDto[]>(`/payroll-engine/${ruleSystemCode}/concepts/${conceptCode}/operands`),

  listFeeds: (ruleSystemCode: string, conceptCode: string) =>
    apiFetch<FeedDto[]>(`/payroll-engine/${ruleSystemCode}/concepts/${conceptCode}/feeds`),

  createConcept: (ruleSystemCode: string, body: Omit<ConceptDto, 'ruleSystemCode'>) =>
    apiFetch<ConceptDto>(`/payroll-engine/${ruleSystemCode}/concepts`, {
      method: 'POST', body: JSON.stringify(body),
    }),

  deleteConcept: (ruleSystemCode: string, conceptCode: string) =>
    apiFetch<void>(`/payroll-engine/${ruleSystemCode}/concepts/${conceptCode}`, { method: 'DELETE' }),

  replaceOperands: (ruleSystemCode: string, conceptCode: string, operands: OperandDto[]) =>
    apiFetch<OperandDto[]>(`/payroll-engine/${ruleSystemCode}/concepts/${conceptCode}/operands`, {
      method: 'PUT', body: JSON.stringify({ operands }),
    }),

  replaceFeeds: (ruleSystemCode: string, conceptCode: string, feeds: FeedDto[]) =>
    apiFetch<void>(`/payroll-engine/${ruleSystemCode}/concepts/${conceptCode}/feeds`, {
      method: 'PUT', body: JSON.stringify({ feeds }),
    }),
}

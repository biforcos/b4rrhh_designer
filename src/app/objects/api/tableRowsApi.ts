import { apiFetch } from '../../../api/client'

export interface TableRowDto {
  id: number
  searchCode: string
  startDate: string
  endDate: string | null
  monthlyValue: number
  annualValue: number
  dailyValue: number
  hourlyValue: number
  active: boolean
}

export interface CreateTableRowBody {
  searchCode: string
  startDate: string
  endDate: string | null
  monthlyValue: number
  annualValue: number
  dailyValue: number
  hourlyValue: number
}

export interface UpdateTableRowBody {
  searchCode?: string
  startDate?: string
  endDate?: string | null
  monthlyValue?: number
  annualValue?: number
  dailyValue?: number
  hourlyValue?: number
  active?: boolean
}

export const tableRowsApi = {
  createTable: (ruleSystemCode: string, objectCode: string) =>
    apiFetch<{ ruleSystemCode: string; objectCode: string }>(
      `/payroll-engine/${ruleSystemCode}/tables`,
      { method: 'POST', body: JSON.stringify({ objectCode }) }
    ),

  listRows: (ruleSystemCode: string, tableCode: string) =>
    apiFetch<TableRowDto[]>(`/payroll-engine/${ruleSystemCode}/tables/${tableCode}/rows`),

  createRow: (ruleSystemCode: string, tableCode: string, body: CreateTableRowBody) =>
    apiFetch<TableRowDto>(
      `/payroll-engine/${ruleSystemCode}/tables/${tableCode}/rows`,
      { method: 'POST', body: JSON.stringify(body) }
    ),

  updateRow: (ruleSystemCode: string, tableCode: string, rowId: number, body: UpdateTableRowBody) =>
    apiFetch<TableRowDto>(
      `/payroll-engine/${ruleSystemCode}/tables/${tableCode}/rows/${rowId}`,
      { method: 'PUT', body: JSON.stringify(body) }
    ),

  deleteRow: (ruleSystemCode: string, tableCode: string, rowId: number) =>
    apiFetch<void>(
      `/payroll-engine/${ruleSystemCode}/tables/${tableCode}/rows/${rowId}`,
      { method: 'DELETE' }
    ),
}

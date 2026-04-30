import { useQuery } from '@tanstack/react-query'
import { tableRowsApi } from './api/tableRowsApi'

export function useTableRows(ruleSystemCode: string, tableCode: string | null) {
  return useQuery({
    queryKey: ['table-rows', ruleSystemCode, tableCode],
    queryFn: () => tableRowsApi.listRows(ruleSystemCode, tableCode!),
    enabled: tableCode !== null,
  })
}

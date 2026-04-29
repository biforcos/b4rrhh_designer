import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface RuleSystemState {
  ruleSystemCode: string
  setRuleSystemCode: (code: string) => void
}

export const useRuleSystemStore = create<RuleSystemState>()(
  persist(
    (set) => ({
      ruleSystemCode: 'ESP',
      setRuleSystemCode: (code) => set({ ruleSystemCode: code }),
    }),
    { name: 'b4rrhh-rule-system' }
  )
)

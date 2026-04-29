const storageKey = (ruleSystemCode: string) => `graph-positions-${ruleSystemCode}`

type PositionMap = Record<string, { x: number; y: number }>

export function loadPositions(ruleSystemCode: string): PositionMap {
  try {
    return JSON.parse(localStorage.getItem(storageKey(ruleSystemCode)) ?? '{}')
  } catch {
    return {}
  }
}

export function savePositions(ruleSystemCode: string, nodes: { id: string; position: { x: number; y: number } }[]) {
  const map: PositionMap = {}
  for (const n of nodes) map[n.id] = n.position
  localStorage.setItem(storageKey(ruleSystemCode), JSON.stringify(map))
}

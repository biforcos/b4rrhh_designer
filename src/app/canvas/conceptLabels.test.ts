import { NATURE_LABELS, NATURE_COLORS, COMPOSITION_LABELS, SCOPE_LABELS } from './conceptLabels'

describe('conceptLabels', () => {
  it('NATURE_LABELS has a Spanish label for every FunctionalNature value', () => {
    const natures = ['EARNING', 'DEDUCTION', 'BASE', 'INFORMATIONAL', 'TECHNICAL', 'TOTAL_EARNING', 'TOTAL_DEDUCTION', 'NET_PAY']
    natures.forEach(k => expect(NATURE_LABELS).toHaveProperty(k))
  })

  it('NATURE_COLORS has a Tailwind class for every FunctionalNature value', () => {
    const natures = ['EARNING', 'DEDUCTION', 'BASE', 'INFORMATIONAL', 'TECHNICAL', 'TOTAL_EARNING', 'TOTAL_DEDUCTION', 'NET_PAY']
    natures.forEach(k => expect(NATURE_COLORS).toHaveProperty(k))
  })

  it('COMPOSITION_LABELS maps REPLACE and ACCUMULATE to Spanish', () => {
    expect(COMPOSITION_LABELS.REPLACE).toBe('Reemplaza')
    expect(COMPOSITION_LABELS.ACCUMULATE).toBe('Acumula')
  })

  it('SCOPE_LABELS maps SEGMENT and PERIOD to Spanish', () => {
    expect(SCOPE_LABELS.SEGMENT).toBe('Segmento')
    expect(SCOPE_LABELS.PERIOD).toBe('Período')
  })
})

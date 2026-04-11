import { describe, it, expect } from 'vitest'
import { ALGO_DESIGN_SOURCES, ALGO_SYSTEM_RULES, tokens } from '../../../config/algo-system-rules'

describe('config/algo-system-rules', () => {
  it('expose les chemins sources canoniques', () => {
    expect(ALGO_DESIGN_SOURCES.visualTokens).toContain('design-system')
    expect(ALGO_DESIGN_SOURCES.globalsTheme).toContain('globals.css')
    expect(ALGO_DESIGN_SOURCES.designEvolutionBridge).toBe('docs/ALGO_DESIGN_EVOLUTION.md')
    expect(ALGO_DESIGN_SOURCES.uxCharter).toBe('docs/ALGO_UX_CHARTER.md')
    expect(ALGO_DESIGN_SOURCES.uxCognitiveAudit).toBe('docs/ALGO_UX_COGNITIVE_AUDIT.md')
    expect(ALGO_DESIGN_SOURCES.releaseReadiness).toBe('docs/ALGO_RELEASE_READINESS.md')
    expect(ALGO_DESIGN_SOURCES.operationsPlaybook).toBe('docs/ALGO_OPERATIONS_PLAYBOOK.md')
  })

  it('décrit les règles UI sans être vide', () => {
    expect(ALGO_SYSTEM_RULES.experience.charter).toMatch(/ALGO_UX_CHARTER/i)
    expect(ALGO_SYSTEM_RULES.experience.cognitiveAudit).toMatch(/ALGO_UX_COGNITIVE_AUDIT/i)
    expect(ALGO_SYSTEM_RULES.experience.releaseReadiness).toMatch(/ALGO_RELEASE_READINESS/i)
    expect(ALGO_SYSTEM_RULES.experience.cognitiveAlignment).toMatch(/ALGO_UX_CHARTER/i)
    expect(ALGO_SYSTEM_RULES.layout.surfaces).toMatch(/algo-surface/i)
    expect(ALGO_SYSTEM_RULES.animation.policy).toMatch(/ms|bounce|ease/i)
    expect(ALGO_SYSTEM_RULES.coherence.checklist.length).toBeGreaterThanOrEqual(3)
  })

  it('réexporte tokens avec couleurs clés', () => {
    expect(tokens.colors.accent.violet).toMatch(/^#/)
    expect(tokens.colors.bg.primary).toMatch(/^#/)
  })
})

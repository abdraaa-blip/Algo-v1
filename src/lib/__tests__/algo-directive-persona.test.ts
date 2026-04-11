import { describe, it, expect } from 'vitest'
import {
  ALGO_AI_CORE_INTELLIGENCE_LAYER,
  ALGO_DIRECTIVE_OPERATING_LAYER,
  ALGO_DIRECTIVE_FAMILY_HINTS_FR,
  ALGO_MASTER_SYSTEM_DIRECTIVE_LAYER,
} from '@/lib/ai/algo-directive-synthesis'
import { ALGO_VOICE_AI_SYSTEM_LAYER } from '@/lib/copy/algo-voice'
import { buildAlgoSystemPrompt, TASK_ASK_OPEN } from '@/lib/ai/algo-persona'

describe('Directive 2 → synthèse ALGO', () => {
  it('expose huit familles pour UI / transparence', () => {
    expect(ALGO_DIRECTIVE_FAMILY_HINTS_FR).toHaveLength(8)
    const codes = ALGO_DIRECTIVE_FAMILY_HINTS_FR.map((r) => r.code)
    expect(codes).toContain('VBUZZ')
    expect(codes).toContain('VALGO')
  })

  it('la couche directive reste sobre et ancrée produit', () => {
    expect(ALGO_DIRECTIVE_OPERATING_LAYER).toMatch(/silencieuse|signal/i)
    expect(ALGO_DIRECTIVE_OPERATING_LAYER).toMatch(/mysticisme/i)
    expect(ALGO_DIRECTIVE_OPERATING_LAYER).toMatch(/double focale|création \+ risque/i)
    expect(ALGO_DIRECTIVE_OPERATING_LAYER).toMatch(/Décision|orientation/i)
    expect(ALGO_DIRECTIVE_OPERATING_LAYER).toMatch(/2–3|scénario/i)
  })

  it('la couche Core Intelligence pousse utilité et décision sans promesses magiques', () => {
    expect(ALGO_AI_CORE_INTELLIGENCE_LAYER).toMatch(/comprendre|décider|agir/i)
    expect(ALGO_AI_CORE_INTELLIGENCE_LAYER).toMatch(/hypothèse|précision/i)
    expect(ALGO_AI_CORE_INTELLIGENCE_LAYER).toMatch(/promesses magiques|doctrine/i)
  })

  it('la directive maître ancre cohérence système et utilité', () => {
    expect(ALGO_MASTER_SYSTEM_DIRECTIVE_LAYER).toMatch(/Directive maître|système global/i)
    expect(ALGO_MASTER_SYSTEM_DIRECTIVE_LAYER).toMatch(/comprendre|décider|agir/i)
    expect(ALGO_MASTER_SYSTEM_DIRECTIVE_LAYER).toMatch(/doctrine|prudence/i)
  })

  it('TASK_ASK_OPEN pousse aide à décider (options + reco)', () => {
    expect(TASK_ASK_OPEN).toMatch(/2–3|décider/i)
    expect(TASK_ASK_OPEN).toMatch(/recommandation|reco/i)
  })

  it('buildAlgoSystemPrompt inclut la directive pour chaque tâche', () => {
    const sys = buildAlgoSystemPrompt(TASK_ASK_OPEN, {
      expertiseLevel: 'intermediate',
      voicePageContext: 'ai',
    })
    expect(sys).toContain('Directive maître ALGO')
    expect(sys).toContain(ALGO_MASTER_SYSTEM_DIRECTIVE_LAYER)
    expect(sys.indexOf('Directive maître ALGO')).toBeLessThan(
      sys.indexOf('Intelligence centrale ALGO AI')
    )
    expect(sys).toContain('Intelligence centrale ALGO AI')
    expect(sys).toContain(ALGO_AI_CORE_INTELLIGENCE_LAYER)
    expect(sys).toContain('Directive opérationnelle ALGO')
    expect(sys).toContain(ALGO_DIRECTIVE_OPERATING_LAYER)
    expect(sys).toContain(ALGO_VOICE_AI_SYSTEM_LAYER)
    expect(sys).toMatch(/Contexte page:\s*ALGO AI/i)
    expect(sys).toContain('ALGO AI')
  })
})

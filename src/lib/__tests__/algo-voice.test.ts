import { describe, it, expect } from 'vitest'
import {
  ALGO_VOICE_AI_SYSTEM_LAYER,
  ALGO_COPY_QUALITY_CHECKLIST_FR,
  algoVoiceContextFragment,
} from '@/lib/copy/algo-voice'

describe('algo-voice', () => {
  it('expose une couche IA non vide avec contraintes clés', () => {
    expect(ALGO_VOICE_AI_SYSTEM_LAYER.length).toBeGreaterThan(120)
    expect(ALGO_VOICE_AI_SYSTEM_LAYER).toMatch(/comprendre/i)
    expect(ALGO_VOICE_AI_SYSTEM_LAYER).toMatch(/indicateurs/i)
  })

  it('checklist auto-amélioration couvre clarté et promesses', () => {
    expect(ALGO_COPY_QUALITY_CHECKLIST_FR.length).toBeGreaterThanOrEqual(5)
    const joined = ALGO_COPY_QUALITY_CHECKLIST_FR.join(' ')
    expect(joined).toMatch(/titre|promesses|ton/i)
  })

  it('fragments contextuels sont distincts', () => {
    expect(algoVoiceContextFragment('trends')).toContain('tendances')
    expect(algoVoiceContextFragment('ai')).toContain('ALGO AI')
    expect(algoVoiceContextFragment('legal')).toContain('légal')
  })
})

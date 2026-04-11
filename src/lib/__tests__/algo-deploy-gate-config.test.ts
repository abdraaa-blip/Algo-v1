import { describe, it, expect } from 'vitest'
import {
  ALGO_DEPLOY_BLOCK_POLICY,
  ALGO_DEPLOY_CHECKLIST,
  ALGO_DEPLOY_COMMANDS,
  ALGO_DEPLOY_PHILOSOPHY,
  ALGO_DEPLOY_SOURCES,
} from '../../../config/algo-deploy-gate'

describe('config/algo-deploy-gate', () => {
  it('référence QA et design + workflows', () => {
    expect(ALGO_DEPLOY_SOURCES.releaseReadiness).toBe('docs/ALGO_RELEASE_READINESS.md')
    expect(ALGO_DEPLOY_SOURCES.qaGate).toBe('config/algo-qa-gate.ts')
    expect(ALGO_DEPLOY_SOURCES.designRules).toBe('config/algo-system-rules.ts')
    expect(ALGO_DEPLOY_SOURCES.ciWorkflow).toContain('ci.yml')
  })

  it('commande minimale alignée verify:release', () => {
    expect(ALGO_DEPLOY_COMMANDS.minimumBeforeDeploy).toContain('verify:release')
  })

  it('gate PR stricte alignée verify:full (perf + rapport)', () => {
    expect(ALGO_DEPLOY_COMMANDS.strictReleasePr).toContain('verify:full')
  })

  it('checklist couvre build, sécurité, smoke', () => {
    expect(ALGO_DEPLOY_CHECKLIST.buildAndCompilation.length).toBeGreaterThanOrEqual(2)
    expect(ALGO_DEPLOY_CHECKLIST.security.some((s) => s.includes('NEXT_PUBLIC'))).toBe(true)
    expect(ALGO_DEPLOY_CHECKLIST.functionalSmoke.some((s) => s.includes('/api/ai/ask'))).toBe(true)
  })

  it('politique de blocage explicite', () => {
    expect(ALGO_DEPLOY_BLOCK_POLICY.immediateActions[0]).toMatch(/Bloquer|bloquer/i)
    expect(ALGO_DEPLOY_PHILOSOPHY.tagline).toMatch(/rigueur|déploiement/i)
  })
})

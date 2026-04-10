import type { ActionProposal, ExecutionStatus } from '@/lib/autonomy/types'
import { evaluatePolicy } from '@/lib/autonomy/policy'
import { recordAutoExecuted } from '@/lib/autonomy/telemetry'

export interface ExecutionResult {
  status: ExecutionStatus
  policyReason: string
  requiresApproval: boolean
  idempotencyKey: string
  executedAt?: string
}

export function executeAutonomyProposal(proposal: ActionProposal): ExecutionResult {
  const policy = evaluatePolicy(proposal)
  if (!policy.allowed) {
    return {
      status: policy.requiresApproval ? 'blocked' : 'simulated',
      policyReason: policy.reason,
      requiresApproval: policy.requiresApproval,
      idempotencyKey: policy.idempotencyKey,
    }
  }

  // Safe MVP: internal no-side-effect execution receipt only.
  recordAutoExecuted()
  return {
    status: 'executed',
    policyReason: policy.reason,
    requiresApproval: false,
    idempotencyKey: policy.idempotencyKey,
    executedAt: new Date().toISOString(),
  }
}

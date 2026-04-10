# ALGO Daily System Report

- Generated: 2026-04-09T14:27:58.585Z
- Severity: low
- Release ready: yes

## Performance
- Total client JS (KB): 2039.37
- Largest chunk (KB): 221.05
- Largest route first-load JS (KB): 0

## Autopilot
- Report present: no

## Adaptive Model Audit
- Enabled: yes
- Baseline version: w_370902824
- Baseline weights: {"hook":0.25,"trend":0.3,"format":0.15,"emotion":0.15,"timing":0.15}
- Max shift per signal: 0.03
- Blend strategy: adaptive+baseline mean
- Auto rollback rule: frictionRate > 0.20 OR (frictionRate > 0.12 AND engagementRate < 0.10)
- Safeguard: weights are clamped per signal family
- Safeguard: weights are normalized before scoring
- Safeguard: adaptive mode falls back to baseline if signals are unavailable
- Safeguard: automatic rollback to baseline on degraded quality signals
- Runtime signals: sourced from /api/analytics/events adaptiveSignals

## Recommendations
- Prioriser la reduction du JS partage sur les routes avec first-load eleve.
- Surveiller les regressions de taille de bundle a chaque PR.
- Analyser les incidents cron et renforcer les retries/idempotence en cas d echec source externe.

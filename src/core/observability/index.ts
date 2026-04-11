export type { AlgoObsAnomaly } from "@/core/observability/anomalies";
export { detectLogAnomalies } from "@/core/observability/anomalies";
export { isObservabilityDashboardEnabled } from "@/core/observability/guard";
export {
  addLog,
  clearLogs,
  getCriticalErrors,
  getErrorLogs,
  getLogBufferSize,
  getLogs,
  setObservabilityBufferMax,
  subscribeObservabilityLogs,
} from "@/core/observability/logStore";
export type { LogFilter } from "@/core/observability/logStore";
export { computeObservabilityMetrics } from "@/core/observability/metrics";
export type { AlgoObservabilityMetrics } from "@/core/observability/metrics";
export type {
  AlgoObsLayer,
  AlgoObsLog,
  AlgoObsSeverity,
} from "@/core/observability/types";

/**
 * Types du journal d’observabilité ALGO (lecture seule côté métier · pas de logique produit).
 */

export type AlgoObsLayer = "api" | "ai" | "ui" | "memory" | "system";

export type AlgoObsSeverity = "info" | "warning" | "error" | "critical";

export type AlgoObsLog = {
  timestamp: number;
  layer: AlgoObsLayer;
  type: AlgoObsSeverity;
  message: string;
  metadata?: Record<string, unknown>;
};

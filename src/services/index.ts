/**
 * ALGO Services - The Autonomous Nervous System
 *
 * This module exports all services that make ALGO a living, breathing organism.
 * Every cell updates together. Every signal propagates simultaneously.
 */

// Core Event Bus - The neural network connecting everything
export {
  AlgoEventBus,
  type AlgoEventType,
  type AlgoEventPayload,
} from "./AlgoEventBus";

// Multi-layer intelligent cache
export { AlgoCache, CACHE_CONFIG, type CacheSource } from "./AlgoCache";

// Scope propagation system
export { AlgoScope, SCOPES, type Scope } from "./AlgoScope";

// Central orchestrator - the brain
export { AlgoOrchestrator } from "./AlgoOrchestrator";

// Real-time viral score calculator
export { AlgoScoreEngine } from "./AlgoScoreEngine";

// Supabase realtime & signal detection
export { AlgoRealtime } from "./AlgoRealtime";

// System integrity monitor
export { AlgoCoherenceGuard } from "./AlgoCoherenceGuard";

// Adaptive performance optimizer
export { AlgoPerformanceOptimizer } from "./AlgoPerformanceOptimizer";

/**
 * ALGO Hooks - Central Export
 * All custom hooks for the application
 */

// Auth
export { useAuth } from "./useAuth";

// Network & Connectivity
export {
  useNetworkStatus,
  shouldUseCachedContent,
  getImageQuality,
} from "./useNetworkStatus";

// Data Fetching & State
export { useAutoRefresh, formatTimeSinceRefresh } from "./useAutoRefresh";
export {
  useOptimistic,
  useOptimisticList,
  useOptimisticToggle,
} from "./useOptimistic";

// UX
export { useHaptic, withHaptic } from "./useHaptic";

// Mobile
export { useIsMobile } from "./use-mobile";

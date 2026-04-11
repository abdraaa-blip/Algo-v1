"use client";

import {
  useEffect,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";

interface AlgoSystemContextValue {
  isInitialized: boolean;
  isOnline: boolean;
}

const AlgoSystemContext = createContext<AlgoSystemContextValue>({
  isInitialized: false,
  isOnline: true,
});

export function useAlgoSystemContext() {
  return useContext(AlgoSystemContext);
}

/**
 * Simplified Provider - handles service initialization gracefully
 */
export function AlgoSystemProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize services with error handling
    const initServices = async () => {
      try {
        // Dynamic imports with error handling for each service
        const [orchestrator, guard, engine] = await Promise.allSettled([
          import("@/services/AlgoOrchestrator"),
          import("@/services/AlgoCoherenceGuard"),
          import("@/services/AlgoScoreEngine"),
        ]);

        if (
          orchestrator.status === "fulfilled" &&
          orchestrator.value.AlgoOrchestrator?.start
        ) {
          orchestrator.value.AlgoOrchestrator.start();
        }
        if (
          guard.status === "fulfilled" &&
          guard.value.AlgoCoherenceGuard?.start
        ) {
          guard.value.AlgoCoherenceGuard.start();
        }
        if (
          engine.status === "fulfilled" &&
          engine.value.AlgoScoreEngine?.start
        ) {
          engine.value.AlgoScoreEngine.start();
        }

        setIsInitialized(true);
      } catch {
        // Services failed to load - continue without them
        setIsInitialized(true);
      }
    };

    initServices();

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AlgoSystemContext.Provider value={{ isInitialized, isOnline }}>
      {children}
    </AlgoSystemContext.Provider>
  );
}

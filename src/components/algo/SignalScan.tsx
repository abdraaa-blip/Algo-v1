"use client";

import { useEffect, useState } from "react";

export function SignalScan() {
  const [showScan, setShowScan] = useState(false);

  useEffect(() => {
    // Check if scan has already been shown this session
    const hasScanned = sessionStorage.getItem("algo-signal-scanned");
    if (!hasScanned) {
      setShowScan(true);
      sessionStorage.setItem("algo-signal-scanned", "true");

      // Hide scan after animation completes
      const timer = setTimeout(() => setShowScan(false), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  if (!showScan) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{ overflow: "hidden" }}
    >
      <div
        className="absolute top-0 left-0 w-full h-[1px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, #7B61FF 20%, #7B61FF 80%, transparent)",
          boxShadow: "0 0 20px #7B61FF, 0 0 40px #7B61FF",
          animation: "algo-signal-scan 0.9s ease-out forwards",
        }}
      />
    </div>
  );
}

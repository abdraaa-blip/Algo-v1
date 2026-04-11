"use client";

import { useEffect, useState } from "react";

export function AlgoOrganism() {
  // Only render on client to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        suppressHydrationWarning
      >
        {/* Curve 1 - Violet - main ECG signal */}
        <path
          d="M0,450 L100,450 L120,450 L130,300 L140,600 L150,200 L160,700 L170,450 L300,450 L320,420 L340,480 L360,430 L380,470 L600,450 L620,450 L630,350 L640,550 L650,250 L660,650 L670,450 L800,450 L820,430 L840,470 L860,440 L880,460 L1100,450 L1120,450 L1130,320 L1140,580 L1150,220 L1160,680 L1170,450 L1440,450"
          fill="none"
          stroke="#7B61FF"
          strokeWidth="1.5"
          opacity="0.15"
          style={{ filter: "drop-shadow(0 0 4px rgba(123,97,255,0.4))" }}
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            from="-1440 0"
            to="0 0"
            dur="20s"
            repeatCount="indefinite"
            calcMode="linear"
          />
        </path>

        {/* Curve 2 - Green - fast signal */}
        <path
          d="M0,500 L200,500 L220,480 L240,520 L260,470 L280,530 L300,490 L320,510 L500,500 L510,460 L520,540 L530,440 L540,560 L550,500 L700,500 L720,485 L740,515 L760,478 L780,522 L1000,500 L1010,455 L1020,545 L1030,445 L1040,555 L1050,500 L1440,500"
          fill="none"
          stroke="#00FFB2"
          strokeWidth="1"
          opacity="0.1"
          style={{ filter: "blur(0.5px)" }}
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            from="-1440 0"
            to="0 0"
            dur="13s"
            repeatCount="indefinite"
            calcMode="linear"
          />
        </path>

        {/* Curve 3 - Blue - slow wave */}
        <path
          d="M0,400 C200,350 400,480 600,400 C800,320 1000,480 1200,400 C1350,340 1400,380 1440,400"
          fill="none"
          stroke="#00D1FF"
          strokeWidth="1.2"
          opacity="0.08"
          style={{ filter: "blur(1px)" }}
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            from="-1440 0"
            to="0 0"
            dur="25s"
            repeatCount="indefinite"
            calcMode="linear"
          />
        </path>

        {/* Curve 4 - Amber - pulse */}
        <path
          d="M0,550 L400,550 L410,540 L415,560 L417,500 L419,600 L421,550 L430,550 L840,550 L850,538 L855,562 L857,498 L859,602 L861,550 L870,550 L1280,550 L1290,540 L1295,560 L1297,502 L1299,598 L1301,550 L1310,550 L1440,550"
          fill="none"
          stroke="#FFD166"
          strokeWidth="0.8"
          opacity="0.07"
          style={{ filter: "blur(0.5px)" }}
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            from="-1440 0"
            to="0 0"
            dur="17s"
            repeatCount="indefinite"
            calcMode="linear"
          />
        </path>

        {/* Curve 5 - Red - alert signal */}
        <path
          d="M0,350 C100,340 200,360 300,350 L310,350 L312,340 L314,360 L316,330 L318,370 L320,350 L440,350 C540,340 640,360 740,350 L752,350 L754,338 L756,362 L758,328 L760,372 L762,350 L880,350 C980,342 1080,358 1180,350 L1192,350 L1194,340 L1196,360 L1198,332 L1200,368 L1202,350 L1440,350"
          fill="none"
          stroke="#FF4D6D"
          strokeWidth="0.8"
          opacity="0.06"
          style={{ filter: "blur(0.5px)" }}
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            from="-1440 0"
            to="0 0"
            dur="22s"
            repeatCount="indefinite"
            calcMode="linear"
          />
        </path>

        {/* Grid lines - static, no keys needed */}
        <line
          x1="0"
          y1="150"
          x2="1440"
          y2="150"
          stroke="rgba(255,255,255,0.02)"
          strokeWidth="1"
        />
        <line
          x1="0"
          y1="300"
          x2="1440"
          y2="300"
          stroke="rgba(255,255,255,0.02)"
          strokeWidth="1"
        />
        <line
          x1="0"
          y1="450"
          x2="1440"
          y2="450"
          stroke="rgba(255,255,255,0.02)"
          strokeWidth="1"
        />
        <line
          x1="0"
          y1="600"
          x2="1440"
          y2="600"
          stroke="rgba(255,255,255,0.02)"
          strokeWidth="1"
        />
        <line
          x1="0"
          y1="750"
          x2="1440"
          y2="750"
          stroke="rgba(255,255,255,0.02)"
          strokeWidth="1"
        />
        <line
          x1="240"
          y1="0"
          x2="240"
          y2="900"
          stroke="rgba(255,255,255,0.02)"
          strokeWidth="1"
        />
        <line
          x1="480"
          y1="0"
          x2="480"
          y2="900"
          stroke="rgba(255,255,255,0.02)"
          strokeWidth="1"
        />
        <line
          x1="720"
          y1="0"
          x2="720"
          y2="900"
          stroke="rgba(255,255,255,0.02)"
          strokeWidth="1"
        />
        <line
          x1="960"
          y1="0"
          x2="960"
          y2="900"
          stroke="rgba(255,255,255,0.02)"
          strokeWidth="1"
        />
        <line
          x1="1200"
          y1="0"
          x2="1200"
          y2="900"
          stroke="rgba(255,255,255,0.02)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

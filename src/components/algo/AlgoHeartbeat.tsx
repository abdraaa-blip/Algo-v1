"use client";

import { useEffect, useState } from "react";

/**
 * AlgoHeartbeat - Logo ALGO complet qui pulse comme un coeur
 * Avec une aura lumineuse qui pulse en meme temps
 * Puis explose en poussiere argentee et recommence
 */
export function AlgoHeartbeat() {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<"pulse" | "explode" | "hidden">("pulse");
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; angle: number }>
  >([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const cycle = () => {
      // Phase 1: Pulse (2 seconds)
      setPhase("pulse");

      setTimeout(() => {
        // Phase 2: Explode - create particles
        const newParticles = Array.from({ length: 20 }, (_, i) => ({
          id: i,
          x: Math.random() * 60 - 30,
          y: Math.random() * 40 - 20,
          angle: (i / 20) * 360,
        }));
        setParticles(newParticles);
        setPhase("explode");

        setTimeout(() => {
          // Phase 3: Hidden
          setPhase("hidden");
          setParticles([]);

          setTimeout(() => {
            // Restart cycle
            cycle();
          }, 300);
        }, 600);
      }, 2000);
    };

    cycle();
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="flex items-center">
        <span className="text-xl font-black text-white tracking-tight">
          ALGO
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center overflow-hidden z-10">
      {/* Aura glow behind */}
      <div
        className={`absolute inset-0 -m-2 rounded-lg transition-all duration-300 ${
          phase === "pulse" ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(123,97,255,0.4) 0%, transparent 70%)",
          filter: "blur(8px)",
          animation:
            phase === "pulse" ? "pulse-aura 1.5s ease-in-out infinite" : "none",
        }}
      />

      {/* Main ALGO text */}
      <span
        className={`relative text-xl font-black tracking-tight transition-all duration-200 ${
          phase === "hidden" ? "opacity-0 scale-75" : "opacity-100 scale-100"
        }`}
        style={{
          color: phase === "pulse" ? "#fff" : "rgba(255,255,255,0.8)",
          textShadow:
            phase === "pulse"
              ? "0 0 20px rgba(123,97,255,0.8), 0 0 40px rgba(123,97,255,0.4)"
              : "none",
          animation:
            phase === "pulse"
              ? "heartbeat-text 1.5s ease-in-out infinite"
              : "none",
        }}
      >
        ALGO
      </span>

      {/* Explosion particles */}
      {phase === "explode" &&
        particles.map((p) => (
          <div
            key={p.id}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: "linear-gradient(135deg, #C0C0C0, #E8E8E8)",
              boxShadow: "0 0 4px rgba(192,192,192,0.8)",
              left: "50%",
              top: "50%",
              transform: `translate(${p.x}px, ${p.y}px)`,
              animation: "particle-fly 0.6s ease-out forwards",
              animationDelay: `${p.id * 20}ms`,
            }}
          />
        ))}

      <style jsx>{`
        @keyframes pulse-aura {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.4;
          }
          14% {
            transform: scale(1.3);
            opacity: 0.8;
          }
          28% {
            transform: scale(1);
            opacity: 0.4;
          }
          42% {
            transform: scale(1.2);
            opacity: 0.6;
          }
          70% {
            transform: scale(1);
            opacity: 0.4;
          }
        }

        @keyframes heartbeat-text {
          0%,
          100% {
            transform: scale(1);
          }
          14% {
            transform: scale(1.08);
          }
          28% {
            transform: scale(1);
          }
          42% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(1);
          }
        }

        @keyframes particle-fly {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--x, 30px), var(--y, -20px)) scale(0);
          }
        }
      `}</style>
    </div>
  );
}

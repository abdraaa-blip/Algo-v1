"use client";

export function ShootingStars() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full opacity-0"
          style={{
            top: `${10 + i * 15}%`,
            left: "-10%",
            background: "white",
            boxShadow:
              "0 0 6px 2px rgba(255,255,255,0.8), -60px 0 20px rgba(123,97,255,0.4)",
            animation: `shooting-star ${8 + i * 3}s linear infinite`,
            animationDelay: `${i * 2.5}s`,
          }}
        />
      ))}
    </div>
  );
}

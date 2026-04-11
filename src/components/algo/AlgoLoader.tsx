"use client";

interface AlgoLoaderProps {
  message?: string;
}

export function AlgoLoader({
  message = "Lecture des signaux…",
}: AlgoLoaderProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <div className="flex gap-[6px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: "#7B61FF",
              animation: "algo-fade-up 1.2s ease-in-out infinite",
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>
      <p
        className="text-xs font-semibold"
        style={{ color: "rgba(240,240,248,0.38)" }}
      >
        {message}
      </p>
    </div>
  );
}

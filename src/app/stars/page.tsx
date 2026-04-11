"use client";
import { useState, useEffect } from "react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import {
  ALGO_UI_EMPTY,
  ALGO_UI_ERROR,
  ALGO_UI_LOADING,
} from "@/lib/copy/ui-strings";

interface Star {
  id: number;
  name: string;
  profile_path?: string;
  known_for_department: string;
  known_for?: Array<{ title?: string; name?: string }>;
  popularity: number;
}

export default function StarsPage() {
  const [data, setData] = useState<Star[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/live-stars");
      const json = await res.json();
      setData(json.data || []);
      setError(null);
    } catch {
      setError(ALGO_UI_ERROR.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "50vh",
          color: "#7B61FF",
        }}
      >
        <div className="algo-pulse">{ALGO_UI_LOADING.stars}</div>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 40,
          color: "rgba(240,240,248,0.38)",
        }}
      >
        {error}
        <button
          onClick={fetchData}
          style={{
            display: "block",
            margin: "20px auto",
            padding: "10px 20px",
            background: "#7B61FF",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 40,
          color: "rgba(240,240,248,0.38)",
        }}
      >
        {ALGO_UI_EMPTY.title}
      </div>
    );
  }

  return (
    <div>
      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Stars
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "rgba(240,240,248,0.48)",
            marginTop: 8,
          }}
        >
          Célébrités tendance
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 16,
        }}
      >
        {data.map((star) => (
          <article
            key={star.id}
            className="algo-card"
            style={{
              borderRadius: 12,
              overflow: "hidden",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              textAlign: "center",
            }}
          >
            <div style={{ position: "relative", width: "100%", height: 180 }}>
              <ImageWithFallback
                src={
                  star.profile_path
                    ? `https://image.tmdb.org/t/p/w185${star.profile_path}`
                    : null
                }
                alt={star.name}
                fill
                className="object-cover"
                fallbackType="avatar"
                userName={star.name}
                sizes="140px"
              />
            </div>
            <div style={{ padding: 12 }}>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#f0f0f8",
                  margin: 0,
                  lineHeight: 1.3,
                  marginBottom: 4,
                }}
              >
                {star.name}
              </h3>
              <p
                style={{
                  fontSize: 10,
                  color: "rgba(240,240,248,0.38)",
                  margin: 0,
                }}
              >
                {star.known_for_department}
              </p>
              {star.known_for?.[0] && (
                <p
                  style={{
                    fontSize: 10,
                    color: "#7B61FF",
                    margin: "4px 0 0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {star.known_for[0].title || star.known_for[0].name}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { ImageWithFallback } from "./ImageWithFallback";
import { Badge } from "./Badge";

// =============================================================================
// SimilarContent · Grid/scroll of similar films, series, or videos
// =============================================================================

interface SimilarItem {
  id: string;
  title: string;
  poster?: string | null;
  thumbnail?: string;
  score?: number;
  badge?: string;
  year?: string;
  channelName?: string;
}

interface SimilarContentProps {
  items: SimilarItem[];
  title?: string;
  type?: "film" | "video";
}

export function SimilarContent({
  items,
  title,
  type = "film",
}: SimilarContentProps) {
  if (!items || items.length === 0) return null;

  const sectionTitle =
    title ||
    (type === "film" ? "Contenus similaires en tendance" : "Videos similaires");

  return (
    <section className="mt-6">
      <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span>{type === "film" ? "🎬" : "▶️"}</span>
        {sectionTitle}
      </h3>
      <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/content/${item.id}`}
            className="flex-shrink-0 w-[130px] rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.04] hover:border-violet-400/30 hover:bg-white/[0.06] transition-all group"
          >
            <div
              className={`${type === "film" ? "aspect-[2/3]" : "aspect-video"} overflow-hidden bg-white/[0.06] relative`}
            >
              {item.poster || item.thumbnail ? (
                <ImageWithFallback
                  src={item.poster || item.thumbnail || ""}
                  alt={item.title}
                  width={130}
                  height={type === "film" ? 195 : 73}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl text-white/20">
                  {type === "film" ? "🎬" : "▶️"}
                </div>
              )}
              {item.badge && (
                <div className="absolute top-1.5 left-1.5">
                  <Badge
                    type={item.badge as "Viral" | "Trend" | "Early"}
                    label={item.badge}
                    size="sm"
                  />
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="text-[10px] font-bold text-white/75 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                {item.title}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-[9px] text-white/35">
                {item.year && <span>{item.year}</span>}
                {item.score && (
                  <>
                    {item.year && <span>·</span>}
                    <span className="text-violet-400/70">{item.score}</span>
                  </>
                )}
                {item.channelName && (
                  <span className="line-clamp-1">{item.channelName}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

import Link from "next/link";
import { ImageWithFallback } from "./ImageWithFallback";

// =============================================================================
// CastSection · Horizontal scrolling cast members with clickable profiles
// =============================================================================

interface CastMember {
  id: number;
  name: string;
  character: string;
  photo: string | null;
}

interface CastSectionProps {
  cast: CastMember[];
  title?: string;
}

export function CastSection({
  cast,
  title = "Casting principal",
}: CastSectionProps) {
  if (!cast || cast.length === 0) return null;

  return (
    <section className="mt-6">
      <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span>🎭</span>
        {title}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {cast.map((actor) => (
          <Link
            key={actor.id}
            href={`/star/star-${actor.id}`}
            className="flex-shrink-0 text-center w-[72px] group"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden bg-white/[0.06] mx-auto mb-1.5 border-2 border-white/10 group-hover:border-violet-400/50 transition-all group-hover:scale-105">
              {actor.photo ? (
                <ImageWithFallback
                  src={actor.photo}
                  alt={actor.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl text-white/30">
                  👤
                </div>
              )}
            </div>
            <p className="text-[10px] font-bold text-white/75 leading-tight group-hover:text-violet-300 transition-colors line-clamp-1">
              {actor.name}
            </p>
            <p className="text-[9px] text-white/35 leading-tight mt-0.5 line-clamp-1">
              {actor.character}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

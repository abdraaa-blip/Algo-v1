"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";

// =============================================================================
// TrailerModal · Click-to-play trailer overlay for films/series
// =============================================================================

interface TrailerModalProps {
  trailerKey: string;
  title?: string;
}

export function TrailerModal({ trailerKey, title }: TrailerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-6 py-3 rounded-full bg-black/75 backdrop-blur-md border-2 border-white/30 text-white font-bold text-sm hover:bg-black/90 hover:border-white/50 hover:scale-105 transition-all z-10"
        aria-label={`Voir la bande-annonce de ${title || "ce contenu"}`}
      >
        <Play size={18} fill="white" />
        Voir la bande-annonce
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 md:p-8"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/60 text-sm font-medium">
                {title ? `Bande-annonce: ${title}` : "Bande-annonce"}
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-semibold transition-colors"
              >
                <X size={16} />
                Fermer
              </button>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={title ? `Bande-annonce de ${title}` : "Bande-annonce"}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

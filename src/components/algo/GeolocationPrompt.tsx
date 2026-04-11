"use client";

// =============================================================================
// ALGO V1 · GeolocationPrompt
// Shows a friendly location permission request on first visit.
// Rules:
//   - Only shows once per device (stored in localStorage)
//   - If accepted, auto-detects country and sets scope
//   - If refused, sets Global scope with friendly message
//   - Handles all edge cases gracefully (timeout, error, etc.)
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { MapPin, Globe, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useScope } from "@/hooks/useScope";
import { useTranslation } from "@/hooks/useTranslation";

const STORAGE_KEY = "algo_geoloc_asked";

export function GeolocationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [showRefusedMessage, setShowRefusedMessage] = useState(false);
  const { status, requestLocation, suggestedScope } = useGeolocation();
  const { setScope, isLoaded: scopeLoaded } = useScope();
  const { t, locale, isLoaded: i18nLoaded } = useTranslation();

  // Check if we should show the prompt
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Wait for hooks to load
    if (!scopeLoaded || !i18nLoaded) return;

    // Check if already asked
    const alreadyAsked = localStorage.getItem(STORAGE_KEY);
    if (alreadyAsked) return;

    // Show prompt after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [scopeLoaded, i18nLoaded]);

  // Handle geolocation result - only run when status changes to a final state
  useEffect(() => {
    // Only process final states, not intermediate ones
    if (status === "idle" || status === "requesting") return;

    // Already processed this state
    const alreadyAsked = localStorage.getItem(STORAGE_KEY);
    if (alreadyAsked) return;

    if (status === "granted" && suggestedScope) {
      // Successfully detected country - set scope
      setScope(suggestedScope);
      setIsVisible(false);
      localStorage.setItem(STORAGE_KEY, "granted");
    } else if (status === "denied") {
      // User refused - set global scope
      setScope({ type: "global" });
      setIsVisible(false);
      localStorage.setItem(STORAGE_KEY, "denied");
      // Show friendly message
      setShowRefusedMessage(true);
      setTimeout(() => setShowRefusedMessage(false), 5000);
    } else if (status === "error") {
      // Error occurred - silently fall back to global
      setScope({ type: "global" });
      setIsVisible(false);
      localStorage.setItem(STORAGE_KEY, "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, suggestedScope]);

  const handleAccept = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  const handleRefuse = useCallback(() => {
    setScope({ type: "global" });
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "refused");
    setShowRefusedMessage(true);
    setTimeout(() => setShowRefusedMessage(false), 5000);
  }, [setScope]);

  const handleClose = useCallback(() => {
    // Treat close as refuse
    handleRefuse();
  }, [handleRefuse]);

  if (!i18nLoaded) return null;

  return (
    <>
      {/* Main Prompt Modal */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-3xl p-6 shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-white/5 transition-colors"
                aria-label={t("misc.close")}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/30 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-[var(--color-violet)]" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] text-center mb-3">
                {t("onboarding.step2.title")}
              </h2>

              {/* Subtitle */}
              <p className="text-[var(--color-text-secondary)] text-center mb-8">
                {t("onboarding.step2.subtitle")}
              </p>

              {/* Buttons */}
              <div className="space-y-3">
                {/* Accept button */}
                <button
                  onClick={handleAccept}
                  disabled={status === "requesting"}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 bg-gradient-to-r from-[var(--color-violet)] to-purple-600 shadow-[0_0_30px_rgba(123,97,255,0.3)]"
                >
                  {status === "requesting" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t("state.loading")}</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5" />
                      <span>{t("onboarding.step2.geolocCta")}</span>
                    </>
                  )}
                </button>

                {/* Global button */}
                <button
                  onClick={handleRefuse}
                  disabled={status === "requesting"}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-[var(--color-text-secondary)] bg-white/5 border border-[var(--color-border)] hover:bg-white/10 hover:text-[var(--color-text-primary)] transition-all disabled:opacity-50"
                >
                  <Globe className="w-5 h-5" />
                  <span>{t("onboarding.step2.global")}</span>
                </button>
              </div>

              {/* Privacy note */}
              <p className="text-xs text-[var(--color-text-muted)] text-center mt-6">
                {locale === "en"
                  ? "Your location is only used to show relevant content. We never store or share it."
                  : "Ta localisation sert uniquement à afficher du contenu pertinent. Nous ne la stockons ni ne la partageons."}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refused Message Toast */}
      <AnimatePresence>
        {showRefusedMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 z-[100] flex justify-center"
          >
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-xl">
              <Globe className="w-5 h-5 text-[var(--color-violet)]" />
              <span className="text-sm text-[var(--color-text-secondary)]">
                {t("state.geolocRefused")}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

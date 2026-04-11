"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  MapPin,
  Sparkles,
  Clapperboard,
  Eye,
  ChevronRight,
  Loader2,
  LocateFixed,
} from "lucide-react";

import { availableCountries, getCountryName } from "@/data/countries";
import { useScope } from "@/hooks/useScope";
import { useGeolocation } from "@/hooks/useGeolocation";
import { cn } from "@/lib/utils";
import type { Category, UserProfileType, Locale } from "@/types";

const ONBOARDING_KEY = "algo_onboarding_done";
const CATEGORIES: Category[] = [
  "Drôle",
  "Insolite",
  "Buzz",
  "Émotion",
  "Drama",
  "Lifestyle",
  "Culture",
  "Actu",
  "Autre",
];

const LANGS: { code: Locale; label: string; flag: string }[] = [
  { code: "fr", label: "Francais", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Espanol", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setScope } = useScope();

  const [step, setStep] = useState(1);
  const [lang, setLang] = useState<Locale>("fr");
  const [country, setCountry] = useState<string | null>(null);
  const [interests, setInterests] = useState<Category[]>([]);
  const [profile, setProfile] = useState<UserProfileType | null>(null);

  const TOTAL = 4;

  function toggleInterest(cat: Category) {
    setInterests((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  function finish() {
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
      localStorage.setItem("algo_lang", lang);
      if (profile) localStorage.setItem("algo_profile", profile);
      if (country) {
        const c = availableCountries.find((c) => c.code === country);
        if (c)
          setScope({
            type: "country",
            code: c.code,
            name: getCountryName(c, lang),
          });
      }
    } catch {
      /* ignore */
    }
    router.push("/");
  }

  const canContinue =
    (step === 1 && lang !== null) ||
    step === 2 ||
    (step === 3 && interests.length > 0) ||
    (step === 4 && profile !== null);

  return (
    <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-0.5 rounded-full transition-all duration-[350ms]",
                i < step ? "bg-violet-500" : "bg-white/10",
              )}
            />
          ))}
        </div>

        {step === 1 && (
          <StepWrapper
            icon={Globe}
            title="Choisis ta langue"
            subtitle="Tu pourras la changer plus tard"
          >
            <div className="space-y-2">
              {LANGS.map((l) => (
                <ChoiceButton
                  key={l.code}
                  selected={lang === l.code}
                  onClick={() => setLang(l.code)}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </ChoiceButton>
              ))}
            </div>
          </StepWrapper>
        )}

        {step === 2 && (
          <CountryStep
            lang={lang}
            country={country}
            setCountry={setCountry}
            title="Ou es-tu ?"
            subtitle="Pour te montrer les tendances locales"
          />
        )}

        {step === 3 && (
          <StepWrapper
            icon={Sparkles}
            title="Qu'est-ce qui t'interesse ?"
            subtitle="Selectionne au moins une categorie"
          >
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = interests.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleInterest(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-xs font-semibold transition-all",
                      isSelected
                        ? "border-[rgba(123,97,255,0.40)] bg-[rgba(123,97,255,0.15)] text-violet-300"
                        : "border-white/10 bg-white/5 text-white/50 hover:bg-white/9",
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </StepWrapper>
        )}

        {step === 4 && (
          <StepWrapper
            icon={Eye}
            title="Comment tu utilises ALGO ?"
            subtitle=""
          >
            <div className="space-y-3">
              <ProfileCard
                selected={profile === "creator"}
                onClick={() => setProfile("creator")}
                icon={<Clapperboard size={22} strokeWidth={1.5} />}
                label="Createur"
                sublabel="Je veux creer du contenu viral"
              />
              <ProfileCard
                selected={profile === "spectator"}
                onClick={() => setProfile("spectator")}
                icon={<Eye size={22} strokeWidth={1.5} />}
                label="Spectateur"
                sublabel="Je veux juste suivre les tendances"
              />
            </div>
          </StepWrapper>
        )}

        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/55 text-sm font-bold hover:bg-white/9 transition-all"
            >
              Retour
            </button>
          )}

          <button
            onClick={() => (step < TOTAL ? setStep((s) => s + 1) : finish())}
            disabled={!canContinue}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
              canContinue
                ? "bg-violet-500 text-white hover:bg-violet-400 shadow-[0_0_20px_rgba(123,97,255,0.28)]"
                : "bg-violet-500/30 text-white/35 cursor-not-allowed",
            )}
          >
            {step < TOTAL ? "Suivant" : "Commencer"}
            <ChevronRight size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

function StepWrapper({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Globe;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/22 flex items-center justify-center mb-4">
          <Icon size={18} strokeWidth={1.6} className="text-violet-400" />
        </div>
        <h1 className="text-white font-black text-xl tracking-tight mb-1">
          {title}
        </h1>
        {subtitle && <p className="text-white/38 text-sm">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold text-start transition-all",
        selected
          ? "border-[rgba(123,97,255,0.38)] bg-[rgba(123,97,255,0.12)] text-white"
          : "border-white/8 bg-white/[0.025] text-white/55 hover:bg-white/[0.05]",
      )}
    >
      {children}
    </button>
  );
}

function ProfileCard({
  selected,
  onClick,
  icon,
  label,
  sublabel,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-4 p-4 rounded-2xl border text-start transition-all",
        selected
          ? "border-[rgba(123,97,255,0.38)] bg-[rgba(123,97,255,0.10)] text-white"
          : "border-white/8 bg-white/[0.025] text-white/55 hover:bg-white/[0.05]",
      )}
    >
      <span
        className={cn(
          "shrink-0 mt-0.5",
          selected ? "text-violet-400" : "text-white/28",
        )}
      >
        {icon}
      </span>
      <div>
        <p className="font-bold text-sm">{label}</p>
        <p className="text-xs text-white/32 mt-0.5">{sublabel}</p>
      </div>
    </button>
  );
}

function CountryStep({
  lang,
  country,
  setCountry,
  title,
  subtitle,
}: {
  lang: Locale;
  country: string | null;
  setCountry: (code: string | null) => void;
  title: string;
  subtitle: string;
}) {
  const { status, result, requestLocation } = useGeolocation();

  useEffect(() => {
    if (result.countryCode && country === null) {
      const found = availableCountries.find(
        (c) => c.code === result.countryCode,
      );
      if (found) setCountry(found.code);
    }
  }, [result.countryCode, country, setCountry]);

  const isDetecting = status === "requesting";

  return (
    <div className="space-y-5">
      <div>
        <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/22 flex items-center justify-center mb-4">
          <MapPin size={18} strokeWidth={1.6} className="text-violet-400" />
        </div>
        <h1 className="text-white font-black text-xl tracking-tight mb-1">
          {title}
        </h1>
        {subtitle && <p className="text-white/38 text-sm">{subtitle}</p>}
      </div>

      <button
        type="button"
        onClick={requestLocation}
        disabled={isDetecting}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all",
          "border-[rgba(0,209,255,0.25)] bg-[rgba(0,209,255,0.08)] text-[#00D1FF]",
          "hover:bg-[rgba(0,209,255,0.12)] disabled:opacity-50",
        )}
      >
        {isDetecting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <LocateFixed size={16} />
        )}
        <span>{isDetecting ? "Detection..." : "Detecter automatiquement"}</span>
      </button>

      <div className="space-y-1.5 max-h-52 overflow-y-auto pe-1">
        <ChoiceButton
          selected={country === null}
          onClick={() => setCountry(null)}
        >
          <Globe size={15} />
          <span>Global</span>
        </ChoiceButton>

        {availableCountries.map((c) => (
          <ChoiceButton
            key={c.code}
            selected={country === c.code}
            onClick={() => setCountry(c.code)}
          >
            <span>{c.flag}</span>
            <span>{getCountryName(c, lang)}</span>
            {result.countryCode === c.code && (
              <span className="ms-auto text-[10px] text-[#00D1FF] font-medium">
                Detecte
              </span>
            )}
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}

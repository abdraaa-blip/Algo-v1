"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  DEFAULT_PLANET_PREFS,
  loadPlanetPrefs,
  PLANET_PREFS_EVENT,
} from "@/lib/ui/planet-prefs";

type PlanetVariant =
  | "home"
  | "videos"
  | "news"
  | "intelligence"
  | "interactive"
  | "default";

interface DataParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

interface ActivitySignals {
  score: number;
  activeSources: number;
  alerts: number;
}

function getVariant(pathname: string): PlanetVariant {
  if (pathname === "/") return "home";
  if (pathname.includes("/videos") || pathname.includes("/video"))
    return "videos";
  if (pathname.includes("/news")) return "news";
  if (pathname.includes("/intelligence") || pathname.includes("/monitor"))
    return "intelligence";
  if (
    pathname.includes("/viral-analyzer") ||
    pathname.includes("/trends") ||
    pathname.includes("/creator-mode")
  ) {
    return "interactive";
  }
  return "default";
}

function getVariantTuning(variant: PlanetVariant) {
  switch (variant) {
    case "home":
      return {
        baseOpacity: 0.16,
        planetScale: 0.16,
        tint: "rgba(130,170,255,",
        baseDensity: 80,
      };
    case "videos":
      return {
        baseOpacity: 0.12,
        planetScale: 0.14,
        tint: "rgba(110,150,255,",
        baseDensity: 65,
      };
    case "news":
      return {
        baseOpacity: 0.18,
        planetScale: 0.155,
        tint: "rgba(130,200,255,",
        baseDensity: 90,
      };
    case "intelligence":
      return {
        baseOpacity: 0.2,
        planetScale: 0.17,
        tint: "rgba(140,220,255,",
        baseDensity: 105,
      };
    case "interactive":
      return {
        baseOpacity: 0.19,
        planetScale: 0.16,
        tint: "rgba(160,180,255,",
        baseDensity: 98,
      };
    default:
      return {
        baseOpacity: 0.13,
        planetScale: 0.145,
        tint: "rgba(130,170,255,",
        baseDensity: 70,
      };
  }
}

function getDeviceClass() {
  if (typeof window === "undefined") return { enabled: false, reduced: true };
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const lowCore = (navigator.hardwareConcurrency || 8) <= 4;
  const lowMem =
    "deviceMemory" in navigator &&
    ((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8) <=
      4;
  const reduced = media.matches || (lowCore && lowMem);
  return { enabled: !reduced, reduced };
}

function createParticle(
  w: number,
  h: number,
  cx: number,
  cy: number,
): DataParticle {
  const edge = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;
  if (edge === 0) {
    x = Math.random() * w;
    y = -12;
  } else if (edge === 1) {
    x = w + 12;
    y = Math.random() * h;
  } else if (edge === 2) {
    x = Math.random() * w;
    y = h + 12;
  } else {
    x = -12;
    y = Math.random() * h;
  }
  const dx = cx - x;
  const dy = cy - y;
  const dist = Math.max(1, Math.hypot(dx, dy));
  const speed = 0.25 + Math.random() * 0.55;
  return {
    x,
    y,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    size: 0.8 + Math.random() * 2.4,
    alpha: 0.25 + Math.random() * 0.45,
  };
}

export function AlgoDataPlanet() {
  const pathname = usePathname();
  const variant = useMemo(() => getVariant(pathname), [pathname]);
  const tuning = useMemo(() => getVariantTuning(variant), [variant]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<DataParticle[]>([]);
  const starsRef = useRef<ShootingStar[]>([]);
  const pointerRef = useRef({ x: 0.5, y: 0.5, active: false });
  const scrollSpeedRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const activityRef = useRef(0.35);
  const signalRef = useRef<ActivitySignals>({
    score: 60,
    activeSources: 4,
    alerts: 0,
  });

  const [enabled, setEnabled] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const prefsRef = useRef(DEFAULT_PLANET_PREFS);
  const [layerOpacity, setLayerOpacity] = useState(0.9);
  const [fallbackOpacity, setFallbackOpacity] = useState(0.38);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncPrefs = () => {
      const p = loadPlanetPrefs();
      prefsRef.current = p;
      setLayerOpacity(0.9 * p.opacity);
      setFallbackOpacity(0.38 * p.opacity);
    };
    syncPrefs();
    window.addEventListener(PLANET_PREFS_EVENT, syncPrefs);
    return () => window.removeEventListener(PLANET_PREFS_EVENT, syncPrefs);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const localPref = window.localStorage.getItem("algo_planet_enabled");
    const explicitOff = localPref === "0";
    const envDisabled = process.env.NEXT_PUBLIC_ALGO_PLANET_ENABLED === "0";
    const device = getDeviceClass();
    const shouldEnable = !explicitOff && !envDisabled && device.enabled;
    setEnabled(shouldEnable);
    setShowFallback(!shouldEnable);

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => {
      const cls = getDeviceClass();
      const ok = !explicitOff && !envDisabled && cls.enabled;
      setEnabled(ok);
      setShowFallback(!ok);
    };
    media.addEventListener("change", onMotion);
    const onToggle = () => {
      const pref = window.localStorage.getItem("algo_planet_enabled");
      const off = pref === "0";
      const cls = getDeviceClass();
      const ok = !off && !envDisabled && cls.enabled;
      setEnabled(ok);
      setShowFallback(!ok);
    };
    window.addEventListener("algo:planet-toggle", onToggle);
    return () => {
      media.removeEventListener("change", onMotion);
      window.removeEventListener("algo:planet-toggle", onToggle);
    };
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let cancelled = false;
    const isDataDrivenPage =
      pathname.includes("/intelligence") ||
      pathname.includes("/monitor") ||
      pathname.includes("/viral-analyzer");

    const pullSignals = async () => {
      if (!isDataDrivenPage) {
        signalRef.current = {
          score: 58 + Math.random() * 12,
          activeSources: 4,
          alerts: 0,
        };
        return;
      }
      try {
        const [predRes, opsRes] = await Promise.all([
          fetch("/api/intelligence/predictive?region=FR&locale=fr", {
            cache: "no-store",
          }),
          fetch("/api/intelligence/ops-alerts", { cache: "no-store" }),
        ]);
        const predJson = (await predRes.json()) as {
          success: boolean;
          data?: { predictedViralityScore: number };
        };
        const opsJson = (await opsRes.json()) as {
          success: boolean;
          alerts?: Array<{ id: string }>;
          resilience?: { totalCircuits: number };
        };
        if (cancelled) return;
        const score =
          predJson.success && predJson.data
            ? predJson.data.predictedViralityScore
            : 60;
        const activeSources = opsJson.success
          ? Math.max(3, Number(opsJson.resilience?.totalCircuits || 4))
          : 4;
        const alerts =
          opsJson.success && Array.isArray(opsJson.alerts)
            ? opsJson.alerts.length
            : 0;
        signalRef.current = { score, activeSources, alerts };
      } catch {
        signalRef.current = { score: 62, activeSources: 4, alerts: 0 };
      }
    };

    void pullSignals();
    const interval = window.setInterval(() => void pullSignals(), 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabled, pathname]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      setShowFallback(true);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cx = w * 0.78;
      const cy = h * 0.34;
      const targetCount = Math.max(
        38,
        Math.min(
          140,
          Math.round(tuning.baseDensity * prefsRef.current.intensity),
        ),
      );
      particlesRef.current = Array.from({ length: targetCount }, () =>
        createParticle(w, h, cx, cy),
      );
      starsRef.current = [];
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      pointerRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
        active: true,
      };
    };
    const onLeave = () => {
      pointerRef.current.active = false;
    };
    const onScroll = () => {
      const y = window.scrollY;
      const delta = Math.abs(y - lastScrollYRef.current);
      lastScrollYRef.current = y;
      scrollSpeedRef.current = Math.min(1, delta / 70);
    };
    const onClick = () => {
      activityRef.current = Math.min(1, activityRef.current + 0.08);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("click", onClick, { passive: true });

    let last = 0;
    const draw = (time: number) => {
      if (time - last < 16) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      last = time;

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const pointer = pointerRef.current;
      const cx = w * 0.78 + (pointer.active ? (pointer.x - 0.5) * 26 : 0);
      const cy = h * 0.34 + (pointer.active ? (pointer.y - 0.5) * 16 : 0);
      const intMul = prefsRef.current.intensity;
      const radius =
        Math.min(w, h) * tuning.planetScale * prefsRef.current.size;

      // Data-linked activity target.
      const scoreFactor = Math.min(
        1,
        Math.max(0, signalRef.current.score / 100),
      );
      const sourceFactor = Math.min(1, signalRef.current.activeSources / 10);
      const alertPenalty = Math.min(0.4, signalRef.current.alerts * 0.06);
      const interactionBoost =
        scrollSpeedRef.current * 0.35 + (pointer.active ? 0.08 : 0);
      const targetActivity = Math.max(
        0.2,
        Math.min(
          1,
          scoreFactor * 0.5 +
            sourceFactor * 0.35 +
            interactionBoost -
            alertPenalty,
        ),
      );
      activityRef.current += (targetActivity - activityRef.current) * 0.03;
      scrollSpeedRef.current *= 0.9;

      ctx.clearRect(0, 0, w, h);

      // Planet halo.
      const halo = ctx.createRadialGradient(
        cx,
        cy,
        radius * 0.5,
        cx,
        cy,
        radius * 2.4,
      );
      halo.addColorStop(
        0,
        `${tuning.tint}${0.22 * tuning.baseOpacity + activityRef.current * 0.08})`,
      );
      halo.addColorStop(1, `${tuning.tint}0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(
        cx - radius * 2.6,
        cy - radius * 2.6,
        radius * 5.2,
        radius * 5.2,
      );

      // Transparent sphere.
      const planet = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.45,
        radius * 0.1,
        cx,
        cy,
        radius,
      );
      planet.addColorStop(
        0,
        `${tuning.tint}${0.16 + activityRef.current * 0.06})`,
      );
      planet.addColorStop(
        0.6,
        `${tuning.tint}${0.05 + activityRef.current * 0.04})`,
      );
      planet.addColorStop(1, "rgba(140,180,255,0.02)");
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = planet;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(185,220,255,${0.18 + activityRef.current * 0.12})`;
      ctx.stroke();

      // Subtle rotating latitudinal reflections.
      const rot = time * (0.00015 + activityRef.current * 0.00018);
      for (let i = -2; i <= 2; i++) {
        const yOff = i * radius * 0.22;
        const wobble = Math.sin(rot * 5 + i) * radius * 0.03;
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy + yOff + wobble,
          radius * (0.62 - Math.abs(i) * 0.09),
          radius * 0.1,
          rot,
          0,
          Math.PI * 2,
        );
        ctx.strokeStyle = `rgba(210,235,255,${0.08 + activityRef.current * 0.05})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Converging data particles.
      const particles = particlesRef.current;
      const desiredCount = Math.max(
        35,
        Math.min(
          160,
          Math.round(
            tuning.baseDensity * (0.7 + activityRef.current * 0.85) * intMul,
          ),
        ),
      );
      while (particles.length < desiredCount)
        particles.push(createParticle(w, h, cx, cy));
      while (particles.length > desiredCount) particles.pop();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = cx - p.x;
        const dy = cy - p.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const grav = (0.003 + activityRef.current * 0.0035) * intMul;
        p.vx += (dx / dist) * grav;
        p.vy += (dy / dist) * grav;
        p.vx *= 0.992;
        p.vy *= 0.992;
        p.x += p.vx;
        p.y += p.vy;

        // Respawn when entering core.
        if (
          dist < radius * 0.72 ||
          p.x < -16 ||
          p.x > w + 16 ||
          p.y < -16 ||
          p.y > h + 16
        ) {
          particles[i] = createParticle(w, h, cx, cy);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${tuning.tint}${p.alpha * (0.72 + activityRef.current * 0.45)})`;
        ctx.fill();
      }

      // Shooting stars / micro bursts.
      if (Math.random() < (0.012 + activityRef.current * 0.02) * intMul) {
        starsRef.current.push({
          x: Math.random() * w * 0.65,
          y: Math.random() * h,
          vx: 2.8 + Math.random() * 2.8,
          vy: -0.7 + Math.random() * 1.4,
          life: 50,
          maxLife: 50,
        });
      }
      starsRef.current = starsRef.current.filter((s) => s.life > 0);
      for (const s of starsRef.current) {
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 1;
        const a = (s.life / s.maxLife) * (0.2 + activityRef.current * 0.35);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 3.2, s.y - s.vy * 3.2);
        ctx.strokeStyle = `rgba(220,245,255,${a})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("click", onClick);
    };
  }, [enabled, pathname, tuning]);

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 max-w-full overflow-hidden pointer-events-none"
    >
      {enabled ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ opacity: layerOpacity }}
        />
      ) : showFallback ? (
        <div className="absolute inset-0">
          <div
            className="absolute rounded-full"
            style={{
              width: "26vw",
              height: "26vw",
              minWidth: "170px",
              minHeight: "170px",
              top: "11%",
              right: "7%",
              background:
                "radial-gradient(circle at 35% 30%, rgba(165,205,255,0.14) 0%, rgba(130,175,255,0.05) 45%, rgba(130,175,255,0.01) 100%)",
              border: "1px solid rgba(200,225,255,0.2)",
              filter: "blur(0.3px)",
              opacity: fallbackOpacity,
            }}
          />
          <div
            className="absolute"
            style={{
              inset: 0,
              background:
                "radial-gradient(40% 30% at 76% 28%, rgba(140,210,255,0.07), rgba(140,210,255,0) 70%)",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

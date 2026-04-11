"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  ImageOff,
  Play,
  Video,
  Music,
  Newspaper,
  Film,
  type LucideIcon,
} from "lucide-react";

// Platform colors for gradient fallbacks
const PLATFORM_COLORS: Record<
  string,
  { from: string; to: string; icon: LucideIcon }
> = {
  youtube: { from: "#FF0000", to: "#CC0000", icon: Play },
  tiktok: { from: "#00F2EA", to: "#FF0050", icon: Music },
  reddit: { from: "#FF4500", to: "#FF5700", icon: Newspaper },
  twitter: { from: "#1DA1F2", to: "#0D8BD9", icon: Newspaper },
  x: { from: "#000000", to: "#14171A", icon: Newspaper },
  instagram: { from: "#833AB4", to: "#FD1D1D", icon: Video },
  twitch: { from: "#9146FF", to: "#6441A5", icon: Video },
  news: { from: "#3B82F6", to: "#1D4ED8", icon: Newspaper },
  video: { from: "#7C3AED", to: "#5B21B6", icon: Play },
  movie: { from: "#F59E0B", to: "#D97706", icon: Film },
  default: { from: "#6366F1", to: "#4F46E5", icon: ImageOff },
};

// Generate blur placeholder data URL
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#1a1a2e" offset="20%" />
      <stop stop-color="#2a2a4e" offset="50%" />
      <stop stop-color="#1a1a2e" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#1a1a2e" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

export const blurDataURL = (w = 400, h = 300) =>
  `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;

export interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  // Fallback configuration
  fallbackType?: "avatar" | "thumbnail" | "cover" | "platform" | "news";
  platform?: string;
  userName?: string;
  showPlayButton?: boolean;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "3/4" | "9/16";
  // Callbacks
  onLoad?: () => void;
  onError?: () => void;
}

export function ImageWithFallback({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  containerClassName,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  quality = 75,
  fallbackType = "thumbnail",
  platform = "default",
  userName,
  showPlayButton = false,
  aspectRatio,
  onLoad,
  onError,
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const platformConfig =
    PLATFORM_COLORS[platform.toLowerCase()] || PLATFORM_COLORS.default;
  const PlatformIcon = platformConfig.icon;

  // Get initials for avatar fallback
  const initials = userName
    ? userName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  // Render fallback based on type
  const renderFallback = () => {
    if (fallbackType === "avatar") {
      return (
        <div
          className={cn(
            "flex items-center justify-center rounded-full",
            "bg-gradient-to-br from-violet-500/30 to-cyan-500/30",
            containerClassName,
          )}
          style={{ width: width || 40, height: height || 40 }}
        >
          <span
            className="font-bold text-white/80"
            style={{ fontSize: (width || 40) * 0.4 }}
          >
            {initials}
          </span>
        </div>
      );
    }

    // Platform gradient fallback for thumbnails
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2",
          aspectRatio && `aspect-[${aspectRatio}]`,
          containerClassName,
        )}
        style={{
          background: `linear-gradient(135deg, ${platformConfig.from}20, ${platformConfig.to}40)`,
          width: fill ? "100%" : width,
          height: fill ? "100%" : height,
        }}
      >
        <div
          className="rounded-full p-3"
          style={{ backgroundColor: `${platformConfig.from}30` }}
        >
          <PlatformIcon
            size={fill ? 32 : Math.min(width || 24, 32)}
            className="text-white/60"
          />
        </div>
        {platform !== "default" && (
          <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
            {platform}
          </span>
        )}
      </div>
    );
  };

  // If no source or error, show fallback
  if (!src || hasError) {
    return (
      <div className={cn("relative overflow-hidden", containerClassName)}>
        {renderFallback()}
        {showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <Play size={24} className="text-white ml-1" fill="white" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Determine if URL is external and needs unoptimized flag
  const isDataUrl = src.startsWith("data:");
  const knownDomains = [
    "youtube",
    "unsplash",
    "wikimedia",
    "ui-avatars",
    "lastfm",
    "themoviedb",
    "tmdb",
  ];
  const isExternalUnknown =
    src.startsWith("http") && !knownDomains.some((d) => src.includes(d));

  if (fill) {
    return (
      <div
        className={cn(
          "relative overflow-hidden w-full h-full",
          containerClassName,
        )}
      >
        {/* Loading skeleton */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-[var(--color-card)] animate-pulse" />
        )}

        <Image
          src={src}
          alt={alt}
          fill
          className={cn(
            "object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className,
          )}
          sizes={sizes}
          quality={quality}
          priority={priority}
          onError={handleError}
          onLoad={handleLoad}
          placeholder="blur"
          blurDataURL={blurDataURL()}
          unoptimized={isDataUrl || isExternalUnknown}
        />

        {/* Play button overlay for videos */}
        {showPlayButton && isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm transition-transform group-hover:scale-110">
              <Play size={24} className="text-white ml-1" fill="white" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Loading skeleton */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-[var(--color-card)] animate-pulse rounded-inherit"
          style={{ width, height }}
        />
      )}

      <Image
        src={src}
        alt={alt}
        width={width || 400}
        height={height || 300}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className,
        )}
        style={{ width: width || "auto", height: height || "auto" }}
        quality={quality}
        priority={priority}
        onError={handleError}
        onLoad={handleLoad}
        placeholder="blur"
        blurDataURL={blurDataURL(width || 400, height || 300)}
        unoptimized={isDataUrl || isExternalUnknown}
      />

      {/* Play button overlay */}
      {showPlayButton && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <Play size={24} className="text-white ml-1" fill="white" />
          </div>
        </div>
      )}
    </div>
  );
}

// Avatar component with initials fallback
export function AvatarWithFallback({
  src,
  name,
  size = 40,
  className,
}: {
  src: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <ImageWithFallback
      src={src}
      alt={name}
      width={size}
      height={size}
      fallbackType="avatar"
      userName={name}
      className={cn("rounded-full object-cover", className)}
      containerClassName={cn("rounded-full", className)}
    />
  );
}

// Video thumbnail with play button
export function VideoThumbnail({
  src,
  alt,
  platform = "video",
  aspectRatio = "16/9",
  className,
  priority = false,
}: {
  src: string | null | undefined;
  alt: string;
  platform?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1";
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        `aspect-[${aspectRatio}]`,
        className,
      )}
    >
      <ImageWithFallback
        src={src}
        alt={alt}
        fill
        fallbackType="platform"
        platform={platform}
        showPlayButton
        aspectRatio={aspectRatio}
        priority={priority}
        className="rounded-xl"
        containerClassName="rounded-xl"
      />
    </div>
  );
}

export default ImageWithFallback;

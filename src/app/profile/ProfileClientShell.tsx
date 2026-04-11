"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Bookmark,
  Radar,
  Settings,
  LogIn,
  UserPlus,
  LogOut,
  Loader2,
  Info,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ProfileLabels {
  title: string;
  guest: string;
  guestSub: string;
  login: string;
  signup: string;
  logout: string;
  favorites: string;
  watchlist: string;
  settings: string;
  tagline: string;
  member: string;
}

export function ProfileClientShell({ labels }: { labels: ProfileLabels }) {
  const router = useRouter();
  const { user, isAuthenticated, loading, signOut } = useAuth();

  const links = [
    { href: "/favorites", icon: Bookmark, label: labels.favorites },
    { href: "/watchlist", icon: Radar, label: labels.watchlist },
    { href: "/settings", icon: Settings, label: labels.settings },
    { href: "/about", icon: Info, label: "About ALGO" },
  ] as const;

  async function handleLogout() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="max-w-sm mx-auto px-4 py-10 flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-10 space-y-8">
      {/* Avatar / identite */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="size-20 rounded-full flex items-center justify-center"
          style={{
            background: isAuthenticated
              ? "rgba(0,209,255,0.15)"
              : "rgba(123,97,255,0.15)",
            border: isAuthenticated
              ? "2px solid rgba(0,209,255,0.28)"
              : "2px solid rgba(123,97,255,0.28)",
          }}
        >
          {isAuthenticated ? (
            <span className="text-2xl font-bold text-[#00D1FF]">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </span>
          ) : (
            <User
              size={32}
              strokeWidth={1.4}
              className="text-violet-400"
              aria-hidden
            />
          )}
        </div>
        <div>
          {isAuthenticated ? (
            <>
              <p className="text-white font-bold text-lg">
                {typeof user?.user_metadata?.display_name === "string" &&
                user.user_metadata.display_name.trim()
                  ? user.user_metadata.display_name
                  : user?.email?.split("@")[0] || "Utilisateur"}
              </p>
              <p className="text-white/32 text-xs mt-0.5">{user?.email}</p>
              <p className="text-[#00D1FF]/60 text-[10px] mt-1 font-semibold uppercase tracking-wider">
                {labels.member}
              </p>
            </>
          ) : (
            <>
              <p className="text-white font-bold text-lg">{labels.guest}</p>
              <p className="text-white/32 text-xs mt-0.5">{labels.guestSub}</p>
            </>
          )}
        </div>
      </div>

      {/* CTAs auth */}
      {isAuthenticated ? (
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/62 text-sm font-bold hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
        >
          <LogOut size={14} strokeWidth={2} aria-hidden />
          {labels.logout}
        </button>
      ) : (
        <div className="flex gap-3">
          <Link
            href="/login"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-400 transition-colors duration-150 shadow-[0_0_20px_rgba(123,97,255,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <LogIn size={14} strokeWidth={2} aria-hidden />
            {labels.login}
          </Link>
          <Link
            href="/signup"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/62 text-sm font-bold hover:bg-white/9 hover:text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
          >
            <UserPlus size={14} strokeWidth={2} aria-hidden />
            {labels.signup}
          </Link>
        </div>
      )}

      {/* Liens */}
      <nav aria-label="Menu profil">
        <ul className="space-y-2">
          {links.map(({ href, icon: Icon, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/6 bg-white/[0.025] text-white/58 hover:bg-white/[0.05] hover:text-white/85 hover:border-white/10 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
              >
                <Icon
                  size={16}
                  strokeWidth={1.6}
                  className="text-white/30 shrink-0"
                  aria-hidden
                />
                <span className="text-sm font-semibold">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Lien onboarding */}
      <p className="text-center">
        <Link
          href="/onboarding"
          className="text-xs text-white/22 hover:text-white/45 transition-colors focus-visible:outline-none focus-visible:underline"
        >
          Revoir l&apos;onboarding
        </Link>
      </p>

      <p className="text-center text-[10px] text-white/15">
        ALGO V1 · {labels.tagline}
      </p>
    </div>
  );
}

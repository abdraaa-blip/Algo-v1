"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  X,
  Zap,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [settings, setSettings] = useState({
    tierS: true,
    tierA: false,
    postNow: true,
    watchlist: true,
  });

  useEffect(() => {
    // Check notification permission on mount
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Check if already subscribed
    const stored = localStorage.getItem("algo_notifications");
    if (stored) {
      const data = JSON.parse(stored) as {
        subscribed?: boolean;
        settings?: typeof settings;
      };
      if (typeof data.subscribed === "boolean")
        setIsSubscribed(data.subscribed);
      setSettings((prev) => ({ ...prev, ...(data.settings ?? {}) }));
    }
  }, []);

  async function requestPermission() {
    if (!("Notification" in window)) {
      alert("Votre navigateur ne supporte pas les notifications");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      setIsSubscribed(true);
      saveSettings(true);

      // Test notification
      new Notification("Algo Notifications activées!", {
        body: "Vous recevrez des alertes pour les trends explosifs",
        icon: "/icons/icon-192.png",
      });
    }
  }

  function saveSettings(subscribed = isSubscribed) {
    localStorage.setItem(
      "algo_notifications",
      JSON.stringify({
        subscribed,
        settings,
      }),
    );
  }

  function toggleSubscription() {
    if (permission !== "granted") {
      requestPermission();
      return;
    }

    const newState = !isSubscribed;
    setIsSubscribed(newState);
    saveSettings(newState);
  }

  function toggleSetting(key: keyof typeof settings) {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem(
      "algo_notifications",
      JSON.stringify({
        subscribed: isSubscribed,
        settings: newSettings,
      }),
    );
  }

  // Determine icon state
  const Icon =
    permission === "denied" ? BellOff : isSubscribed ? BellRing : Bell;

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={cn(
          "relative p-2 rounded-xl transition-all",
          isSubscribed
            ? "bg-violet-500/20 text-violet-400"
            : "bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card-hover)]",
        )}
        aria-label="Notifications"
      >
        <Icon size={18} />

        {/* Active indicator */}
        {isSubscribed && (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-violet-400 animate-pulse" />
        )}
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-72 z-50 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-[var(--color-text-primary)] text-sm">
                  Notifications Push
                </h3>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-1 rounded-lg hover:bg-[var(--color-card-hover)] text-[var(--color-text-tertiary)]"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Recevez des alertes quand des trends explosent
              </p>
            </div>

            {/* Status */}
            <div className="p-4 border-b border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {permission === "denied" ? (
                    <>
                      <div className="p-1.5 rounded-lg bg-red-500/20">
                        <BellOff size={14} className="text-red-400" />
                      </div>
                      <span className="text-xs text-red-400">Bloqué</span>
                    </>
                  ) : isSubscribed ? (
                    <>
                      <div className="p-1.5 rounded-lg bg-green-500/20">
                        <Check size={14} className="text-green-400" />
                      </div>
                      <span className="text-xs text-green-400">Activées</span>
                    </>
                  ) : (
                    <>
                      <div className="p-1.5 rounded-lg bg-[var(--color-card-hover)]">
                        <Bell
                          size={14}
                          className="text-[var(--color-text-secondary)]"
                        />
                      </div>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        Désactivées
                      </span>
                    </>
                  )}
                </div>

                {permission !== "denied" && (
                  <button
                    onClick={toggleSubscription}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      isSubscribed
                        ? "bg-[var(--color-card-hover)] text-[var(--color-text-primary)] hover:bg-[var(--color-card)]"
                        : "bg-violet-500 text-white hover:bg-violet-600",
                    )}
                  >
                    {isSubscribed ? "Désactiver" : "Activer"}
                  </button>
                )}
              </div>

              {permission === "denied" && (
                <p className="text-[10px] text-[var(--color-text-muted)] mt-2">
                  Modifiez les permissions dans les paramètres du navigateur
                </p>
              )}
            </div>

            {/* Settings */}
            {isSubscribed && (
              <div className="p-4 space-y-3">
                <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-medium">
                  Alerter pour
                </p>

                <NotifOption
                  icon={Zap}
                  label="Trends Tier S"
                  description="Signaux explosifs"
                  enabled={settings.tierS}
                  onToggle={() => toggleSetting("tierS")}
                  color="yellow"
                />

                <NotifOption
                  icon={TrendingUp}
                  label="Trends Tier A"
                  description="Forts potentiels"
                  enabled={settings.tierA}
                  onToggle={() => toggleSetting("tierA")}
                  color="violet"
                />

                <NotifOption
                  icon={BellRing}
                  label="Post Now"
                  description="Opportunités immédiates"
                  enabled={settings.postNow}
                  onToggle={() => toggleSetting("postNow")}
                  color="orange"
                />

                <NotifOption
                  icon={Bell}
                  label="Ma Watchlist"
                  description="Changements sur mes trends"
                  enabled={settings.watchlist}
                  onToggle={() => toggleSetting("watchlist")}
                  color="cyan"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface NotifOptionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  color: "yellow" | "violet" | "orange" | "cyan";
}

function NotifOption({
  icon: Icon,
  label,
  description,
  enabled,
  onToggle,
  color,
}: NotifOptionProps) {
  const colorClasses = {
    yellow: "bg-yellow-500/20 text-yellow-400",
    violet: "bg-violet-500/20 text-violet-400",
    orange: "bg-orange-500/20 text-orange-400",
    cyan: "bg-[#00D1FF]/20 text-[#00D1FF]",
  };

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--color-card)] transition-all"
    >
      <div className={cn("p-1.5 rounded-lg", colorClasses[color])}>
        <Icon size={12} />
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs font-medium text-[var(--color-text-secondary)]">
          {label}
        </p>
        <p className="text-[10px] text-[var(--color-text-tertiary)]">
          {description}
        </p>
      </div>
      <div
        className={cn(
          "size-4 rounded-full border-2 transition-all",
          enabled
            ? "border-violet-400 bg-violet-400"
            : "border-[var(--color-border-strong)]",
        )}
      >
        {enabled && <Check size={8} className="text-white m-auto mt-0.5" />}
      </div>
    </button>
  );
}

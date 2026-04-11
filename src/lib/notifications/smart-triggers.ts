/**
 * ALGO Smart Notification Triggers
 *
 * Intelligent notification system that sends the right message at the right time:
 * - Viral content alerts
 * - Streak reminders
 * - Personalized recommendations
 * - Time-sensitive opportunities
 */

export interface NotificationTrigger {
  id: string;
  type:
    | "viral"
    | "streak"
    | "recommendation"
    | "breaking"
    | "comeback"
    | "achievement";
  title: string;
  body: string;
  data?: Record<string, unknown>;
  scheduledFor?: Date;
  priority: "high" | "normal" | "low";
  actionUrl?: string;
}

export interface UserNotificationPrefs {
  viralAlerts: boolean;
  streakReminders: boolean;
  recommendations: boolean;
  breakingNews: boolean;
  quietHoursStart: number; // 0-23
  quietHoursEnd: number;
  maxPerDay: number;
}

const DEFAULT_PREFS: UserNotificationPrefs = {
  viralAlerts: true,
  streakReminders: true,
  recommendations: true,
  breakingNews: true,
  quietHoursStart: 22,
  quietHoursEnd: 8,
  maxPerDay: 5,
};

const PREFS_KEY = "algo_notification_prefs";
const SENT_TODAY_KEY = "algo_notifications_sent_today";

/**
 * Get user notification preferences
 */
export function getNotificationPrefs(): UserNotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

/**
 * Save user notification preferences
 */
export function saveNotificationPrefs(
  prefs: Partial<UserNotificationPrefs>,
): void {
  if (typeof window === "undefined") return;
  const current = getNotificationPrefs();
  localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...prefs }));
}

/**
 * Check if we're in quiet hours
 */
export function isQuietHours(): boolean {
  const prefs = getNotificationPrefs();
  const hour = new Date().getHours();

  if (prefs.quietHoursStart > prefs.quietHoursEnd) {
    // Quiet hours span midnight (e.g., 22:00 - 08:00)
    return hour >= prefs.quietHoursStart || hour < prefs.quietHoursEnd;
  }
  return hour >= prefs.quietHoursStart && hour < prefs.quietHoursEnd;
}

/**
 * Get count of notifications sent today
 */
function getSentToday(): number {
  if (typeof window === "undefined") return 0;
  try {
    const data = localStorage.getItem(SENT_TODAY_KEY);
    if (!data) return 0;
    const { date, count } = JSON.parse(data);
    if (date !== new Date().toISOString().split("T")[0]) return 0;
    return count;
  } catch {
    return 0;
  }
}

/**
 * Increment sent notification count
 */
function incrementSentToday(): void {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().split("T")[0];
  const current = getSentToday();
  localStorage.setItem(
    SENT_TODAY_KEY,
    JSON.stringify({ date: today, count: current + 1 }),
  );
}

/**
 * Check if we can send a notification
 */
export function canSendNotification(
  type: NotificationTrigger["type"],
): boolean {
  const prefs = getNotificationPrefs();

  // Check quiet hours
  if (isQuietHours()) return false;

  // Check daily limit
  if (getSentToday() >= prefs.maxPerDay) return false;

  // Check type preference
  switch (type) {
    case "viral":
    case "breaking":
      return prefs.viralAlerts;
    case "streak":
    case "comeback":
      return prefs.streakReminders;
    case "recommendation":
      return prefs.recommendations;
    case "achievement":
      return true; // Always allow achievements
    default:
      return true;
  }
}

/**
 * Create viral content notification
 */
export function createViralNotification(content: {
  title: string;
  score: number;
  category: string;
  url: string;
}): NotificationTrigger {
  return {
    id: `viral_${Date.now()}`,
    type: "viral",
    title: "Signal fort détecté",
    body: `${content.title} - Score ${content.score}/100`,
    data: { category: content.category, score: content.score },
    priority: content.score >= 90 ? "high" : "normal",
    actionUrl: content.url,
  };
}

/**
 * Create streak reminder notification
 */
export function createStreakReminder(
  currentStreak: number,
): NotificationTrigger {
  const messages = [
    {
      title: "Ta série est en danger !",
      body: `${currentStreak} jours de suite — ne casse pas ta série !`,
    },
    {
      title: "Reviens maintenir ta série",
      body: `${currentStreak} jours consécutifs, continue !`,
    },
    {
      title: "Série en cours",
      body: `Jour ${currentStreak} — garde le rythme !`,
    },
  ];
  const msg = messages[Math.floor(Math.random() * messages.length)];

  return {
    id: `streak_${Date.now()}`,
    type: "streak",
    title: msg.title,
    body: msg.body,
    priority: currentStreak >= 7 ? "high" : "normal",
    actionUrl: "/",
  };
}

/**
 * Create comeback notification for lapsed users
 */
export function createComebackNotification(
  daysMissed: number,
): NotificationTrigger {
  let message: { title: string; body: string };

  if (daysMissed <= 3) {
    message = {
      title: "Tu nous manques!",
      body: "De nouvelles tendances virales t'attendent",
    };
  } else if (daysMissed <= 7) {
    message = {
      title: "Bonus de retour disponible!",
      body: "Reviens et recupere ton bonus XP",
    };
  } else {
    message = {
      title: "ALGO a change!",
      body: "Nouvelles fonctionnalités et gros bonus de retour",
    };
  }

  return {
    id: `comeback_${Date.now()}`,
    type: "comeback",
    title: message.title,
    body: message.body,
    priority: "normal",
    actionUrl: "/",
  };
}

/**
 * Create achievement notification
 */
export function createAchievementNotification(achievement: {
  name: string;
  xpReward: number;
}): NotificationTrigger {
  return {
    id: `achievement_${Date.now()}`,
    type: "achievement",
    title: "Succes debloque!",
    body: `${achievement.name} - +${achievement.xpReward} XP`,
    priority: "high",
    actionUrl: "/profile",
  };
}

/**
 * Create breaking news notification
 */
export function createBreakingNotification(news: {
  title: string;
  source: string;
  url: string;
}): NotificationTrigger {
  return {
    id: `breaking_${Date.now()}`,
    type: "breaking",
    title: "BREAKING",
    body: news.title,
    data: { source: news.source },
    priority: "high",
    actionUrl: news.url,
  };
}

/**
 * Send a notification (via Service Worker)
 */
export async function sendNotification(
  trigger: NotificationTrigger,
): Promise<boolean> {
  if (!canSendNotification(trigger.type)) return false;

  if (typeof window === "undefined" || !("Notification" in window))
    return false;

  if (Notification.permission !== "granted") return false;

  try {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(trigger.title, {
      body: trigger.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      tag: trigger.id,
      data: {
        url: trigger.actionUrl || "/",
        ...trigger.data,
      },
      requireInteraction: trigger.priority === "high",
      silent: trigger.priority === "low",
    });

    incrementSentToday();
    return true;
  } catch (error) {
    console.warn("[ALGO] Failed to send notification:", error);
    return false;
  }
}

/**
 * Schedule streak reminder for evening
 */
export function scheduleStreakReminder(currentStreak: number): void {
  if (typeof window === "undefined") return;

  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(20, 0, 0, 0); // 8 PM

  // If it's past 8 PM, don't schedule
  if (now > reminderTime) return;

  const delay = reminderTime.getTime() - now.getTime();

  setTimeout(() => {
    const notification = createStreakReminder(currentStreak);
    sendNotification(notification);
  }, delay);
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Copy, Check, Share2, Trophy } from "lucide-react";
import {
  getLocalStreak,
  generateReferralCode,
} from "@/lib/gamification/streak-system";

interface ReferralReward {
  count: number;
  reward: string;
  xp: number;
  unlocked: boolean;
}

const REFERRAL_REWARDS: ReferralReward[] = [
  { count: 1, reward: "Badge Ambassadeur", xp: 200, unlocked: false },
  { count: 3, reward: "Acces AI Insights", xp: 500, unlocked: false },
  { count: 5, reward: "Badge Influenceur", xp: 750, unlocked: false },
  { count: 10, reward: "Statut VIP", xp: 1500, unlocked: false },
  { count: 25, reward: "Badge Viral Master", xp: 5000, unlocked: false },
];

export function ReferralCard() {
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const streak = getLocalStreak();
    if (streak) {
      setReferralCode(streak.referralCode);
      setReferralCount(streak.referralCount);
    } else {
      // Generate a code for new users
      const code = generateReferralCode(`anon_${Date.now()}`);
      setReferralCode(code);
    }
  }, []);

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}?ref=${referralCode}`
      : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = referralLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async (
    platform: "twitter" | "whatsapp" | "telegram" | "native",
  ) => {
    const message = `Découvre ALGO — l'algorithme qui repère ce qui peut partir en viral tôt. Utilise mon code : ${referralCode}`;

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralLink)}`,
          "_blank",
        );
        break;
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(message + " " + referralLink)}`,
          "_blank",
        );
        break;
      case "telegram":
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`,
          "_blank",
        );
        break;
      case "native":
        if (navigator.share) {
          await navigator.share({
            title: "ALGO — repère les signaux",
            text: message,
            url: referralLink,
          });
        }
        break;
    }
  };

  const rewards = REFERRAL_REWARDS.map((r) => ({
    ...r,
    unlocked: referralCount >= r.count,
  }));

  const nextReward = rewards.find((r) => !r.unlocked);
  const progress = nextReward ? (referralCount / nextReward.count) * 100 : 100;

  return (
    <div className="space-y-4">
      {/* Main Referral Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(123,97,255,0.15) 0%, rgba(0,255,178,0.1) 100%)",
          border: "1px solid rgba(123,97,255,0.3)",
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-bold text-white">Invite tes amis</h3>
            </div>
            <p className="text-sm text-white/50">
              Gagne des XP et des recompenses exclusives
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-white">
              {referralCount}
            </span>
            <p className="text-xs text-white/40">parrainages</p>
          </div>
        </div>

        {/* Referral Code */}
        <div className="mb-4">
          <p className="text-xs text-white/40 mb-1.5">Ton code parrain</p>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 px-4 py-3 rounded-xl font-mono text-lg font-bold text-center"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span className="text-violet-400">{referralCode}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              className="p-3 rounded-xl transition-colors"
              style={{
                background: copied
                  ? "rgba(0,255,178,0.2)"
                  : "rgba(123,97,255,0.2)",
                border: `1px solid ${copied ? "rgba(0,255,178,0.3)" : "rgba(123,97,255,0.3)"}`,
              }}
            >
              {copied ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <Copy className="w-5 h-5 text-violet-400" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex items-center gap-2 mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleShare("native")}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #7B61FF 0%, #9F7AEA 100%)",
            }}
          >
            <Share2 className="w-4 h-4" />
            Partager
          </motion.button>

          <button
            onClick={() => handleShare("whatsapp")}
            className="p-3 rounded-xl transition-colors hover:bg-white/5"
            style={{
              background: "rgba(37,211,102,0.1)",
              border: "1px solid rgba(37,211,102,0.2)",
            }}
          >
            <svg
              className="w-5 h-5 text-[#25D366]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </button>

          <button
            onClick={() => handleShare("twitter")}
            className="p-3 rounded-xl transition-colors hover:bg-white/5"
            style={{
              background: "rgba(29,161,242,0.1)",
              border: "1px solid rgba(29,161,242,0.2)",
            }}
          >
            <svg
              className="w-5 h-5 text-[#1DA1F2]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>

          <button
            onClick={() => handleShare("telegram")}
            className="p-3 rounded-xl transition-colors hover:bg-white/5"
            style={{
              background: "rgba(0,136,204,0.1)",
              border: "1px solid rgba(0,136,204,0.2)",
            }}
          >
            <svg
              className="w-5 h-5 text-[#0088CC]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </button>
        </div>

        {/* Progress to next reward */}
        {nextReward && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-white/40">
                Prochain palier: {nextReward.count} parrainages
              </span>
              <span className="text-xs text-violet-400 font-bold">
                {nextReward.reward}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #7B61FF, #00FFB2)",
                }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Rewards Ladder */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <h4 className="text-sm font-bold text-white">
            Paliers de recompenses
          </h4>
        </div>

        <div className="space-y-2">
          {rewards.map((reward, index) => (
            <motion.div
              key={reward.count}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                reward.unlocked
                  ? "bg-violet-500/10 border border-violet-500/20"
                  : "bg-white/5 border border-transparent"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  reward.unlocked
                    ? "bg-violet-500 text-white"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {reward.count}
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${reward.unlocked ? "text-white" : "text-white/50"}`}
                >
                  {reward.reward}
                </p>
                <p className="text-xs text-white/30">+{reward.xp} XP</p>
              </div>
              {reward.unlocked && (
                <Check className="w-5 h-5 text-emerald-400" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useInView } from 'framer-motion'
import { 
  Sparkles, Users, Newspaper, Briefcase, Film, Music, Radio,
  ArrowRight, ChevronDown, Eye, Lightbulb, TrendingUp,
  Zap, Clock, Mic, Coffee
} from 'lucide-react'
import { LiveCurve } from '@/components/ui/LiveCurve'
import { SITE_TRANSPARENCY_AI_CALIBRATION_HREF } from '@/lib/seo/site'

function AnimatedSection({ 
  children, 
  className,
  delay = 0 
}: { 
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const USE_CASES = [
  { icon: Sparkles, audience: "Le créateur de contenu", benefit: "qui veut poster avant le pic de la tendance, pas après" },
  { icon: Users, audience: "L'influenceur", benefit: "qui veut savoir ce que son audience voudra demain, pas hier" },
  { icon: Eye, audience: "L'esprit curieux", benefit: "qui veut découvrir les meilleurs films, séries, musiques et vidéos maintenant, sans passer des heures à chercher" },
  { icon: Newspaper, audience: "Le journaliste", benefit: "qui repère une histoire avant qu'elle ne devienne une histoire" },
  { icon: Briefcase, audience: "L'agence", benefit: "qui apporte à ses clients non pas des opinions mais des signaux" },
  { icon: Mic, audience: "Le community manager", benefit: "qui veut repérer tôt ce qui compte pour son calendrier éditorial" },
  { icon: Lightbulb, audience: "L'entrepreneur", benefit: "qui repère les shifts culturels avant qu'ils ne deviennent des shifts de marché" },
  { icon: Film, audience: "Le cinéphile", benefit: "qui veut savoir quel film tout le monde va regarder la semaine prochaine" },
  { icon: Music, audience: "L'amateur de musique", benefit: "qui découvre le prochain hit avant qu'il n'explose" },
  { icon: Coffee, audience: "La personne qui veut simplement savoir", benefit: "ce qui se passe maintenant, pourquoi ça compte, et ce qui vient ensuite" },
]

const ALGO_TELLS_YOU = [
  { icon: TrendingUp, text: "Ce qui monte en visibilité maintenant et pourquoi (signaux agrégés, pas une vérité absolue)" },
  { icon: Clock, text: "Des sujets qui accélèrent · indicateurs sur les prochains jours, pas une prédiction garantie" },
  { icon: Film, text: "Quels films et séries créent du buzz dans les classements et flux que nous suivons" },
  { icon: Eye, text: "Quelles séries suscitent de l’engagement pour t’aider à choisir quoi regarder" },
  { icon: Music, text: "Quels sons et artistes ressortent dans les tendances musicales suivies" },
  { icon: Zap, text: "Quels formats et angles méritent un test, selon les signaux du moment (à valider par toi)" },
  { icon: Newspaper, text: "Quels sujets d’actu gagnent en volume · pour suivre l’information tôt, sans certitude médiatique" },
]

export default function AboutPage() {
  const { scrollYProgress } = useScroll()

  return (
    <div className="relative min-h-screen overflow-hidden text-[var(--color-text-primary)]">
      <LiveCurve growthRate={15} className="fixed inset-0 opacity-40" />
      
      {/* Progress bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-pink-500 to-violet-500 origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />
      
      <div className="relative z-10">
        {/* HERO - L'algorithme des algorithmes */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-500/10 border border-violet-500/30 mb-12"
            >
              <Radio className="w-4 h-4 text-violet-400 animate-pulse" />
              <span className="text-violet-400 text-sm font-medium tracking-wide">Le radar viral des tendances</span>
            </motion.div>
            
            {/* ALGO - L'algorithme des algorithmes - BIGGEST FONT */}
            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="mb-8"
            >
              <span 
                className="block text-[12vw] md:text-[10vw] lg:text-[140px] font-black tracking-tighter leading-none"
                style={{ 
                  background: 'linear-gradient(135deg, #fff 0%, #a78bfa 50%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 80px rgba(123, 97, 255, 0.5)'
                }}
              >
                ALGO
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="text-2xl md:text-4xl lg:text-5xl font-bold text-white/90 tracking-tight"
            >
              L&apos;algorithme des algorithmes.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="absolute bottom-16 left-1/2 -translate-x-1/2"
            >
              <motion.div 
                animate={{ y: [0, 12, 0] }} 
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown className="w-10 h-10 text-white/30" />
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* INTRO - Who is ALGO for */}
        <section className="px-6 py-32 max-w-4xl mx-auto">
          <AnimatedSection>
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-relaxed text-center">
              ALGO est pour tous ceux qui veulent etre <span className="text-violet-400">en avance</span>. 
              Pas juste en avance sur l&apos;actu. En avance sur la <span className="text-pink-400">conversation</span>. 
              En avance sur la <span className="text-cyan-400">culture</span>.
            </p>
          </AnimatedSection>
        </section>

        {/* ALGO EST FAIT POUR TOI SI... */}
        <section className="px-6 py-24 bg-gradient-to-b from-transparent via-violet-950/20 to-transparent">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection>
              <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-4">
                ALGO est fait pour toi si...
              </h2>
              <div className="w-32 h-1 mx-auto bg-gradient-to-r from-violet-500 to-pink-500 rounded-full mb-16" />
            </AnimatedSection>
            
            <div className="space-y-4">
              {USE_CASES.map((useCase, i) => (
                <AnimatedSection key={i} delay={i * 0.05}>
                  <div className="group flex items-start gap-5 p-6 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-violet-500/30 hover:bg-[var(--color-card-hover)] transition-all duration-500">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <useCase.icon className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                      <span className="text-lg font-bold text-white">{useCase.audience}</span>
                      <span className="text-lg text-white/50"> {useCase.benefit}</span>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ALGO NE SUIT PAS INTERNET */}
        <section className="px-6 py-32 max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <p className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-8">
              ALGO ne suit pas internet.
            </p>
            <p className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight text-[var(--color-violet)]">
              ALGO le lit.
            </p>
          </AnimatedSection>
        </section>

        {/* TAGLINE REPEAT */}
        <section className="px-6 py-20 bg-gradient-to-r from-violet-950/30 via-violet-900/20 to-violet-950/30">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-4xl md:text-6xl font-black text-white tracking-tight">
                ALGO, l&apos;algorithme des algorithmes.
              </p>
            </div>
          </AnimatedSection>
        </section>

        {/* NOT A... */}
        <section className="px-6 py-32 max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <p className="text-xl md:text-2xl text-white/50 mb-8">
              Pas un reseau social. Pas un site d&apos;actu. Pas un moteur de recommandation.
            </p>
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-relaxed">
              Un <span className="text-violet-400">radar</span>. 
              Un <span className="text-pink-400">decodeur</span>. 
              Une <span className="text-cyan-400">avance sur le monde</span>.
            </p>
          </AnimatedSection>
        </section>

        {/* THE NOISE */}
        <section className="px-6 py-24 max-w-4xl mx-auto">
          <AnimatedSection>
            <p className="text-xl md:text-2xl text-white/60 text-center leading-relaxed">
              Internet n&apos;a jamais ete aussi rapide. Le bruit n&apos;a jamais ete aussi fort. 
              <span className="text-white font-bold"> ALGO structure ces signaux pour t&apos;aider à décider plus tôt</span>
              , avec des indicateurs clairs · pas une boule de cristal.
            </p>
          </AnimatedSection>
        </section>

        {/* TODAY ALGO TELLS YOU */}
        <section className="px-6 py-24 bg-gradient-to-b from-transparent via-pink-950/10 to-transparent">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection>
              <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-4">
                Ce qu&apos;ALGO peut t&apos;aider à voir
              </h2>
              <p className="text-center text-sm text-white/45 max-w-xl mx-auto mb-4">
                Tout est basé sur des sources publiques et des modèles internes : des estimations utiles, pas des
                promesses de résultat.
              </p>
              <div className="w-24 h-1 mx-auto bg-gradient-to-r from-pink-500 to-violet-500 rounded-full mb-12" />
            </AnimatedSection>
            
            <div className="grid md:grid-cols-2 gap-4">
              {ALGO_TELLS_YOU.map((item, i) => (
                <AnimatedSection key={i} delay={i * 0.1}>
                  <div className="flex items-center gap-4 p-5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-pink-400" />
                    </div>
                    <p className="text-white/80 text-sm md:text-base">{item.text}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* THE PROMISE */}
        <section className="px-6 py-32 max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <p className="text-lg md:text-xl text-violet-400 font-medium uppercase tracking-wider mb-6">
              L&apos;engagement
            </p>
            <p className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
              Ouvre ALGO quand tu veux te synchroniser avec les signaux.
            </p>
            <p className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight mt-4" style={{ color: '#00FFB2' }}>
              Décide avec une lecture plus nette · pas au hasard.
            </p>
          </AnimatedSection>
        </section>

        {/* FINAL TAGLINE */}
        <section className="px-6 py-24">
          <AnimatedSection>
            <div className="max-w-5xl mx-auto text-center">
              <p 
                className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter"
                style={{ 
                  background: 'linear-gradient(135deg, #fff 0%, #a78bfa 50%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ALGO
              </p>
              <p className="text-2xl md:text-3xl font-bold text-white/80 mt-4">
                L&apos;algorithme des algorithmes.
              </p>
            </div>
          </AnimatedSection>
        </section>

        {/* ALGO AI · même ligne directrice */}
        <section className="px-6 py-16 max-w-xl mx-auto text-center">
          <AnimatedSection>
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">ALGO AI</p>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              Même promesse que l&apos;appli : peu de bruit, des réponses utiles. L&apos;IA du produit est calibrée pour
              rester rationnelle, sans mysticisme · avec une carte de rôles publique sur la page transparence.
            </p>
            <Link
              href={SITE_TRANSPARENCY_AI_CALIBRATION_HREF}
              className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-cyan-400 hover:text-cyan-300"
            >
              Calibrage &amp; familles de rôle
              <ArrowRight className="w-4 h-4" />
            </Link>
          </AnimatedSection>
        </section>

        {/* CTA */}
        <section className="px-6 py-24 text-center">
          <AnimatedSection>
            <Link
              href="/"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-full text-lg font-bold text-white transition-all hover:scale-105 bg-gradient-to-br from-[var(--color-violet)] to-purple-600 shadow-[0_0_60px_color-mix(in_srgb,var(--color-violet)_45%,transparent)]"
            >
              Commence a lire le signal
              <ArrowRight className="w-6 h-6" />
            </Link>
          </AnimatedSection>
        </section>

        {/* Footer spacing */}
        <div className="h-20" />
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import {
  Database,
  Clock,
  Zap,
  Shield,
  Brain,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Scale,
  Layers,
} from 'lucide-react'
import { ALGO_DIRECTIVE_FAMILY_HINTS_FR } from '@/lib/ai/algo-directive-synthesis'
import { ALGO_DATA_RELIABILITY_PANEL } from '@/lib/copy/ui-strings'

export const metadata: Metadata = buildPageMetadata({
  title: 'Transparence des données',
  description:
    'Comment ALGO collecte, traite et affiche les données de tendances — sources, rythmes de rafraîchissement et limites.',
  path: '/transparency',
  keywords: ['transparence', 'données', 'vie privée', 'sources', 'ALGO'],
})

// Data sources configuration (matching actual refresh intervals)
const DATA_SOURCES = [
  {
    name: 'Google Trends',
    description: 'Tendances de recherche Google',
    refreshInterval: '15 minutes',
    method: 'API via RSS',
    regions: ['FR', 'US', 'UK', 'DE', 'NG'],
    status: 'active',
  },
  {
    name: 'YouTube Trending',
    description: 'Videos tendances par region',
    refreshInterval: '30 minutes',
    method: 'YouTube Data API v3',
    regions: ['FR', 'US', 'UK', 'NG'],
    status: 'active',
  },
  {
    name: 'Google News',
    description: 'Actualites par categorie et region',
    refreshInterval: '15 minutes',
    method: 'RSS Feed',
    regions: ['FR', 'US', 'UK'],
    status: 'active',
  },
  {
    name: 'Last.fm',
    description: 'Classements musicaux',
    refreshInterval: '15 minutes',
    method: 'Last.fm API',
    regions: ['Global'],
    status: 'active',
  },
  {
    name: 'TMDB',
    description: 'Films et series populaires',
    refreshInterval: '1 heure',
    method: 'TMDB API v3',
    regions: ['Global'],
    status: 'active',
  },
]

const SCORE_DEFINITIONS = [
  {
    name: 'Score viral (cartes & listes)',
    detail:
      'Indice 0–100 combinant croissance apparente, engagement estimé et nouveauté relative par rapport aux flux agrégés. Ce n’est ni une audience réelle ni une promesse de partages.',
  },
  {
    name: 'Analyseur viral (page dédiée + scan rapide)',
    detail:
      'Score multi-critères (accroche, alignement tendance, format, timing…) produit par un pipeline dédié — peut inclure des modèles si configurés. Toujours interpréter comme aide à la décision.',
  },
  {
    name: 'Scores « Intelligence » / radar',
    detail:
      'Métriques dérivées des agrégats internes (catégories, anomalies, confiance). Mode conseil par défaut ; toute automatisation reste bornée par les politiques du déploiement.',
  },
  {
    name: 'ALGO AI',
    detail:
      'Réponses langagières basées sur signaux et règles ; les chiffres sont des indicateurs, pas des certitudes. Le prompt système intègre une directive interne sobre : clarté, pas de mysticisme, pas de promesses irréalistes sur les plateformes, rigueur et friction lue comme signal d’analyse.',
  },
]

const INTELLIGENCE_MODULES = [
  {
    name: 'Viral Score',
    description:
      'Estime un score 0–100 à partir de croissance, engagement et nouveauté perçue — indicateur interne, pas une prévision d’audience réelle.',
    icon: Zap,
  },
  {
    name: 'Emotion Engine',
    description: 'Detecte l\'emotion dominante du contenu (curiosite, colere, humour, inspiration, peur).',
    icon: Brain,
  },
  {
    name: 'Action Generator',
    description: 'Suggere des actions concretes pour capitaliser sur les tendances.',
    icon: CheckCircle,
  },
  {
    name: 'Coherence Guard',
    description: 'Valide les donnees et empeche l\'affichage de contenus invalides.',
    icon: Shield,
  },
]

export default function TransparencyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Transparence des Donnees</h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            ALGO s&apos;engage a etre transparent sur la maniere dont les donnees sont collectees, 
            traitees et affichees. Cette page explique notre methodologie.
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-bold text-amber-400 mb-2">Note importante</h2>
              <p className="text-white/70 text-sm leading-relaxed">
                Les donnees affichees dans ALGO ne sont <strong>pas en temps reel</strong>. 
                Elles sont mises a jour periodiquement selon les intervalles indiques ci-dessous. 
                Les indicateurs &quot;ACTIF&quot; signifient que les donnees ont ete rafraichies recemment, 
                pas qu&apos;elles sont diffusees en direct.
              </p>
            </div>
          </div>
        </div>

        <p className="text-white/45 text-xs text-center mb-10 max-w-2xl mx-auto leading-relaxed">
          Carte consolidée des routes, fallbacks et ordres de grandeur (JSON) :{' '}
          <Link
            href={ALGO_DATA_RELIABILITY_PANEL.apiPath}
            className="text-cyan-400 hover:underline font-mono text-[11px]"
          >
            {ALGO_DATA_RELIABILITY_PANEL.apiPath}
          </Link>
          . Aperçu sur{' '}
          <Link href="/intelligence" className="text-cyan-400 hover:underline">
            Intelligence
          </Link>
          .
        </p>

        {/* Score definitions — alignement produit */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold">Ce que signifient les scores</h2>
          </div>
          <p className="text-white/55 text-sm mb-4 leading-relaxed">
            Plusieurs écrans affichent un chiffre sur 100. Ils ne partagent pas forcément la même formule — voici la
            distinction utile pour éviter toute confusion. Détail formule « radar » public :{' '}
            <Link href="/algorithm" className="text-cyan-400 hover:underline">
              page Algorithme
            </Link>
            .
          </p>
          <div className="space-y-3">
            {SCORE_DEFINITIONS.map((row) => (
              <div key={row.name} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
                <h3 className="font-semibold text-white text-sm mb-1">{row.name}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{row.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Calibrage ALGO AI — familles de rôle (lisible utilisateur) */}
        <section id="algo-ai-directive" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <Layers className="w-6 h-6 text-violet-400" />
            <h2 className="text-xl font-bold">Calibrage ALGO AI</h2>
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed max-w-3xl">
            Le modèle reçoit une directive interne sobre (clarté, pas de mysticisme, indicateurs sans promesse magique).
            Les huit familles ci-dessous ne sont pas des « codes secrets » : c’est une carte des rôles que le prompt
            vise à équilibrer — stratégie, sûreté, analyse, création, signaux sociaux, cohérence, production,
            persistance — pour rester aligné avec le reste du produit ALGO.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ALGO_DIRECTIVE_FAMILY_HINTS_FR.map((row) => (
              <div
                key={row.code}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 flex gap-3"
              >
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-violet-400/90 tabular-nums">
                  {row.code}
                </span>
                <p className="text-sm text-[var(--color-text-secondary)] leading-snug">{row.role}</p>
              </div>
            ))}
          </div>
          <p className="text-[var(--color-text-muted)] text-xs mt-4 leading-relaxed">
            Détail côté technique : voir le code source{' '}
            <code className="text-[var(--color-text-tertiary)]">src/lib/ai/algo-directive-synthesis.ts</code> et{' '}
            <code className="text-[var(--color-text-tertiary)]">algo-persona.ts</code>.
          </p>
        </section>

        {/* Data Sources */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-6 h-6 text-violet-400" />
            <h2 className="text-xl font-bold">Sources de Donnees</h2>
          </div>
          
          <div className="space-y-4">
            {DATA_SOURCES.map((source) => (
              <div 
                key={source.name}
                className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-bold text-white">{source.name}</h3>
                    <p className="text-sm text-white/50">{source.description}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase">
                    {source.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-white/40 text-xs">Rafraichissement</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <RefreshCw size={12} className="text-amber-400" />
                      <span className="text-amber-400 font-medium">{source.refreshInterval}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-white/40 text-xs">Methode</span>
                    <p className="text-white/70 mt-1">{source.method}</p>
                  </div>
                  <div>
                    <span className="text-white/40 text-xs">Regions</span>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {source.regions.map(r => (
                        <span key={r} className="px-1.5 py-0.5 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded text-[10px] text-[var(--color-text-secondary)]">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Intelligence Modules */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold">Modules d&apos;Intelligence</h2>
          </div>
          
          <p className="text-white/60 mb-6 text-sm">
            Les agrégats de tendances s&apos;appuient surtout sur des règles, caches et scores dérivés des APIs.
            Certaines fonctions — analyseur viral, ALGO AI — peuvent appeler des modèles lorsque les clés sont
            configurées. Voici les blocs fonctionnels décrits côté produit :
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INTELLIGENCE_MODULES.map((module) => (
              <div 
                key={module.name}
                className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <module.icon className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white">{module.name}</h3>
                </div>
                <p className="text-sm text-white/50">{module.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Data Freshness Explanation */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold">Indicateurs de Fraicheur</h2>
          </div>
          
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-400 font-medium">ACTIF</span>
              <span className="text-white/50 text-sm">Donnees mises a jour dans les 15 dernieres minutes</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              <span className="text-zinc-400 font-medium">CACHE</span>
              <span className="text-white/50 text-sm">Donnees mises a jour dans la derniere heure</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
              <span className="text-zinc-500 font-medium">ANCIEN</span>
              <span className="text-white/50 text-sm">Donnees de plus d&apos;une heure</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-sm text-[var(--color-text-muted)] pt-8 border-t border-[var(--color-border)]">
          <p>Derniere mise a jour de cette page: Avril 2026</p>
          <p className="mt-2">
            <Link href="/legal" className="text-cyan-400/80 hover:text-cyan-300 underline underline-offset-2">
              Mentions légales
            </Link>
            {' · '}
            <Link href="/privacy" className="text-cyan-400/80 hover:text-cyan-300 underline underline-offset-2">
              Confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

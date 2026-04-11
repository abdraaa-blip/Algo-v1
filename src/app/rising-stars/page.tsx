import type { Metadata } from 'next'
import RisingStarsClientShell from './RisingStarsClientShell'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import { ALGO_UI_LOADING } from '@/lib/copy/ui-strings'

export const metadata: Metadata = buildPageMetadata({
  title: 'Talents émergents',
  description:
    'Artistes, influenceurs et créateurs qui explosent · signaux de croissance et visibilité en temps réel.',
  path: '/rising-stars',
  keywords: ['rising stars', 'créateurs', 'influenceurs', 'musique', 'ALGO'],
})

export default function RisingStarsPage() {
  const i18n = {
    title: 'Talents Emergents',
    subtitle: 'Les talents qui explosent en ce moment',
    filterAll: 'Tous',
    filterRapper: 'Rappeurs',
    filterSinger: 'Chanteurs',
    filterComedian: 'Comediens',
    filterInfluencer: 'Influenceurs',
    filterCreator: 'Createurs',
    sortViralScore: 'Score viral',
    sortGrowth: 'Croissance',
    sortMentions: 'Mentions',
    sortSentiment: 'Sentiment',
    loading: ALGO_UI_LOADING.risingStars,
    emptyTitle: 'Aucune star trouvee',
    emptySubtitle: 'Essaie avec d\'autres filtres',
  }

  return <RisingStarsClientShell i18n={i18n} />
}

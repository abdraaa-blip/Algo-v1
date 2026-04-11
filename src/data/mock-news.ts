import type { NewsItem } from "@/types";

const NOW = Date.now();
const minsAgo = (n: number) => new Date(NOW - n * 60_000).toISOString();
const hoursAgo = (n: number) => new Date(NOW - n * 3_600_000).toISOString();

export const mockNews: NewsItem[] = [
  {
    id: "n001",
    title:
      "L'UE vote une loi historique sur la régulation des algorithmes des réseaux sociaux",
    summary:
      "Le Parlement européen a adopté à une large majorité un texte obligeant les plateformes à rendre leurs algorithmes de recommandation auditables. Une première mondiale qui pourrait remodeler Internet.",
    importanceScore: 96,
    speedScore: 88,
    tags: ["Politique", "Tech", "Europe", "Algorithmes"],
    sourceUrl: "https://europarl.europa.eu",
    detectedAt: minsAgo(25),
    country: "FR",
    language: "fr",
    relatedContentIds: ["c003", "c010"],
  },
  {
    id: "n002",
    title:
      "OpenAI annonce un modèle capable de générer des vidéos de 10 minutes en temps réel",
    summary:
      "La génération vidéo par IA franchit un nouveau cap. Le modèle produit des vidéos cinématographiques de 10 minutes à partir d'une description textuelle en moins de 60 secondes.",
    importanceScore: 94,
    speedScore: 92,
    tags: ["IA", "Tech", "Vidéo", "OpenAI"],
    sourceUrl: "https://openai.com",
    detectedAt: hoursAgo(1),
    country: "US",
    language: "en",
    relatedContentIds: ["c006", "c026"],
  },
  {
    id: "n003",
    title:
      "TikTok annonce un fonds de 2 milliards pour ses créateurs africains",
    summary:
      "Dans le cadre de son expansion sur le continent, TikTok lance un programme de financement direct dans 15 pays africains. Un tournant stratégique pour l'économie créative africaine.",
    importanceScore: 87,
    speedScore: 79,
    tags: ["TikTok", "Afrique", "Créateurs", "Business"],
    sourceUrl: "https://newsroom.tiktok.com",
    detectedAt: hoursAgo(3),
    country: "NG",
    language: "en",
    relatedContentIds: ["c006", "c008", "c014", "c023"],
  },
  {
    id: "n004",
    title:
      "Un étudiant de 19 ans vend son application IA pour 50 millions de dollars",
    summary:
      "Développée en 8 mois depuis sa chambre d'étudiant, une application de productivity IA vient d'être rachetée par un géant de la tech. Le fondateur devient l'un des plus jeunes à réaliser une exit de cette ampleur.",
    importanceScore: 82,
    speedScore: 95,
    tags: ["Startup", "IA", "Jeunesse", "Tech"],
    sourceUrl: "https://techcrunch.com",
    detectedAt: minsAgo(47),
    country: "GB",
    language: "en",
    relatedContentIds: ["c013"],
  },
  {
    id: "n005",
    title:
      "La France lance son programme national de formation aux métiers de l'IA",
    summary:
      "Le gouvernement annonce la formation de 100 000 personnes aux métiers de l'intelligence artificielle d'ici 2026. Un investissement de 800 millions d'euros.",
    importanceScore: 85,
    speedScore: 71,
    tags: ["France", "IA", "Formation", "Politique"],
    sourceUrl: "https://gouvernement.fr",
    detectedAt: hoursAgo(8),
    country: "FR",
    language: "fr",
    relatedContentIds: ["c002"],
  },
  {
    id: "n006",
    title:
      "Spotify rachète une startup qui prédit la viralité musicale 3 semaines à l'avance",
    summary:
      "L'algorithme analysait les patterns de playlisting, les mentions sur les réseaux sociaux et les recherches YouTube pour prédire avec 78% de précision les titres qui allaient exploser.",
    importanceScore: 89,
    speedScore: 83,
    tags: ["Spotify", "Musique", "IA", "Viralité"],
    sourceUrl: "https://newsroom.spotify.com",
    detectedAt: hoursAgo(6),
    country: "US",
    language: "en",
    relatedContentIds: ["c012", "c023"],
  },
  {
    id: "n007",
    title: "Le Nigeria devient le 3e marché mondial du streaming musical",
    summary:
      "Porté par l'explosion de l'Afrobeats à l'international, le Nigeria dépasse l'Inde et le Brésil en nombre d'abonnements aux plateformes de streaming.",
    importanceScore: 91,
    speedScore: 78,
    tags: ["Nigeria", "Musique", "Streaming", "Afrobeats"],
    sourceUrl: "https://ifpi.org",
    detectedAt: hoursAgo(15),
    country: "NG",
    language: "en",
    relatedContentIds: ["c006", "t005", "t013"],
  },
  {
    id: "n008",
    title:
      "Instagram teste un format vidéo de 3 heures pour concurrencer YouTube",
    summary:
      "Meta expérimente un nouveau format longue durée sur Instagram. Cette décision marque un virage stratégique majeur pour la plateforme historiquement centrée sur le contenu court.",
    importanceScore: 83,
    speedScore: 90,
    tags: ["Instagram", "Meta", "Vidéo", "Stratégie"],
    sourceUrl: "https://about.instagram.com",
    detectedAt: hoursAgo(2),
    country: "US",
    language: "en",
    relatedContentIds: ["c001", "c009"],
  },
  {
    id: "n009",
    title:
      "Belgique : une loi oblige les plateformes à indiquer le temps de création d'un contenu",
    summary:
      "Première au monde : la Belgique impose aux plateformes d'afficher le temps réel de travail derrière chaque contenu. Une mesure destinée à lutter contre les faux 'overnight success'.",
    importanceScore: 79,
    speedScore: 74,
    tags: ["Belgique", "Loi", "Créateurs", "Transparence"],
    sourceUrl: "https://gouvernement.be",
    detectedAt: hoursAgo(11),
    country: "BE",
    language: "fr",
    relatedContentIds: ["c016"],
  },
  {
    id: "n010",
    title:
      "Le Maroc annonce un grand plan national pour les créateurs de contenu",
    summary:
      "Le gouvernement marocain lance un fonds de 200 millions de dirhams destiné à soutenir les créateurs numériques. Une initiative inédite en Afrique du Nord.",
    importanceScore: 80,
    speedScore: 68,
    tags: ["Maroc", "Créateurs", "Numérique", "Politique"],
    sourceUrl: "https://mc.gov.ma",
    detectedAt: hoursAgo(20),
    country: "MA",
    language: "fr",
    relatedContentIds: ["c004", "c021"],
  },
];

// =============================================================================
// ALGO V1 · Design System Tokens
// Source unique de toutes les valeurs visuelles.
// Aucune couleur, spacing ou durée n'est déclarée hors de ce fichier.
// =============================================================================

export const tokens = {

  // ─── Couleurs ──────────────────────────────────────────────────────────────

  colors: {
    bg: {
      primary:   '#07070f',  // fond global · noir profond, pas gris fade
      secondary: '#0d0d1a',  // fond secondaire · drawers, modals
      card:      'rgba(255, 255, 255, 0.04)',
      cardHover: 'rgba(255, 255, 255, 0.07)',
    },
    border: {
      card:    'rgba(255, 255, 255, 0.08)',
      subtle:  'rgba(255, 255, 255, 0.05)',
      strong:  'rgba(255, 255, 255, 0.15)',
      focus:   'rgba(123, 97, 255, 0.60)',
    },
    accent: {
      violet:       '#7B61FF',  // dominant
      violetMuted:  'rgba(123, 97, 255, 0.30)',
      violetSubtle: 'rgba(123, 97, 255, 0.12)',
      blueNeon:     '#00D1FF',  // secondaire
      greenSignal:  '#00FFB2',  // signaux positifs / early
      redAlert:     '#FF4D6D',  // alertes et chutes uniquement
      amber:        '#FFD166',  // timing intermédiaire
    },
    text: {
      primary:   '#f0f0f8',
      secondary: 'rgba(240, 240, 248, 0.60)',
      muted:     'rgba(240, 240, 248, 0.35)',
      faint:     'rgba(240, 240, 248, 0.20)',
      inverse:   '#07070f',
    },
    badge: {
      viral:       { bg: 'rgba(123, 97, 255, 0.20)', text: '#c4b5fd', dot: '#7B61FF' },
      early:       { bg: 'rgba(0, 255, 178, 0.15)',  text: '#6ee7b7', dot: '#00FFB2' },
      breaking:    { bg: 'rgba(255, 77, 109, 0.20)', text: '#fca5a5', dot: '#FF4D6D' },
      trend:       { bg: 'rgba(0, 209, 255, 0.15)',  text: '#7dd3fc', dot: '#00D1FF' },
      almostViral: { bg: 'rgba(255, 255, 255, 0.08)', text: 'rgba(240,240,248,0.45)', dot: null },
      coolOff:     { bg: 'rgba(255, 255, 255, 0.04)', text: 'rgba(240,240,248,0.25)', dot: null },
    },
    momentum: {
      up:     '#00FFB2',
      stable: '#00D1FF',
      down:   'rgba(240, 240, 248, 0.35)',
    },
    probability: {
      high:   '#00FFB2',
      medium: '#FFD166',
      low:    '#FF4D6D',
    },
    curve: {
      violet: '#7B61FF',
      blue:   '#00D1FF',
      green:  '#00FFB2',
    },
  },

  // ─── Border radius ─────────────────────────────────────────────────────────

  radius: {
    sm:   '8px',
    md:   '12px',
    lg:   '16px',
    xl:   '24px',
    full: '9999px',
  },

  // ─── Spacing ───────────────────────────────────────────────────────────────

  spacing: {
    xs:  '4px',
    sm:  '8px',
    md:  '16px',
    lg:  '24px',
    xl:  '40px',
    xxl: '64px',
  },

  // ─── Opacités sémantiques ──────────────────────────────────────────────────

  opacity: {
    grain:    0.04,  // texture grain sur fond
    curveBg:  0.08,  // LiveCurve en arrière-plan
    subtle:   0.15,
    disabled: 0.40,
    cardBg:   0.04,
  },

  // ─── Ombres ────────────────────────────────────────────────────────────────

  shadow: {
    card:      '0 4px 24px rgba(0, 0, 0, 0.40)',
    cardHover: '0 8px 32px rgba(0, 0, 0, 0.50)',
    glow: {
      violet: '0 0 20px rgba(123, 97, 255, 0.30)',
      green:  '0 0 20px rgba(0, 255, 178, 0.25)',
      red:    '0 0 20px rgba(255, 77, 109, 0.25)',
      blue:   '0 0 20px rgba(0, 209, 255, 0.25)',
    },
    // Fonction utilitaire · usage: tokens.shadow.glowDynamic('#7B61FF')
    glowDynamic: (hex: string) => `0 0 20px ${hex}30`,
  },

  // ─── Typographie ───────────────────────────────────────────────────────────

  font: {
    family: "'Inter', system-ui, -apple-system, sans-serif",
    size: {
      xs:   '11px',
      sm:   '13px',
      md:   '15px',
      lg:   '18px',
      xl:   '24px',
      xxl:  '36px',
      hero: '56px',
    },
    weight: {
      regular:  400,
      medium:   500,
      semibold: 600,
      bold:     700,
      black:    900,
    },
    letterSpacing: {
      tight:  '-0.02em',
      normal: '0em',
      wide:   '0.05em',
      caps:   '0.10em',
    },
    lineHeight: {
      tight:   1.2,
      normal:  1.5,
      relaxed: 1.7,
    },
    numeric: 'tabular-nums', // font-variant-numeric pour les métriques
  },

  // ─── Durées d'animation ────────────────────────────────────────────────────
  // Règle : durées harmoniques uniquement (150ms, 250ms, 350ms, 2s, 3s, 4s, 8s, 12s)
  // Aucune animation < 150ms. Aucun bounce. Aucune lib lourde.

  duration: {
    fast:    150,   // interactions rapides (hover, focus)
    normal:  250,   // transitions standard
    slow:    350,   // ouvertures, slideins
    breathe: 3000,  // pulse léger sur cartes
    pulse:   4000,  // early signal glow
    curve:  12000,  // LiveCurve · déplacement lent
    ring:    8000,  // ViralScoreRing outer arc rotation
  },

  // ─── Easing ────────────────────────────────────────────────────────────────

  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    out:     'cubic-bezier(0, 0, 0.2, 1)',
    in:      'cubic-bezier(0.4, 0, 1, 1)',
  },

  // ─── Z-index ───────────────────────────────────────────────────────────────

  zIndex: {
    base:   0,
    card:   10,
    sticky: 100,
    nav:    200,
    modal:  300,
    toast:  400,
  },

} as const

// Type exporté pour usage dans les composants
export type Tokens = typeof tokens

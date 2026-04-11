/**
 * Design Token System · ALGO (calme, précis, lisible)
 *
 * Reflet TS des variables CSS dans `globals.css` (@theme + data-algo-view).
 * Rôles : lecture, hiérarchie, émotion mesurée · pas de saturation agressive.
 */

// ============================================================================
// SPACING TOKENS
// Base unit: 4px (following 4-point grid system)
// ============================================================================

export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',    // Apple minimum touch target
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px',
} as const

// ============================================================================
// COLOR TOKENS
// Semantic naming for consistent theming
// ============================================================================

export const colors = {
  // Base
  transparent: 'transparent',
  current: 'currentColor',
  white: '#ffffff',
  black: '#000000',
  
  // Background hierarchy
  background: {
    primary: 'rgb(7, 7, 15)',      // Main background
    secondary: 'rgb(12, 12, 24)',   // Elevated surfaces
    tertiary: 'rgb(18, 18, 35)',    // Cards, modals
    inverse: '#ffffff',
  },
  
  // Surface (for cards, modals, dropdowns)
  surface: {
    default: 'rgba(255, 255, 255, 0.03)',
    hover: 'rgba(255, 255, 255, 0.06)',
    active: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(139, 92, 246, 0.1)',
  },
  
  // Border
  border: {
    default: 'rgba(255, 255, 255, 0.06)',
    subtle: 'rgba(255, 255, 255, 0.03)',
    strong: 'rgba(255, 255, 255, 0.12)',
    focus: 'rgba(139, 92, 246, 0.5)',
  },
  
  // Text hierarchy
  text: {
    primary: 'rgba(255, 255, 255, 0.95)',
    secondary: 'rgba(255, 255, 255, 0.65)',
    tertiary: 'rgba(255, 255, 255, 0.45)',
    disabled: 'rgba(255, 255, 255, 0.25)',
    inverse: 'rgb(7, 7, 15)',
  },
  
  // Brand colors
  brand: {
    violet: '#8B5CF6',
    purple: '#A855F7',
    pink: '#EC4899',
    orange: '#F97316',
  },
  
  // Semantic colors
  semantic: {
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
    info: '#3B82F6',
  },
  
  // Viral score tiers
  viral: {
    legendary: '#F59E0B',   // 90-100
    explosive: '#EF4444',   // 80-89
    hot: '#EC4899',         // 70-79
    rising: '#8B5CF6',      // 50-69
    emerging: '#6366F1',    // 30-49
    new: '#64748B',         // 0-29
  },
  
  // Growth indicators
  growth: {
    positive: '#22C55E',
    neutral: '#64748B',
    negative: '#EF4444',
  },
} as const

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export const typography = {
  fontFamily: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],       // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
    '5xl': ['3rem', { lineHeight: '1' }],          // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],       // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }],        // 72px
    '8xl': ['6rem', { lineHeight: '1' }],          // 96px
    '9xl': ['8rem', { lineHeight: '1' }],          // 128px
  },
  
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

// ============================================================================
// ANIMATION TOKENS
// Base duration: 150ms (per Linear standards)
// ============================================================================

/** Durées signature 200–400ms + respirations longues (aligné CSS --algo-duration-*) */
export const experienceMotion = {
  tap: '200ms',
  route: '280ms',
  panel: '320ms',
  reveal: '380ms',
} as const

export const animation = {
  duration: {
    instant: '0ms',
    fast: '160ms',
    normal: '260ms',
    slow: '340ms',
    slower: '500ms',
    slowest: '700ms',
  },
  
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    /** Sortie douce · transitions de page / panneaux */
    easeOutSoft: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeInOutSoft: 'cubic-bezier(0.45, 0, 0.55, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Predefined animations
  keyframes: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    fadeOut: {
      from: { opacity: 1 },
      to: { opacity: 0 },
    },
    slideUp: {
      from: { transform: 'translateY(10px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    slideDown: {
      from: { transform: 'translateY(-10px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
    },
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
  },
} as const

// ============================================================================
// SHADOW TOKENS
// ============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  // Glow effects for viral elements
  glow: {
    violet: '0 0 20px rgba(139, 92, 246, 0.3)',
    pink: '0 0 20px rgba(236, 72, 153, 0.3)',
    orange: '0 0 20px rgba(249, 115, 22, 0.3)',
  },
} as const

// ============================================================================
// BORDER RADIUS TOKENS
// ============================================================================

export const borderRadius = {
  none: '0px',
  sm: '4px',
  default: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
} as const

// ============================================================================
// Z-INDEX TOKENS
// ============================================================================

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// ============================================================================
// TOUCH TARGETS
// Apple HIG minimum: 44x44 points
// ============================================================================

export const touchTargets = {
  minimum: '44px',
  comfortable: '48px',
  large: '56px',
} as const

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get viral tier color based on score
 */
export function getViralTierColor(score: number): string {
  if (score >= 90) return colors.viral.legendary
  if (score >= 80) return colors.viral.explosive
  if (score >= 70) return colors.viral.hot
  if (score >= 50) return colors.viral.rising
  if (score >= 30) return colors.viral.emerging
  return colors.viral.new
}

/**
 * Get growth color based on percentage
 */
export function getGrowthColor(percentage: number): string {
  if (percentage > 0) return colors.growth.positive
  if (percentage < 0) return colors.growth.negative
  return colors.growth.neutral
}

/**
 * Get contrast-safe text color for a background
 */
export function getContrastTextColor(background: string): string {
  // Simple luminance check - could be enhanced
  if (background.includes('255') || background === '#ffffff' || background === 'white') {
    return colors.text.inverse
  }
  return colors.text.primary
}

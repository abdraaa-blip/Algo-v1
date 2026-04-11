/**
 * Accessibility Utilities - Microsoft Accessibility Standards
 *
 * Features:
 * - Focus management
 * - Screen reader announcements
 * - Keyboard navigation
 * - Reduced motion detection
 * - ARIA helpers
 */

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/**
 * Trap focus within an element (for modals, dialogs)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableSelectors = [
    "a[href]",
    "area[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "button:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
    "[contenteditable]",
  ].join(", ");

  const focusableElements =
    container.querySelectorAll<HTMLElement>(focusableSelectors);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  }

  container.addEventListener("keydown", handleKeyDown);

  // Focus first element
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Restore focus to a previous element after modal closes
 */
export function createFocusRestorer(): {
  save: () => void;
  restore: () => void;
} {
  let previouslyFocused: HTMLElement | null = null;

  return {
    save: () => {
      previouslyFocused = document.activeElement as HTMLElement;
    },
    restore: () => {
      previouslyFocused?.focus();
      previouslyFocused = null;
    },
  };
}

// ============================================================================
// SCREEN READER ANNOUNCEMENTS
// ============================================================================

let announcer: HTMLElement | null = null;

function getAnnouncer(): HTMLElement {
  if (!announcer && typeof document !== "undefined") {
    announcer = document.createElement("div");
    announcer.setAttribute("aria-live", "polite");
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(announcer);
  }
  return announcer!;
}

/**
 * Announce a message to screen readers
 */
export function announce(
  message: string,
  options: {
    priority?: "polite" | "assertive";
    clearAfter?: number;
  } = {},
): void {
  const { priority = "polite", clearAfter = 5000 } = options;
  const el = getAnnouncer();

  el.setAttribute("aria-live", priority);

  // Clear and re-add to trigger announcement
  el.textContent = "";

  requestAnimationFrame(() => {
    el.textContent = message;

    if (clearAfter > 0) {
      setTimeout(() => {
        el.textContent = "";
      }, clearAfter);
    }
  });
}

// ============================================================================
// REDUCED MOTION
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Hook-like function to subscribe to reduced motion changes
 */
export function onReducedMotionChange(
  callback: (prefersReduced: boolean) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  mediaQuery.addEventListener("change", handler);

  // Call immediately with current value
  callback(mediaQuery.matches);

  return () => {
    mediaQuery.removeEventListener("change", handler);
  };
}

// ============================================================================
// KEYBOARD NAVIGATION HELPERS
// ============================================================================

/**
 * Key codes for common navigation keys
 */
export const Keys = {
  Enter: "Enter",
  Space: " ",
  Escape: "Escape",
  Tab: "Tab",
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  Home: "Home",
  End: "End",
  PageUp: "PageUp",
  PageDown: "PageDown",
} as const;

/**
 * Handle roving tabindex for composite widgets
 * (toolbars, menus, listboxes, etc.)
 */
export function createRovingTabIndex(
  container: HTMLElement,
  options: {
    selector?: string;
    orientation?: "horizontal" | "vertical" | "both";
    loop?: boolean;
  } = {},
): () => void {
  const {
    selector = '[role="option"], [role="menuitem"], [role="tab"]',
    orientation = "vertical",
    loop = true,
  } = options;

  const items = () =>
    Array.from(container.querySelectorAll<HTMLElement>(selector));

  function handleKeyDown(e: KeyboardEvent) {
    const allItems = items();
    const currentIndex = allItems.findIndex(
      (item) => item === document.activeElement,
    );

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    const isVertical = orientation === "vertical" || orientation === "both";
    const isHorizontal = orientation === "horizontal" || orientation === "both";

    switch (e.key) {
      case Keys.ArrowDown:
        if (isVertical) {
          e.preventDefault();
          nextIndex = loop
            ? (currentIndex + 1) % allItems.length
            : Math.min(currentIndex + 1, allItems.length - 1);
        }
        break;

      case Keys.ArrowUp:
        if (isVertical) {
          e.preventDefault();
          nextIndex = loop
            ? (currentIndex - 1 + allItems.length) % allItems.length
            : Math.max(currentIndex - 1, 0);
        }
        break;

      case Keys.ArrowRight:
        if (isHorizontal) {
          e.preventDefault();
          nextIndex = loop
            ? (currentIndex + 1) % allItems.length
            : Math.min(currentIndex + 1, allItems.length - 1);
        }
        break;

      case Keys.ArrowLeft:
        if (isHorizontal) {
          e.preventDefault();
          nextIndex = loop
            ? (currentIndex - 1 + allItems.length) % allItems.length
            : Math.max(currentIndex - 1, 0);
        }
        break;

      case Keys.Home:
        e.preventDefault();
        nextIndex = 0;
        break;

      case Keys.End:
        e.preventDefault();
        nextIndex = allItems.length - 1;
        break;
    }

    if (nextIndex !== currentIndex) {
      // Update tabindex
      allItems.forEach((item, i) => {
        item.setAttribute("tabindex", i === nextIndex ? "0" : "-1");
      });

      // Focus new item
      allItems[nextIndex]?.focus();
    }
  }

  container.addEventListener("keydown", handleKeyDown);

  // Initialize: only first item should be focusable
  const allItems = items();
  allItems.forEach((item, i) => {
    item.setAttribute("tabindex", i === 0 ? "0" : "-1");
  });

  return () => {
    container.removeEventListener("keydown", handleKeyDown);
  };
}

// ============================================================================
// ARIA HELPERS
// ============================================================================

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0;

export function generateId(prefix = "algo"): string {
  return `${prefix}-${++idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Create ARIA describedby relationship
 */
export function createAriaDescribedBy(
  element: HTMLElement,
  description: string,
): () => void {
  const id = generateId("description");

  const descriptionEl = document.createElement("span");
  descriptionEl.id = id;
  descriptionEl.className = "sr-only";
  descriptionEl.textContent = description;

  element.setAttribute("aria-describedby", id);
  element.appendChild(descriptionEl);

  return () => {
    element.removeAttribute("aria-describedby");
    descriptionEl.remove();
  };
}

// ============================================================================
// CONTRAST CHECKING
// ============================================================================

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate contrast ratio between two colors
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG requirements
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: "AA" | "AAA" = "AA",
  isLargeText = false,
): boolean {
  const ratio = getContrastRatio(foreground, background);

  if (level === "AAA") {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }

  // AA level
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

// ============================================================================
// SKIP LINK
// ============================================================================

/**
 * Create a skip link for keyboard navigation
 */
export function createSkipLink(
  targetId: string,
  text = "Skip to main content",
): HTMLAnchorElement {
  const link = document.createElement("a");
  link.href = `#${targetId}`;
  link.textContent = text;
  link.className = "skip-link";
  link.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px 16px;
    z-index: 10000;
    text-decoration: none;
    font-weight: bold;
    transition: top 0.3s;
  `;

  link.addEventListener("focus", () => {
    link.style.top = "0";
  });

  link.addEventListener("blur", () => {
    link.style.top = "-40px";
  });

  return link;
}

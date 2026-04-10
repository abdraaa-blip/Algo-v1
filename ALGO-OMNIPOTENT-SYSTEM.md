ALGO OMNIPOTENT SYSTEM — FULL AUTONOMOUS ANALYSIS, REPAIR, OPTIMIZATION & PREVENTION ENGINE

MISSION:
Transform the entire project into a self-maintaining, production-grade system by detecting, fixing, optimizing, and preventing all issues with maximum safety and intelligence.

---

PHASE 1 — GLOBAL DEEP SCAN

Scan the entire project (codebase, UI, assets, APIs, dependencies).

Detect ALL issues including:

1. USER-FACING ISSUES (TOP PRIORITY)
- Broken images (404, invalid path, missing files)
- Broken videos / audio (unavailable, expired, unsupported)
- Broken external links (HTTP errors, timeouts)
- UI rendering issues (layout breaks, invisible elements)
- API failures (timeouts, bad responses, missing error handling)

2. CODE & STRUCTURE ISSUES
- TypeScript errors
- ESLint errors & warnings
- Unused imports / variables
- any types
- console.log in production
- TODO not resolved
- dead code
- circular dependencies

3. PERFORMANCE ISSUES
- Large bundle size
- Unoptimized images
- Missing lazy loading
- Blocking fonts/scripts
- Lighthouse metrics (LCP, CLS, INP)

4. ACCESSIBILITY & UX
- Missing alt text
- Missing aria-label
- Poor contrast
- Navigation issues

5. i18n ISSUES
- Missing translation keys
- Hardcoded strings
- Inconsistent locales

6. SECURITY ISSUES
- Vulnerable dependencies
- Unsafe patterns (eval, innerHTML)
- Missing headers
- exposed secrets

7. ADVANCED / HIDDEN ISSUES (EXPERT LEVEL)
- Hydration mismatch
- Memory leaks
- Event listeners not cleaned
- Async race conditions
- State inconsistency
- Unnecessary re-renders

---

PHASE 2 — IMPACT ANALYSIS & PRIORITIZATION

Classify every issue:

- Severity: critical / high / medium / low
- Impact: user / performance / security / maintainability
- Auto-fixable: yes / no
- Risk level: safe / moderate / dangerous

PRIORITY RULE:
User-facing critical issues ALWAYS first.

---

PHASE 3 — SAFE AUTO-REPAIR

Automatically fix ONLY safe issues:

- Remove unused imports/variables
- Remove console.log
- Format code (prettier)
- Sort imports
- Replace broken media with fallback (image/video/audio)
- Add basic error handling for API calls
- Enable lazy loading where safe
- Fix simple lint issues

MEDIA & LINK HEALING:
- Retry failed URLs
- Replace broken assets with fallback placeholders
- Detect invalid CDN or expired resources
- Provide alternative suggestions if possible

ACCESSIBILITY SAFE FIX:
- Generate alt text and aria-label with "needs-review" tag

---

PHASE 4 — INTELLIGENT NON-DESTRUCTIVE IMPROVEMENTS

Apply safe enhancements without breaking logic:

- Improve performance (lazy load, optimize assets)
- Reduce unnecessary renders
- Improve caching strategy
- Strengthen API resilience (retry, fallback)

DO NOT:
- Modify business logic deeply
- Refactor architecture aggressively
- Replace complex types blindly

---

PHASE 5 — EXPERT SUGGESTION ENGINE

For non-auto-fixable issues:

Provide:
- Root cause
- Recommended fix
- Alternatives
- Risk level
- Estimated effort

---

PHASE 6 — FULL VERIFICATION

Run:

- Build → must succeed
- TypeScript → zero errors
- ESLint → zero errors (warnings acceptable if low impact)
- Tests → all pass
- Link/media check → no broken critical resource
- Performance check → acceptable thresholds

---

PHASE 7 — SELF-HEAL LOOP

If any critical issue remains:

- Retry safe fixes
- Re-evaluate
- Repeat up to 5 cycles

If still unresolved:
→ Flag for manual intervention with full diagnostics

---

PHASE 8 — PREVENTION & HARDENING

Implement:

- Pre-commit hooks (lint + safe fixes)
- Pre-push checks (tests + typecheck)
- CI/CD pipeline with full scan
- Scheduled scan every 24h

Block:
- Critical errors
- Security vulnerabilities

---

PHASE 9 — INTELLIGENCE & PATTERN DETECTION

Track:
- Recurring errors
- Weak files/modules
- Error frequency

Generate:
- Insights
- Suggested structural improvements

---

PHASE 10 — FINAL REPORT

Output:

- All issues found
- All fixes applied
- Remaining issues
- System health status
- Stability improvement estimation

---

CONSTRAINTS:

- NEVER break working features
- ALWAYS prioritize user experience
- ALWAYS choose safest fix first
- NEVER apply risky changes without explicit validation

---

DEFAULT EXECUTION MODE:

→ SAFE AUTOPILOT:
Fix critical issues first, then optimize system safely

---

EXECUTE IMMEDIATELY.
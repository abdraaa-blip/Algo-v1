# ALGO Data Planet

`AlgoDataPlanet` adds a subtle rotating transparent planet that visualizes data convergence without blocking content.

## Location

- Component: `src/components/ui/AlgoDataPlanet.tsx`
- Mounted in: `src/components/layout/ClientLayout.tsx`

## Behavior

- Transparent rotating planet in top-right visual zone.
- Converging particles represent incoming data streams.
- Micro shooting stars react to activity bursts.
- Activity adapts to:
  - scroll speed,
  - pointer interaction,
  - click pulses,
  - real intelligence metrics (on intelligence-related pages).

## Data linkage

On `/intelligence`, `/monitor`, and `/viral-analyzer`, it pulls:

- `/api/intelligence/predictive` for virality score
- `/api/intelligence/ops-alerts` for system pressure/alerts

These signals adjust:

- rotation speed,
- particle density,
- visual intensity.

## Performance and accessibility

- Canvas-only, no layout shift.
- `requestAnimationFrame` throttled to ~60fps.
- DPR capped for GPU safety.
- Automatic reduction/disable for:
  - `prefers-reduced-motion`,
  - low-core + low-memory devices.
- CSS fallback when animated mode is disabled or unavailable.

## Toggle control

Disable at runtime:

```js
localStorage.setItem('algo_planet_enabled', '0')
window.dispatchEvent(new Event('algo:planet-toggle'))
```

Enable again:

```js
localStorage.removeItem('algo_planet_enabled')
window.dispatchEvent(new Event('algo:planet-toggle'))
```

Global env kill switch:

- `NEXT_PUBLIC_ALGO_PLANET_ENABLED=0`

## Visual safety

- Rendered behind content (`z-0`, `pointer-events-none`).
- Opacity and size tuned for readability first.
- Variant-based intensity by page context (`home`, `videos`, `news`, `intelligence`, etc.).

# Real and perceived performance

Speed is UX: Doherty (< 400 ms), Nielsen (0.1 / 1 / 10 s), Peak–end (a long wait becomes the negative peak).

## 1. Thresholds
| Time | Perception | Do |
|---|---|---|
| < 100 ms | Instant | Visual press feedback always within this |
| 100–400 ms | Fluid (Doherty) | Target for frequent interactions |
| 400 ms – 1 s | Noticeable | Subtle indicator in the control |
| 1–10 s | Control lost | Skeleton / contextual spinner |
| > 10 s | Attention lost | Determinate progress, estimate, cancel, background work + notification |

## 2. Web — Core Web Vitals (Google, 75th percentile of real users)
| Metric | Good | Needs improvement | Poor | Measures |
|---|---|---|---|---|
| LCP | ≤ 2.5 s | ≤ 4 s | > 4 s | Main content load |
| INP | ≤ 200 ms | ≤ 500 ms | > 500 ms | Interaction responsiveness (replaced FID in March 2024) |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 | Visual stability |

Typical causes in code:
- LCP: hero image without priority/preload, blocking fonts, main content rendered client-side → SSR/SSG, optimized images, `preconnect`.
- INP: heavy handlers on the main thread, mass re-renders, costly hydration → split work (`scheduler.yield()`), virtualize lists, transitions, Web Workers.
- CLS: media without dimensions, font metric shifts, content injected above (cookie banners pushing) → reserve space, `aspect-ratio`, overlays.
- Measure: Lighthouse (lab), CrUX / `web-vitals` (field).

## 3. Native mobile
- Startup: Android vitals flag cold starts ≥ 5 s as excessive (aim for 1–2 s): Baseline Profiles, Splash Screen API, lazy init. iOS: first frame ASAP; no synchronous work at launch.
- Frames: 60 fps = 16.7 ms (120 Hz = 8.3 ms). Lists: keyed lazy lists, avoid recompositions/re-renders.
- Android ANR: main thread blocked > 5 s → never I/O on the main thread.
- Field apps (warehouse, sales): offline-first, local cache, sync queue, visible sync status.

## 4. Desktop (Tauri, Electron, native, Java, .NET, Qt)
- Visible window with skeleton in < 1 s; load modules on demand.
- Heavy work off the UI thread (Rust backend in Tauri, workers in Electron, background threads in Swing/JavaFX/.NET).
- Large file operations: progress and cancel.

## 5. Perceived-performance techniques
- **Optimistic UI** for reversible, high-success actions; revert with a message on failure.
- **Skeletons** shaped like real content; delay ~200 ms to avoid flashes.
- **Prefetch** the likely next step.
- **Staged progress** ("Validating… Generating… Done").
- **Background work** so users keep working during export/upload.
- **Virtualization/pagination** for lists > ~100 items.

## 6. Audit
- Code: fetches without loading/error states, unvirtualized long lists, images without dimensions, heavy synchronous work in handlers, buttons without pending state.
- Web: Lighthouse mobile; `render.mjs` reports observed CLS and approximate LCP.
- Native: Android Studio Profiler / Macrobenchmark, Xcode Instruments, Flutter DevTools.

Charts and dashboards: see `data-visualization.md`.

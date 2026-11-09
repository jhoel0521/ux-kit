# Web stacks

## HTML / CSS (any framework)
| Rule | Look for |
|---|---|
| Semantics | Native `<button>`, `<a href>`, `<nav>`, `<main>`, ordered headings, `<label for>`; flag `div`/`span` with click handlers, `role="button"` without `tabindex` + key handling |
| Focus | `outline: none/0` without `:focus-visible` replacement |
| Zoom | `<meta name="viewport" … user-scalable=no / maximum-scale=1>` |
| Language | `<html lang>` |
| Sizes | Buttons/icon buttons < 24px; `font-size` < 12px |
| Motion | Animations without `@media (prefers-reduced-motion: reduce)` |
| Images | `<img>` without `alt`; without `width/height` (CLS) |
| Forms | Inputs without associated label; missing `autocomplete` on personal data; wrong `type` |

## Tailwind CSS (v3 and v4)
- Size: `h-4…h-5`/`size-5` (16–20px) on interactive elements without padding → < 24px. `h-6`/`size-6` = 24px (AA minimum). Touch: `h-11` (44px), `h-12` (48px), `min-h-11`.
- Focus: `outline-none`, `focus:outline-none`, `focus:ring-0` without `focus-visible:ring-*`/`focus-visible:outline-*`.
- Literals: `p-[13px]`, `text-[15px]`, `bg-[#3a3a3a]` → theme (`@theme` in v4, `theme.extend` in v3).
- Light greys for text (`text-gray-300/400` on white, `text-gray-500` on `gray-100`) often fail 4.5:1 — verify.
- Dark mode: `dark:` variants or semantic CSS variables.
- Motion: `animate-*`/`transition` with `motion-reduce:`/`motion-safe:`.
- Hover-only content (`group-hover:` row actions) → also `focus-within:` and visible on touch.

## React / Next / Vue / Nuxt / Angular / Svelte / Astro
- Prefer accessible primitives (Radix, React Aria, Headless UI, Ark UI, Angular CDK/Material, Reka UI, Bits UI/Melt UI).
- States: around `fetch`/`useQuery`/`axios`/`HttpClient`/`useFetch`, check `loading`, `error`, empty-list branches.
- Double submit: submit disabled or `aria-busy` while pending.
- Dialogs: focus on open, restore on close (`<dialog>`, Radix Dialog do it); `aria-modal`.
- Routing: title per page; announce route changes in SPAs.
- Long lists: virtualization (TanStack Virtual, react-window, vue-virtual-scroller, CDK virtual scroll).
- Next.js: `next/image` with `sizes`, `next/font`.

## Server templates (Blade, Twig, Razor, JSP/Thymeleaf, ERB, Django/Jinja)
- Same HTML rules; check base layouts for `lang`, viewport, skip link, landmarks.
- Validation messages next to fields with `aria-describedby`; old input preserved (`old('field')` in Laravel).
- Flash messages in a `role="status"` region.

## UI libraries
| Library | Check |
|---|---|
| MUI | `createTheme` palette/typography/spacing used; no loose `sx={{ color: '#…' }}`; `IconButton` with `aria-label`; `size="small"` on touch (< 40px) |
| shadcn/ui + Radix | Tokens in CSS variables; `--muted-foreground` on `--muted` near the contrast limit — verify; `Button size="icon"` is 36–40px; `sr-only` text in icon buttons |
| Ant Design | `ConfigProvider theme={{ token }}`; `size="small"` (24px) only for pointer |
| Bootstrap | Sass/CSS variables; `.btn-sm` ≈ 31px; `visually-hidden` |
| Fluent UI React v9 | `FluentProvider theme`; `tokens.*` instead of literals |
| Material Web | `md-*` components; `--md-sys-color-*` tokens |
| Angular Material | Theme via `mat.theme`; `mat-icon-button` with `aria-label`; density settings |

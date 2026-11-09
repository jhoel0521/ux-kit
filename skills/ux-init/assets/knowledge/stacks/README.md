# Verifying rules per technology

ux-kit rules are technology-agnostic. These guides say **where to look** in each stack. `scan.mjs` automates part of it for common stacks; everything else is reviewed by reading the code.

| Guide | Covers |
|---|---|
| `web.md` | HTML/CSS, Tailwind, React/Next, Vue/Nuxt, Angular, Svelte, Astro, server templates (Blade, Twig, Razor, JSP/Thymeleaf), UI libraries (MUI, shadcn/Radix, Ant, Bootstrap, Fluent UI, Material Web, Angular Material) |
| `android.md` | Jetpack Compose, Android Views/XML, Compose Multiplatform |
| `apple.md` | SwiftUI, UIKit, AppKit |
| `cross-platform-mobile.md` | Flutter, React Native/Expo, .NET MAUI |
| `desktop.md` | Tauri, Electron, WinUI/WPF, Java Swing/JavaFX, Qt/QML (C++/Python), GTK |

## Reviewing a stack with no guide
Map each rule to the stack's concepts and look for:
1. **Name / role / state** for every interactive element (the platform accessibility API).
2. **Size** of interactive elements and how hit areas are declared.
3. **Text units** — do they follow the user's text-size setting?
4. **Theme source** — where colors, fonts and spacing are defined; are components using them or literals?
5. **States** — loading, empty, error branches around data fetching and actions.
6. **Focus/keyboard** — tab order, visible focus, shortcuts (desktop).
7. **Motion** — is there a reduce-motion check?
Contributions: add a guide here + scanner rules + a fixture in `tests/fixtures/`.

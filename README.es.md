# ux-kit

**Capa de calidad UX/UI para agentes de IA de programación.** Le da a tu agente el conocimiento y las herramientas para tener en cuenta usabilidad, accesibilidad, diseño visual y convenciones de cada plataforma cuando planifica, construye y revisa interfaces, medido contra **el estándar propio de tu proyecto**.

[English](README.md) · Licencia: MIT · Estado: v0.2 (temprano, se agradecen aportes)

- **Independiente del agente**: skills en formato estándar `SKILL.md` para Claude Code, Codex, OpenCode, Cursor, GitHub Copilot, Gemini CLI y cualquier agente compatible.
- **Independiente de la metodología**: funciona solo o junto a OpenSpec, Spec Kit, Scrum, Kanban… No tiene ciclo propio.
- **Independiente del stack**: web, Android, iOS, escritorio, Flutter, React Native, Java, .NET, Qt. Escáner para los stacks comunes y guías para el resto.
- **Tu estándar primero**: usuarios, marca y tokens viven en `.ux/` y todo se revisa contra eso.
- **Tus reglas, aplicadas**: las 6 leyes UX (Fitts, Hick, Jakob, Miller, apogeo y final, estética-usabilidad) son un checklist con reglas bloqueantes; tu equipo puede bajar cualquier regla o aprobar excepciones.

## Instalación

```bash
npx skills add jhoel0521/ux-kit            # elegir skills y agentes
npx skills add jhoel0521/ux-kit --all      # todo
```
`npx skills` instala en la carpeta correcta de cada agente (`.claude/skills/` para Claude Code; `.agents/skills/` para Codex, OpenCode, Cursor, Copilot, Gemini…). Instalación manual: copia las carpetas de `skills/` a la carpeta de skills de tu agente.

Luego, dentro de tu agente:
```
ux-init       → crea .ux/ (detecta apps y stacks; en proyectos existentes extrae los tokens)
ux-discover   → define usuarios, referentes, preguntas para usuarios, marca y tokens
```
(Claude Code: `/ux-init`; Codex: `$ux-init`; otros: pídele al agente "ejecuta ux-init".)

## Actualizar

```bash
npx skills add jhoel0521/ux-kit --skill '*' -a claude-code -y   # todas las skills, un agente: añade las nuevas (ux-laws) y reemplaza las demás
npx skills update -p                       # refresca las skills del proyecto instaladas desde GitHub
```
`--all` hace lo mismo para todos los agentes que conoce la CLI. `add` reemplaza la carpeta de una skill existente, también una copia hecha a mano.
Después ejecuta `ux-init` en cada proyecto: refresca `.ux/knowledge/` y `.ux/scripts/` y nunca toca `.ux/standard/`.

Si venías usando la skill `leyes-ux`: borra su carpeta (`.claude/skills/leyes-ux` o `.agents/skills/leyes-ux`) antes de actualizar. `ux-laws` la reemplaza, y dos skills con las mismas reglas confunden al agente.

## Skills (v0.2 — core)

| Skill | Cuándo | Qué hace |
|---|---|---|
| `ux-laws` | Sola, siempre que se diseña, construye o revisa UI | Las 6 leyes UX (Fitts, Hick, Jakob, Miller, apogeo y final, estética-usabilidad) con referencias a fondo: se declaran antes de codear y se revisa un checklist antes de entregar. Fitts y Hick son bloqueantes |
| `ux-guide` | Sola, cuando el agente planifica o construye UI | Añade consideraciones UX/UI a cualquier plan; aplica el estándar al construir; pide `ux-check` al terminar |
| `ux-init` | Una vez; repetirlo sincroniza | Crea/sincroniza `.ux/`; detecta apps (también en monorepos) y migraciones de framework |
| `ux-discover` | Al iniciar el producto, rediseños, cambios de marca o usuarios | Define o actualiza el estándar por partes; CHANGELOG con versión; análisis de impacto |
| `ux-plan-review` | Antes de aprobar un plan | Revisa cualquier plan (change de OpenSpec, modo plan, TASKS.md…) y pregunta si corregirlo |
| `ux-check` | Después de un cambio de UI | Revisión liviana de los archivos visuales cambiados (cualquier lenguaje) contra el estándar; detecta desvíos |

Próximamente: `ux-check-ux`, `ux-check-ui`, `ux-check-design`, `ux-check-a11y`, `ux-audit`, `ux-retro` (v0.3, con CLI npm); integraciones `ux-openspec`, `ux-scrum`, `ux-log` (v0.4). Ver [docs/DESIGN.md](docs/DESIGN.md).

## Dónde encaja en tu ciclo

| Momento | ux-kit |
|---|---|
| Descubrimiento | `ux-discover` → `.ux/standard/` |
| Planificación (cualquier herramienta) | `ux-guide` añade puntos UX al plan · `ux-plan-review` antes de aprobar |
| Implementación | `ux-guide` aplica el estándar |
| Cambio terminado | `ux-check` |
| Monorepo / migración de framework | `ux-init` (repetido) o sincronización automática |

## Qué queda en tu proyecto

```
.ux/
├── config.yaml     plataformas, apps (sincronizadas), nivel de accesibilidad, severidades, excepciones, integraciones
├── standard/       users.md · references.md · user-questions.md · brand.md · tokens.json · CHANGELOG.md
├── knowledge/      leyes UX, Nielsen, WCAG 2.2, plataformas, sistema visual, estados, formularios, rendimiento… (del kit)
├── scripts/        detect · scan · contrast · tokens · render (Node.js sin dependencias; render necesita Playwright)
└── reports/        resultados de revisiones
```

Los documentos del estándar y los reportes se escriben en el idioma de tu proyecto (`config.yaml → project.language`).

## Scripts

```bash
node .ux/scripts/detect.mjs . --md                 # apps, stacks, plataformas, archivos de tema
node .ux/scripts/scan.mjs src --platform mobile    # escaneo estático (candidatos a confirmar)
node .ux/scripts/scan.mjs --changed                # solo archivos cambiados respecto a HEAD
node .ux/scripts/contrast.mjs "#777" "#fff"        # contraste WCAG
node .ux/scripts/tokens.mjs .ux/standard/tokens.json --suggest   # valida tokens y contraste
node .ux/scripts/tokens.mjs --from-tailwind tailwind.config.ts --out .ux/standard/tokens.json   # también --from-css, --from-mui; nunca ejecuta tu código
node .ux/scripts/render.mjs http://localhost:5173  # necesita Playwright: npm i -D playwright && npx playwright install chromium
```
`scan.mjs --fail-on blocker` termina con código 1 para CI.

## Contribuir
Nuevos stacks, integraciones, conocimiento con fuentes, traducciones: ver [CONTRIBUTING.md](CONTRIBUTING.md).

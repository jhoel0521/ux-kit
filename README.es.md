# ux-kit

**Capa de calidad UX/UI para agentes de IA de programaciÃ³n.** Le da a tu agente el conocimiento y las herramientas para tener en cuenta usabilidad, accesibilidad, diseÃ±o visual y convenciones de cada plataforma cuando planifica, construye y revisa interfaces, medido contra **el estÃ¡ndar propio de tu proyecto**.

[English](README.md) Â· Licencia: MIT Â· Estado: v0.1 (temprano, se agradecen aportes)

- **Independiente del agente**: skills en formato estÃ¡ndar `SKILL.md` para Claude Code, Codex, OpenCode, Cursor, GitHub Copilot, Gemini CLI y cualquier agente compatible.
- **Independiente de la metodologÃ­a**: funciona solo o junto a OpenSpec, Spec Kit, Scrum, Kanbanâ€¦ No tiene ciclo propio.
- **Independiente del stack**: web, Android, iOS, escritorio, Flutter, React Native, Java, .NET, Qt. EscÃ¡ner para los stacks comunes y guÃ­as para el resto.
- **Tu estÃ¡ndar primero**: usuarios, marca y tokens viven en `.ux/` y todo se revisa contra eso.
- **Informa, no bloquea**: avisa y pregunta; tu equipo decide.

## InstalaciÃ³n

```bash
npx skills add jhoel0521/ux-kit            # elegir skills y agentes
npx skills add jhoel0521/ux-kit --all      # todo
```
`npx skills` instala en la carpeta correcta de cada agente (`.claude/skills/` para Claude Code; `.agents/skills/` para Codex, OpenCode, Cursor, Copilot, Geminiâ€¦). InstalaciÃ³n manual: copia las carpetas de `skills/` a la carpeta de skills de tu agente.

Luego, dentro de tu agente:
```
ux-init       â†’ crea .ux/ (detecta apps y stacks; en proyectos existentes extrae los tokens)
ux-discover   â†’ define usuarios, referentes, preguntas para usuarios, marca y tokens
```
(Claude Code: `/ux-init`; Codex: `$ux-init`; otros: pÃ­dele al agente "ejecuta ux-init".)

## Skills (v0.1 â€” core)

| Skill | CuÃ¡ndo | QuÃ© hace |
|---|---|---|
| `ux-guide` | Sola, cuando el agente planifica o construye UI | AÃ±ade consideraciones UX/UI a cualquier plan; aplica el estÃ¡ndar al construir; pide `ux-check` al terminar |
| `ux-init` | Una vez; repetirlo sincroniza | Crea/sincroniza `.ux/`; detecta apps (tambiÃ©n en monorepos) y migraciones de framework |
| `ux-discover` | Al iniciar el producto, rediseÃ±os, cambios de marca o usuarios | Define o actualiza el estÃ¡ndar por partes; CHANGELOG con versiÃ³n; anÃ¡lisis de impacto |
| `ux-plan-review` | Antes de aprobar un plan | Revisa cualquier plan (change de OpenSpec, modo plan, TASKS.mdâ€¦) y pregunta si corregirlo |
| `ux-check` | DespuÃ©s de un cambio de UI | RevisiÃ³n liviana de los archivos visuales cambiados (cualquier lenguaje) contra el estÃ¡ndar; detecta desvÃ­os |

PrÃ³ximamente: `ux-check-ux`, `ux-check-ui`, `ux-check-design`, `ux-check-a11y`, `ux-audit`, `ux-retro` (v0.2, con CLI npm); integraciones `ux-openspec`, `ux-scrum`, `ux-log` (v0.3). Ver [docs/DESIGN.md](docs/DESIGN.md).

## DÃ³nde encaja en tu ciclo

| Momento | ux-kit |
|---|---|
| Descubrimiento | `ux-discover` â†’ `.ux/standard/` |
| PlanificaciÃ³n (cualquier herramienta) | `ux-guide` aÃ±ade puntos UX al plan Â· `ux-plan-review` antes de aprobar |
| ImplementaciÃ³n | `ux-guide` aplica el estÃ¡ndar |
| Cambio terminado | `ux-check` |
| Monorepo / migraciÃ³n de framework | `ux-init` (repetido) o sincronizaciÃ³n automÃ¡tica |

## QuÃ© queda en tu proyecto

```
.ux/
â”œâ”€â”€ config.yaml     plataformas, apps (sincronizadas), nivel de accesibilidad, severidades, excepciones, integraciones
â”œâ”€â”€ standard/       users.md Â· references.md Â· user-questions.md Â· brand.md Â· tokens.json Â· CHANGELOG.md
â”œâ”€â”€ knowledge/      leyes UX, Nielsen, WCAG 2.2, plataformas, sistema visual, estados, formularios, rendimientoâ€¦ (del kit)
â”œâ”€â”€ scripts/        detect Â· scan Â· contrast Â· tokens Â· render (Node.js sin dependencias; render necesita Playwright)
â””â”€â”€ reports/        resultados de revisiones
```

Los documentos del estÃ¡ndar y los reportes se escriben en el idioma de tu proyecto (`config.yaml â†’ project.language`).

## Contribuir
Nuevos stacks, integraciones, conocimiento con fuentes, traducciones: ver [CONTRIBUTING.md](CONTRIBUTING.md).

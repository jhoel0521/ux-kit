# ux-kit — Documento de diseño

> Estado: **borrador para revisión** · Versión del documento: 0.5 (alineado con la implementación v0.2) · Licencia del proyecto: MIT
> Este documento está en español para la revisión inicial. En el repositorio público, las skills irán en inglés y el README en inglés y español.

---

## 1. Qué es ux-kit

**ux-kit es una capa de calidad UX/UI para agentes de IA de programación.** Le da al agente el conocimiento y las herramientas para que, cuando planifica, construye o revisa una interfaz, tenga en cuenta usabilidad, accesibilidad, diseño visual y las convenciones de cada plataforma, medido contra el estándar propio de cada proyecto.

**Qué NO es:**
- No es un framework de desarrollo ni reemplaza a OpenSpec, Spec Kit, Scrum, Kanban ni ninguna metodología. No tiene ciclo de trabajo propio.
- No es un sistema de diseño ni una librería de componentes.
- No decide por el humano: informa, propone y pregunta.

## 2. Principios

1. **Independiente del agente.** Skills en el formato abierto `SKILL.md` (Agent Skills), usando solo los campos portables (`name`, `description`, `license`, `compatibility`, `metadata`). Funciona en Claude Code, Codex, OpenCode, Cursor, GitHub Copilot, Gemini CLI y cualquier agente compatible.
2. **Independiente de la metodología.** El núcleo no sabe si usas OpenSpec, Scrum o nada. Las integraciones con metodologías son skills opcionales.
3. **Independiente del stack.** Las reglas se expresan como criterios; cómo verificarlas en cada tecnología (HTML/CSS, Tailwind, React, Compose, SwiftUI, Flutter, Java, C#, C++…) va en guías por stack. Lo que el escáner no cubre, lo revisa el agente leyendo el código.
4. **El proyecto define su estándar.** Todo se mide contra `.ux/` del proyecto. El conocimiento general solo rellena lo que el proyecto no define.
5. **Evidencia o estándar explícito.** Las 6 leyes de `ux-laws` (Fitts, Hick, Jakob, Miller, apogeo y final, estética-usabilidad) son el estándar del equipo, con límites numéricos (7 opciones, 44 px, 8 px, 4 tamaños de letra). Se citan como regla del proyecto, no como ley universal, y cada una tiene un id de severidad configurable. Las demás leyes justifican decisiones y detectan riesgos. Ver §9.
6. **El humano decide.** Un blocker detiene la entrega: el agente lo corrige antes de dar el cambio por terminado. El equipo puede bajar cualquier regla configurable o aprobar una excepción. Lo que se implementa es decisión del equipo.
7. **Liviano por defecto.** Revisiones rápidas sobre lo que cambió; las auditorías completas son explícitas, para no gastar tokens de más.

## 3. Dónde encaja en el ciclo de desarrollo

ux-kit aporta en cinco momentos de cualquier ciclo:

| Momento | Qué aporta | Skill |
|---|---|---|
| **Descubrimiento** (al iniciar el proyecto o cuando cambia el producto) | Define el estándar: usuarios, apps de referencia, preguntas para usuarios, marca, colores, tipografía | `ux-discover` |
| **Planificación** (cuando el agente arma un plan o propone cambios, con cualquier herramienta) | El agente tiene en cuenta los puntos UX al planificar; el humano puede pedir una revisión del plan antes de aprobarlo | `ux-guide` (automática) · `ux-plan-review` |
| **Implementación** | El agente aplica el estándar mientras construye | `ux-guide` (automática) |
| **Al terminar un cambio** | Revisión liviana de los archivos visuales nuevos o modificados contra `.ux/` | `ux-check` |
| **Cierre de ciclo / periódicamente** | Revisión a fondo, resumen de deuda UX, auditoría del producto completo | `ux-check-*` · `ux-retro` · `ux-audit` |

### Ejemplo: Scrum + OpenSpec (sprint de 1 semana)

| Paso | Quién | ux-kit |
|---|---|---|
| 0. Descubrimiento (una vez, o al cambiar el producto) | Humano + IA | `ux-discover` → `.ux/standard/` |
| 1. Product Backlog | Humano | `ux-scrum` (opcional): criterios UX en las HU, deuda UX como ítems |
| 2. Sprint Planning | Humano | — |
| 3. `/opsx:propose` | IA | `ux-guide` se activa sola; `ux-openspec` (opcional) añade reglas UX a proposal/design/tasks |
| 4. Revisión de specs | Humano | `ux-plan-review`: avisa de lo que falta y pregunta si corregir |
| 5. `/opsx:apply` | IA | `ux-guide` mientras construye; al terminar, `ux-check` |
| 6. Revisión y pruebas | Humano + IA | `ux-check-ui` · `ux-check-a11y` · `ux-check-design` (junto a tus revisores de código y tests) |
| 7. Sprint Review / Retro | Humano | `ux-check-ux` sobre el flujo de la demo · `ux-retro` → deuda UX al backlog |
| 8. `/opsx:archive` | IA | — (las decisiones UX ya están en las specs) |
| Auditoría IA (transversal) | — | `ux-log` (opcional): copia cada resultado a tu bitácora |

Otro equipo puede usar solo `ux-guide` + `ux-check`, sin metodología, y obtiene valor igual.

## 4. Proceso de uso

### Proyecto nuevo
1. Instalar ux-kit (§5) y ejecutar `ux-init` → crea `.ux/`.
2. `ux-discover` → completa `.ux/standard/` (usuarios, referentes, preguntas, marca, tokens).
3. Revisar y ajustar `.ux/config.yaml` (plataformas, nivel de accesibilidad, severidades).
4. Trabajar normalmente. `ux-guide` actúa al planificar y construir; `ux-check` al terminar cada cambio.

### Proyecto ya iniciado
1. Instalar ux-kit y ejecutar `ux-init` en modo *existente*: detecta el stack y extrae los colores, tipografías y espaciados que ya se usan hacia `tokens.json`.
2. `ux-discover` para completar lo que el código no dice (usuarios, marca, referentes).
3. `ux-audit` → línea base del producto completo.
4. El equipo decide: qué se corrige (va al backlog o a cambios) y qué se acepta como excepción (queda registrado en `config.yaml`).
5. Desde ahí, trabajo normal como en un proyecto nuevo.

### Monorepo, nuevas apps y migraciones de tecnología
- **Un solo `.ux/` en la raíz.** Usuarios, marca, referentes y tokens se comparten; cada app se declara en la sección `apps` de `config.yaml` con su ruta, stack, plataformas, tema y, si hace falta, sus propias excepciones (§7).
- **Producto y técnica separados.** `standard/` no menciona tecnologías: los tokens describen valores ("color de acción = #2563eb"), no clases de un framework. Migrar de Laravel a Astro no toca el descubrimiento.
- **Sincronización automática de los hechos.** Cada skill de ux-kit compara lo que detecta en el código con `apps` en `config.yaml`. Si hay diferencias en hechos (stack, ruta del tema, app nueva o eliminada), actualiza `config.yaml` sola, lo avisa en una línea y lo registra en `.ux/reports/`. Volver a ejecutar `ux-init` hace lo mismo a mano.
- **Se pregunta lo que es decisión:** usuarios de una app nueva, plataformas o nivel de accesibilidad distintos, y diferencias entre el tema del nuevo framework y `tokens.json` ("el tema nuevo usa #1d4ed8 como color de acción; el estándar dice #2563eb: ¿corrijo el código o actualizo el estándar?").
- **Tras una reescritura completa** se recomienda `ux-audit` sobre la app migrada.

### Evolución del estándar (cambiar el descubrimiento)
El estándar no es fijo: puede llegar un rediseño de marca, un perfil de usuario nuevo o una paleta nueva.
1. **Actualizar por partes.** `ux-discover` también actualiza, indicando qué cambia ("cambió la marca", "ahora lo usan supervisores en tablet"). Solo toca los archivos afectados.
2. **Confirmar y listo.** El agente muestra el antes → después y quien está trabajando confirma.
3. **Registro.** Cada cambio sube la versión del estándar y añade una entrada a `.ux/standard/CHANGELOG.md` (fecha, qué cambió, por qué, quién lo pidió), además del historial de git. Los reportes anotan la versión del estándar con la que se hicieron; los anteriores a un cambio quedan marcados como desactualizados.
4. **Impacto: informar y ofrecer.** Tras el cambio, ux-kit lista qué apps o pantallas quedaron desalineadas y ofrece crear las tareas con la integración activa (ítems de backlog con `ux-scrum`, un change con `ux-openspec`) o corregir directamente.
5. **Detección inversa.** Si `ux-check` ve que el código usa de forma sistemática un valor que no está en el estándar (un color o tamaño nuevo repetido en varias pantallas), no lo trata como error sin más: pregunta si el estándar cambió y ofrece actualizarlo o corregir el código.

## 5. Distribución e instalación

Modelo tomado de OpenSpec: CLI propia + skills generadas por agente, con perfiles.

### 5.1 CLI npm (camino principal, desde v0.3)
```bash
npm install -g ux-kit           # o: npx ux-kit <comando>
ux-kit init                     # agentes · integraciones · nuevo/existente · perfil
ux-kit update                   # actualiza skills y .ux/knowledge sin tocar .ux/standard ni config
ux-kit check [ruta]             # escaneo rápido en terminal o CI
ux-kit profile core|expanded    # cambia el perfil y regenera skills
```

### 5.2 Skills directas (camino alternativo, desde v0.1)
```bash
npx skills add <usuario>/ux-kit                  # selector interactivo
npx skills add <usuario>/ux-kit --skill ux-check # una sola
```
Luego, dentro del agente, `ux-init` crea `.ux/`. La CLI `skills` (skills.sh) detecta los agentes e instala en:

| Agente | Carpeta del proyecto |
|---|---|
| Claude Code | `.claude/skills/` |
| Codex, OpenCode, Cursor, GitHub Copilot, Gemini CLI | `.agents/skills/` |

### 5.3 Perfiles
| Perfil | Skills |
|---|---|
| **core** (por defecto) | `ux-laws` · `ux-guide` · `ux-init` · `ux-discover` · `ux-plan-review` · `ux-check` |
| **expanded** | core + `ux-check-ux` · `ux-check-ui` · `ux-check-design` · `ux-check-a11y` · `ux-audit` · `ux-retro` |
| **integraciones** (se eligen aparte) | `ux-openspec` · `ux-scrum` · `ux-log` |

Cada agente invoca las skills a su manera (`/ux-check` en Claude Code, `$ux-check` en Codex, etc.).

### 5.4 Regla técnica
Las skills se instalan por separado, así que **ninguna skill depende de archivos de otra**. El conocimiento y los scripts compartidos se copian a `.ux/knowledge/` y `.ux/scripts/` con `ux-init` (desde `skills/ux-init/assets/`); las demás skills los usan desde ahí. Si `.ux/` no existe, cada skill funciona con lo mínimo que trae y sugiere `ux-init`.

## 6. Skills

| Skill | Perfil | Se activa | Lee | Produce |
|---|---|---|---|---|
| `ux-laws` | core | Sola, siempre que se diseña, construye o revisa UI | Sus propias referencias (`references/`); `.ux/config.yaml` si existe | Declaración de leyes antes de codear; checklist ✅/❌/⚠️ antes de entregar |
| `ux-guide` | core | Sola, cuando el agente planifica o construye UI | `.ux/config.yaml`, `standard/`, `knowledge/` | Puntos UX a considerar en el plan; aplicación del estándar al construir |
| `ux-init` | core | Manual (primera vez; repetirlo sincroniza) | Código del proyecto | `.ux/` completo; en proyectos existentes, `tokens.json` extraído; en monorepos, la sección `apps` |
| `ux-discover` | core | Manual (crear o actualizar por partes) | Conversación, código, web (si el agente puede buscar) | `standard/users.md`, `references.md`, `user-questions.md`, `brand.md`, `tokens.json`; entrada en `CHANGELOG.md` y análisis de impacto al actualizar |
| `ux-plan-review` | core | Manual (antes de aprobar un plan) | El plan del agente en cualquier formato (change de OpenSpec, modo plan, `TASKS.md`, texto) | Lista de lo que falta y pregunta si corregir el plan |
| `ux-check` | core | Al terminar un cambio (manual o por instrucción de `ux-guide`) | Archivos visuales nuevos/modificados (diff de git), cualquier lenguaje | Reporte corto en `.ux/reports/` |
| `ux-check-ux` | expanded | Manual | Flujos, pantallas, capturas | Usabilidad: Nielsen, leyes UX, estados, formularios, textos, patrones oscuros |
| `ux-check-ui` | expanded | Manual | Código + render (si hay) | Implementación: tokens, tamaños, foco, semántica, estados, responsive, rendimiento |
| `ux-check-design` | expanded | Manual | Capturas, URL, código, tokens | Visual: jerarquía, tipografía, color, espaciado, coherencia, plataforma |
| `ux-check-a11y` | expanded | Manual | Código + render | WCAG 2.2 criterio por criterio |
| `ux-audit` | expanded | Manual (adopción y periódica) | Todo el producto | Línea base completa con puntuación por área y deuda UX |
| `ux-retro` | expanded | Manual (cierre de ciclo) | `.ux/reports/` del período | Resumen de deuda UX y propuestas de ítems |
| `ux-openspec` | integración | Manual (una vez) | `openspec/config.yaml` | Reglas UX en `context`/`rules` de OpenSpec |
| `ux-scrum` | integración | Manual | Reportes y backlog | Criterios UX en HU; hallazgos convertidos en ítems |
| `ux-log` | integración | Tras cada skill de ux-kit | Resultado de la skill | Entrada en la bitácora configurada |

**Revisión automática al terminar un cambio:** no todos los agentes permiten ganchos automáticos. Por eso `ux-guide` instruye al agente a ejecutar `ux-check` al terminar una implementación de UI cuando `check.after_change: true`. Donde el agente sí permita ganchos, la integración puede documentarse aparte.

## 7. Estructura de `.ux/` en el proyecto

```
.ux/
├── config.yaml        configuración del proyecto (ver ejemplo)
├── standard/          ← lo genera y mantiene ux-discover (el equipo lo edita)
│   ├── users.md        perfiles, contexto de uso, tareas frecuentes
│   ├── references.md      análisis de apps parecidas: qué tomar, qué evitar
│   ├── user-questions.md       guion para entrevistar a usuarios reales
│   ├── brand.md           logo, voz, uso de marca
│   ├── tokens.json        colores, tipografía, espaciado (formato DTCG 2025.10)
│   └── CHANGELOG.md       versión del estándar y por qué cambió cada vez
├── knowledge/         ← copiado por ux-kit; no se edita; ux-init (repetido) o ux-kit update lo renueva
├── scripts/           ← scripts Node copiados por ux-init (detect, scan, contrast, tokens, render)
└── reports/           resultados de check, audit y retro, fechados
```

### Ejemplo de `config.yaml`
```yaml
version: 1
project:
  name: tenant-hub
  type: existing            # new | existing
platforms: [web, android]   # por defecto para todas las apps: web | android | ios | macos | windows | linux | tv | watch
apps:                       # hechos detectados del código: se sincronizan solos (§4)
  - name: backoffice
    path: apps/backoffice
    stack: astro + tailwind  # antes laravel-blade; actualizado automáticamente
    platforms: [web]
    theme: apps/backoffice/src/styles/theme.css
  - name: campo
    path: apps/campo-android
    stack: jetpack-compose
    platforms: [android]
    theme: apps/campo-android/app/src/main/java/.../Theme.kt
    users: [operador-almacen] # perfiles de standard/users.md (decisión: se pregunta)
  - name: admin
    path: apps/admin
    stack: angular + angular-material
    platforms: [web]
    overrides:               # solo para esta app (decisión: se pregunta)
      accessibility: { level: AAA }
accessibility:
  standard: wcag-2.2
  level: AA                 # A | AA | AAA (la base fija nunca baja de A/AA críticos, ver §9)
severity:                   # solo reglas configurables; la base fija no se puede bajar
  touch-target-platform: major
  literal-design-values: minor
  missing-empty-state: major
check:
  after_change: true
  include: ["src/**", "app/**", "resources/views/**"]
  exclude: ["**/*.test.*", "**/generated/**"]
exceptions:                 # decisiones aprobadas por el equipo
  - rule: form-length
    where: "Formulario de ingreso de almacén"
    reason: "Uso diario por expertos; una sola página"
    date: 2026-11-09
integrations:
  openspec: { enabled: true }
  scrum: { enabled: true, backlog: docs/backlog.md }
  log: { enabled: true, path: docs/auditoria-ia/bitacora.md }
```

## 8. Base de conocimiento (`knowledge/`)

| Archivo | Contenido |
|---|---|
| `laws-of-ux.md` | Las leyes de lawsofux.com que no están en `ux-laws`: qué dicen, cómo aplicarlas, cómo auditarlas, malos usos |
| `myths.md` | Mitos y malas aplicaciones ("3 clics", "la gente no hace scroll"…); aclara que los límites de `ux-laws` son estándar del equipo |
| `nielsen-heuristics.md` | 10 heurísticas con preguntas de evaluación |
| `accessibility.md` | WCAG 2.2 A/AA por principio, criterios nuevos de 2.2, APIs por plataforma, estado de WCAG 3 y APCA, normativa |
| `platforms.md` | Material 3 / Expressive, Apple HIG / Liquid Glass, Fluent 2, web, escritorio multiplataforma |
| `visual-system.md` | Tokens DTCG, color, tipografía, espaciado, forma, iconos, motion, modo oscuro |
| `states-and-components.md` | Matriz de estados y checklist por componente |
| `forms-and-content.md` | Formularios, validación, errores, microcopy, i18n |
| `performance.md` | Umbrales de respuesta, Core Web Vitals, móvil y escritorio, rendimiento percibido |
| `data-visualization.md` | Elección de gráficos, accesibilidad de gráficos, dashboards |
| `dark-patterns.md` | Patrones engañosos y alternativas honestas |
| `stacks/*.md` | Cómo verificar cada regla por tecnología (una guía por stack, ampliable por la comunidad) |

Regla para contribuciones: toda afirmación normativa o numérica cita su fuente.

## 9. Severidad: base fija + configurable

Niveles: **bloqueante · mayor · menor · sugerencia** (+ *no verificable*).

**Base fija** (ningún proyecto la puede bajar):
- Fallos de WCAG nivel A y AA con impacto real (sin nombre accesible, contraste insuficiente, foco eliminado, objetivo < 24px, zoom bloqueado…).
- Patrones oscuros confirmados.
- Riesgo de pérdida de datos del usuario (acción destructiva sin confirmación ni deshacer, formulario que se vacía tras un error).

**Configurable en `config.yaml`**: todo lo demás (tamaños táctiles de plataforma, uso de tokens, estados vacíos, convenciones de plataforma, microcopy…), con valores por defecto razonables. Las reglas de `ux-laws` (Fitts y Hick) son bloqueantes por defecto; Jakob, Miller, apogeo y final y estética-usabilidad, sugerencias.

**Veredicto de cada revisión**: no apto (≥1 bloqueante) · apto con observaciones (≥1 mayor) · apto. Un bloqueante significa que el cambio no está terminado: el agente lo corrige antes de entregarlo, salvo que el equipo haya bajado la regla o aprobado una excepción (principio 6).

## 10. Scripts (Node.js)

En v0.1 viven en `skills/ux-init/assets/scripts/`, se copian a `.ux/scripts/` y se ejecutan con `node .ux/scripts/<script>.mjs`. Desde v0.3 también se publican en el paquete npm `ux-kit` (`npx ux-kit …`) para la terminal y CI.

| Comando | Qué hace |
|---|---|
| `ux-kit detect` | Detecta stack, plataformas, librerías UI y archivos de tema |
| `ux-kit scan <ruta>` | Escaneo estático por patrones en los stacks comunes; resultados como candidatos a confirmar |
| `ux-kit render <url\|html>` | Con Playwright: tamaños reales, contraste computado, foco con Tab, reflow a 320px, CLS, capturas, axe-core si está disponible |
| `ux-kit contrast <fg> <bg>` | Contraste WCAG 2.x (hex, rgb, hsl, oklch, `0xAARRGGBB`) |
| `ux-kit tokens <tokens.json>` | Valida tokens DTCG: alias, escalas, pares de contraste claro/oscuro |
| `ux-kit check [ruta]` | Combina lo anterior sobre los archivos cambiados (para CI) |

Límite declarado: los scripts no cubren todos los lenguajes. Para lo que no cubren (Java Swing, C#, C++/Qt, etc.), la revisión la hace el agente leyendo el código con las guías de `knowledge/stacks/`.

## 11. Estructura del repositorio

```
ux-kit/
├── README.md · README.es.md · LICENSE (MIT) · CONTRIBUTING.md · CHANGELOG.md
├── docs/
│   ├── DESIGN.md                (este documento)
│   └── agents.md                instalación por agente
├── skills/                      fuente única; la usan npx skills add y la CLI
│   ├── ux-guide/  ux-init/  ux-discover/  ux-plan-review/  ux-check/
│   ├── ux-check-ux/  ux-check-ui/  ux-check-design/  ux-check-a11y/
│   ├── ux-audit/  ux-retro/
│   └── ux-openspec/  ux-scrum/  ux-log/
├── knowledge/                   se copia a .ux/knowledge/
├── templates/                   plantillas de .ux/ y de reportes
├── packages/cli/                paquete npm ux-kit (desde v0.3)
└── tests/fixtures/              proyectos de prueba con errores sembrados por stack
```

## 12. Fases

| Versión | Contenido | Instalación |
|---|---|---|
| **v0.1** | Skills core, `knowledge/`, plantillas de `.ux/`, scripts dentro de las skills | `npx skills add` |
| **v0.2** | `ux-laws`: las 6 leyes UX con referencias a fondo, checklist y reglas bloqueantes configurables | `npx skills add` |
| **v0.3** | CLI npm (`init`, `update`, `check`, `profile`), perfil expanded | `npm i -g ux-kit` o `npx` |
| **v0.4** | Integraciones (`ux-openspec`, `ux-scrum`, `ux-log`), GitHub Action para CI | ambas |

## 13. Cómo contribuir (resumen)

- **Nuevo stack**: una guía en `knowledge/stacks/` + reglas del escáner + un proyecto de prueba en `tests/fixtures/`.
- **Nueva integración**: una skill `ux-<herramienta>` que no modifique el núcleo.
- **Conocimiento**: cambios con fuente citada.
- **Skills**: solo campos portables del estándar `SKILL.md`; probadas en al menos dos agentes.

## 14. Preguntas abiertas

1. **Descubrimiento sin búsqueda web**: si el agente no puede buscar en internet, ¿`references.md` se arma con lo que el usuario aporte (capturas, links) o se omite?
2. **Proyectos sin git**: `ux-check` usa el diff para saber qué cambió. Sin git, ¿se revisan los archivos modificados recientemente o se pide la lista?
3. **Idioma de los reportes**: ¿el idioma de la conversación o uno configurado en `config.yaml`?
4. **Nombre en npm**: verificar que `ux-kit` está libre; si no, buscar alternativa.
5. **Organización en GitHub**: ¿repo bajo tu usuario personal o bajo una organización?

## 15. Material existente reutilizable

El borrador anterior (`ux-spec`) ya tiene contenido que se puede traducir y reorganizar en `knowledge/` (leyes, mitos, Nielsen, WCAG 2.2, plataformas, sistema visual, estados, formularios, rendimiento, gráficos, patrones oscuros, guías por stack). También tiene prototipos de scripts en Python (detección, escaneo, render, contraste, tokens), probados sobre un proyecto con errores sembrados. Esos scripts se reescribirían en Node.

## 16. Notas de implementación v0.1
- Nombres de archivo del estándar en inglés (`users.md`, `references.md`, `user-questions.md`, `brand.md`); su contenido se escribe en `config.yaml → project.language`.
- Valores por defecto para las preguntas abiertas de §14: sin búsqueda web, `references.md` se arma con links o capturas del usuario; sin git, se pide la lista de archivos; reportes en el idioma del proyecto; nombre npm y organización de GitHub se definen al publicar.
- `ux-audit` llega en v0.3; mientras tanto, la línea base de un proyecto existente es `ux-check` sobre todo el proyecto.

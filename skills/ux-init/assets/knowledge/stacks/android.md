# Android (Jetpack Compose, Views/XML, Compose Multiplatform)

## Jetpack Compose
| Rule | Look for |
|---|---|
| Touch target | `Modifier.size(x.dp)` with x < 48 on `clickable`/custom buttons without `minimumInteractiveComponentSize()`; `LocalMinimumInteractiveComponentSize provides 0.dp` (or legacy `LocalMinimumInteractiveComponentEnforcement provides false`) disables the minimum |
| Name | `Icon(…, contentDescription = null)` inside an `IconButton` or clickable without text; informative `Image` with `null` |
| Role | `Modifier.clickable {}` without `role = Role.Button` / `onClickLabel` on custom elements |
| Text | `fontSize = x.dp` (must be `sp`); literal sizes instead of `MaterialTheme.typography.*` |
| Color | `Color(0xFF…)` in composables instead of `MaterialTheme.colorScheme.*` |
| States | `collectAsState`/`LaunchedEffect` without loading/error/empty branches |
| Insets | `enableEdgeToEdge()` + `safeDrawingPadding()`/`windowInsetsPadding` |
| Theme | `MaterialTheme(colorScheme = …, typography = …, shapes = …)`; dynamic color; dark scheme |
| Testing | `assertHasClickAction()`, `assertHeightIsAtLeast(48.dp)`; `enableAccessibilityChecks()` |

## Views / XML
- Clickable views with `layout_width/height` < 48dp; `ImageButton`/clickable `ImageView` without `contentDescription`; `textSize` in `dp`/`px` instead of `sp`; literal colors in layouts instead of `@color`/`?attr/colorPrimary`.
- Lint: `ContentDescription`, `SpUsage`; Accessibility Scanner for touch targets and contrast.

# Cross-platform mobile (Flutter, React Native/Expo, .NET MAUI)

## Flutter
| Rule | Look for |
|---|---|
| Size | `MaterialTapTargetSize.shrinkWrap`; `GestureDetector`/`InkWell` in `SizedBox` < 48; `IconButton` with `constraints: BoxConstraints()` and zero padding |
| Name | `IconButton` without `tooltip`; `Image` without `semanticLabel`; `GestureDetector` without `Semantics` |
| Text | `TextScaler.noScaling` / `textScaleFactor: 1` forced → blocks system font scale |
| Color | `Color(0xFF…)` in widgets instead of `Theme.of(context).colorScheme` |
| Theme | `ColorScheme.fromSeed`, `darkTheme`, Material 3 default since 3.16 |
| Platform | `.adaptive` widgets (`Switch.adaptive`) to respect iOS |
| Testing | `meetsGuideline(androidTapTargetGuideline / iOSTapTargetGuideline / textContrastGuideline / labeledTapTargetGuideline)` |

## React Native / Expo
- `Pressable`/`Touchable*` with width/height < 44/48 and no `hitSlop`; `accessibilityRole`, `accessibilityLabel`, `accessibilityState`; `allowFontScaling={false}` blocks text scaling; `Platform.OS` for navigation differences; React Navigation keeps native gestures.

## .NET MAUI
- `MinimumHeightRequest`/`MinimumWidthRequest` < 44/48; `SemanticProperties.Description`/`Hint`; fixed `FontSize` vs styles; `AppThemeBinding` for light/dark; literal colors vs resource dictionaries.

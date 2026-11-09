# Apple platforms (SwiftUI, UIKit, AppKit)

## SwiftUI
| Rule | Look for |
|---|---|
| Size | `.frame(width: <44, height: <44)` on `Button`/`onTapGesture` without `.contentShape(Rectangle())` and padding |
| Tap on non-button | `.onTapGesture` on `Text`/`Image`/stacks instead of `Button` (no button trait) — use `Button` or `.accessibilityAddTraits(.isButton)` |
| Name | `Image(systemName:)` buttons without `Label` or `.accessibilityLabel` |
| Text | `.font(.system(size: 14))` fixed → text styles (`.body`) or `relativeTo:` for Dynamic Type |
| Color | `Color(red:green:blue:)`/hex in views instead of Asset Catalog or semantic colors (`.primary`, `Color(.systemBackground)`) |
| Motion / materials | `@Environment(\.accessibilityReduceMotion)` and `\.accessibilityReduceTransparency` honored |
| Liquid Glass | `.glassEffect()` / materials over variable content without fallback; text over materials with unverified contrast |
| Testing | `XCUIApplication().performAccessibilityAudit()` (Xcode 15+) |

## UIKit
- `UIButton` frames < 44pt; `isAccessibilityElement`/`accessibilityLabel` on custom cells; `adjustsFontForContentSizeCategory = true` + `UIFont.preferredFont(forTextStyle:)`.

## AppKit (macOS)
- Menu bar commands with key equivalents; `NSAccessibility` labels on custom views; full keyboard access; respect system appearance and accent color.

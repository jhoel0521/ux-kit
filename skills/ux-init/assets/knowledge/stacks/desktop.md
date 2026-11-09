# Desktop stacks

## Web-based (Tauri, Electron)
- All web rules, plus: Ctrl/Cmd shortcuts; native app menu (Tauri `Menu`, Electron `Menu.buildFromTemplate`) with accelerators; custom title bars keep a drag region (`data-tauri-drag-region`, `-webkit-app-region: drag`) without covering controls; OS theme (`prefers-color-scheme`); native file dialogs; minimum window size.

## WinUI 3 / WPF (C#)
- `AutomationProperties.Name` on icon-only buttons; `MinHeight/MinWidth` (≥ 40 for touch, ≥ 24 pointer); `ThemeResource` instead of literal brushes; text styles (`BodyTextBlockStyle`) instead of fixed `FontSize`; `ContentDialog` with `DefaultButton`; keyboard accelerators (`KeyboardAccelerator`); high-contrast themes.
- Tool: Accessibility Insights for Windows.

## Java Swing / JavaFX
- Swing: `getAccessibleContext().setAccessibleName(...)` on icon buttons; `setMnemonic` / key bindings; `setToolTipText`; look-and-feel colors (`UIManager`) instead of literal `new Color(...)` scattered in panels; focus traversal policy; font sizes derived from L&F, not fixed.
- JavaFX: `setAccessibleText`, `setAccessibleRole`; CSS stylesheets with variables (`-fx-base`, looked-up colors) instead of inline styles; `setMnemonicParsing`; `KeyCombination` accelerators; minimum control sizes.

## Qt / QML (C++, Python)
- QML: `Accessible.name`, `Accessible.role` on `MouseArea`/`TapHandler` custom controls; `implicitHeight` ≥ 24 (40 touch); `font.pointSize` instead of fixed `pixelSize`; Material/Universal styles or a central theme singleton instead of literal colors.
- Widgets (C++): `setAccessibleName`, `setShortcut`, `QPalette` from the theme; `QStyle` sizes.

## GTK
- `gtk_accessible_update_property` / ATK names; `GtkShortcutController`; CSS theming with named colors; respect system text scaling and dark preference.

## Common desktop expectations
Right-click context menus, shortcuts with tooltips showing them, resizable and remembered windows, drag-and-drop with a "Browse" alternative, OS-specific dialog button order (see `../platforms.md` §6–7).

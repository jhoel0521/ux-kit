# Jakob's law — Suggestion (rule id `jakob-conventions`)

## Statement

Users spend most of their time on **other sites**. So they expect your site to work the same way as all the others they already know.

Formulated by Jakob Nielsen (co-founder of the Nielsen Norman Group with Donald A. Norman).

## Core idea

Users bring **mental models** already formed. Fighting them to be "original" costs learning time, frustration and abandonment.

> When you invent a new pattern, you are asking users to learn something just to use your product. If there is no clear benefit, don't.

## How to apply it

### 1. Use conventional icons

| Concept | Universal icon |
|---|---|
| Menu | ☰ (hamburger) |
| Search | 🔍 (magnifier) |
| Settings | ⚙ (gear) |
| User / Profile | 👤 (silhouette) |
| Messages | ✉ (envelope) |
| Notifications | 🔔 (bell) |
| Cart | 🛒 |
| Close | ✕ |
| Back | ← |
| Share | (the OS share icon) |
| Favorites | ★ / ♥ |
| Delete | 🗑 |
| Edit | ✎ (pencil) |

If an icon is ambiguous, **always add a text label**.

### 2. Respect platform conventions

- **iOS**: bottom tab navigation, back in the top-left corner, modals sliding up from the bottom.
- **Android (Material)**: FAB for the main action, drawer/bottom navigation, physical/gesture back.
- **Desktop web**: logo top-left goes home, horizontal top menu, footer with legal info and secondary links.

### 3. Expected interaction patterns

| Pattern | Convention |
|---|---|
| Login | Email + password + "forgot password" + social option |
| Search | Bar with a magnifier, results below, filters on the left or on top |
| Lists | Pull-to-refresh on mobile, pagination or infinite scroll on web |
| Form errors | Red message under the affected field |
| Destructive confirmation | Modal with a red button + cancel |
| Toast | Appears at the top or bottom for a few seconds, then goes away |

### 4. Consistent terminology

Use the terms people already know:

- "Cart" (not "Acquisition basket")
- "Log in" / "Sign in" (not "Authenticate")
- "Log out" / "Sign out" (not "Disconnect session")
- "Account" (not "Identity profile")

### 5. When you introduce big changes

If you redesign something familiar:

- Keep a **temporary legacy mode** during the migration.
- **Announce the change**: a "what changed" tooltip the first time.
- Change **one thing at a time**, not everything at once.

## When breaking the convention IS worth it

Only if the new pattern:

1. Solves a real problem the standard pattern doesn't.
2. Is **self-evident** (users understand it without instructions).
3. The benefit justifies the learning cost.

Valid example: Gmail introduced "archive" (not "delete") when everyone expected delete. It worked because it solved a real problem (not losing emails) and the button was clearly labeled.

## Example: Android radio apps

Radio apps imitate the physical panels of hi-fi systems (circular dial, large frequency, presets). This **directly exploits the mental model** users already have of a physical radio, without them having to learn anything new.

## Frequent errors

1. **Inventing new icons** for actions that already have a universal icon.
2. **Moving the logo to the center or the right**, breaking the "logo top-left = home" expectation.
3. **Using internal corporate terminology** users don't understand.
4. **Close button in an unexpected position** (expected: top-right corner on desktop; top-left or top-right on mobile depending on the platform).
5. **Radical UI change without a transition**, breaking every expectation at once.

## Jakob checklist

```
[ ] Icons follow universal conventions (or have a label)
[ ] Platform conventions respected (iOS / Android / Web)
[ ] Terminology familiar to the user, not internal jargon
[ ] Standard interaction patterns (login, search, errors, etc.)
[ ] If I break a convention, there is a clear benefit and it is self-evident
[ ] Big changes come with communication / a transition
```

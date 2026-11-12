# Aesthetic-usability effect — Suggestion (rule ids `type-levels`, `spacing-scale`, `aesthetic-consistency`)

## Statement

Users perceive **aesthetically attractive** products as easier to use, **regardless of their real usability**. Visual beauty creates trust, tolerance for errors and a positive perception.

> When something looks good, users assume it is well made.

## What the research says

Three derived principles:

### 1. Beauty increases tolerance for errors

A beautiful product gets more patience when something fails. Users assume "it's a minor detail" and keep going. An ugly product with the same error gets abandoned quickly.

This is called the **aesthetic bias**: the brain associates beauty with competence.

### 2. Visual design influences perceived usability

An aesthetically coherent system:

- Conveys **order** → users assume the logic is ordered too.
- Conveys **professionalism** → creates the confidence to explore.
- Reduces **cognitive anxiety** → users explore with less fear.

### 3. Balance between form and function

Aesthetics do NOT replace usability. A beautiful design with broken UX:

- Creates **greater frustration** (users expected more from the visual promise).
- Damages **trust** in the long term (a feeling of "deception").

Excellence comes when **form + function work together**.

## How to apply it

### 1. Clear typographic system (rule id `type-levels`)

- **At most 2–3 font families** (ideally 1 + 1 monospace if needed).
- **Consistent type scale**: use predictable steps (12, 14, 16, 20, 24, 32, 48...).
- **Visual hierarchy with at most 3–4 active levels** on a screen. Team rule (`type-levels`): at most 4 type sizes per screen — 3 hierarchy levels (heading, subheading, body) plus one small size for labels.
- **Generous line height**: 1.4–1.6 for long text, 1.2 for headings.

### 2. Spacing system (rule id `spacing-scale`)

Use a consistent scale **based on multiples of 4 or 8**:

```
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px
```

Don't use arbitrary 13px, 17px, 23px. Consistency is perceived even if users don't analyze it.

### 3. Limited color palette (rule id `aesthetic-consistency`)

- **1–2 primary colors** (brand + action).
- **A full gray scale** (5–9 shades).
- **Semantic colors**: success (green), error (red), warning (yellow), info (blue).
- **Minimum WCAG AA contrast**: 4.5:1 for normal text, 3:1 for large text.

### 4. Component consistency

The same element must look the same across the app:

- Primary buttons: same color, same padding, same radius.
- Inputs: same height, same border, same focus state.
- Cards: same shadow, same padding, same radius.

Use **design tokens** (CSS variables, Tailwind theme, design system) to enforce consistency.

### 5. Details that multiply perception

- **Consistent border radius** (all `rounded-lg` or all `rounded-md`, don't mix).
- **Soft, consistent shadows** (don't invent 5 different shadows).
- **Icons from the same set** (all lucide, all material, don't mix).
- **Subtle animations** in transitions (200–300ms with ease).
- **Hover/focus/active states** defined for everything interactive.

## In code (React + Tailwind)

```tsx
// ❌ WRONG — inconsistent buttons
<button className="px-3 py-1 bg-blue-500 rounded">Save</button>
<button className="px-5 py-2 bg-blue-600 rounded-md">Edit</button>
<button className="px-4 py-1.5 bg-blue-400 rounded-lg">Share</button>

// ✅ RIGHT — consistent system
// Defined once in a Button component:
function Button({ variant = "primary", children }) {
  const styles = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-900",
  };
  return (
    <button className={`px-4 h-11 rounded-lg font-medium transition-colors ${styles[variant]}`}>
      {children}
    </button>
  );
}

// Always used the same way:
<Button>Save</Button>
<Button>Edit</Button>
<Button variant="ghost">Share</Button>
```

## What this effect is NOT

- **It's not decorating**: adding gradients, shadows and effects is not "careful aesthetics".
- **It's not extreme minimalism**: empty is not beautiful, clarity is.
- **It's not following trends**: consistent aesthetics outlive fashions.

## Risk: aesthetics that hide problems

If your UI looks good **but**:

- Buttons don't respond (broken micro-interactions).
- Navigation is confusing.
- Content takes time to load without feedback.

...users will notice, and the disappointment will be **greater** because the visual promise was high. Aesthetics create expectations that function must meet.

## Frequent errors

1. **Inconsistent typefaces**: one screen uses Inter, another Roboto, another system-ui.
2. **Mixed border radii**: cards with `rounded-2xl`, buttons with `rounded-sm`.
3. **Bloated palette**: 12 different blues instead of a defined scale.
4. **Icons from different sets**: 3 outline + 2 filled + 1 emoji on the same screen.
5. **Arbitrary spacing**: 13px, 17px, 22px padding with no system.
6. **Missing states**: button without hover, input without visible focus.

## Aesthetic-usability checklist

```
[ ] At most 2–3 font families used in the whole project
[ ] Spacing scale based on consistent multiples (4 or 8)
[ ] Limited, documented color palette
[ ] Consistent border radius on components of the same type
[ ] Icons from a single set
[ ] Hover/focus/active states defined for everything interactive
[ ] Subtle transition animations (200–300ms)
[ ] WCAG AA contrast met
[ ] Reusable components enforcing consistency (no loose styles)
[ ] Function is at the level of form (no beauty with broken UX)
```

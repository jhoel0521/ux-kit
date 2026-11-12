# Fitts's law — BLOCKING

## Statement

The time needed to reach a target with a fast movement is a function of the **target's size** and the **distance to it**. Small or distant targets = more time and more errors.

Formulated by Paul Fitts in 1954 while studying human motor control.

## Mandatory rules to deliver

### 1. Minimum touch target sizes (rule id `touch-target-platform`)

| Context | Minimum size | Recommended |
|---|---|---|
| Mobile (iOS) | 44×44 pt | 48×48 pt |
| Mobile (Android) | 48×48 dp | 56×56 dp |
| Tablet | 44×44 pt | 48×48 pt |
| Desktop (mouse) | 24×24 px | 32×32 px |
| TV / remote control | 64×64 px | 80×80 px |

If a critical button (primary CTA, navigation, "buy", "send", "log out") fails this, **block the delivery**.

### 2. Spacing between targets (rule id `fitts-spacing`)

- At least **8px** between clickable elements on mobile.
- At least **4px** on desktop.
- If two buttons have opposite functions (Accept / Cancel, Delete / Edit), at least **16px** apart.

### 3. Reach zones on mobile (rule id `fitts-reach`)

Split the screen into 3 vertical zones:

```
┌──────────────────┐
│   OUT OF         │  ← Hard with the thumb (one-handed use)
│   REACH          │     Only for passive content / info
├──────────────────┤
│  WITHIN          │  ← Medium reach
│   REACH          │     Secondary CTAs, scrollable content
├──────────────────┤
│ EASILY           │  ← Relaxed thumb
│   REACHABLE      │     Primary CTA, navigation, critical actions
└──────────────────┘
```

Rule: **primary CTAs** and **primary navigation** must be in the bottom third. The top is for titles, information and non-critical elements.

### 4. Corners and edges

- **Screen edges** are infinitely large targets (the cursor/finger can't overshoot them). Use them for global actions on desktop (top menu, dock).
- On **mobile**, avoid critical controls stuck to the top edge: the notch/camera area and the status bar interfere.

## How to validate in code

For React/Tailwind:

```tsx
// ❌ WRONG — 32px button on mobile
<button className="h-8 px-2">Pay</button>

// ✅ RIGHT — 48px minimum button
<button className="h-12 min-w-[44px] px-6">Pay</button>

// ✅ BETTER — critical button full width in the bottom zone
<div className="fixed bottom-0 inset-x-0 p-4">
  <button className="w-full h-14 rounded-xl">Pay</button>
</div>
```

## Frequent errors to detect and fix

1. **16px close icons (X) on mobile** → at least 44×44 with invisible padding if you want the icon small:
   ```tsx
   <button className="p-3"> {/* 44px touch area */}
     <XIcon className="w-5 h-5" /> {/* small visual icon */}
   </button>
   ```
2. **"Accept / Cancel" buttons stuck together** → at least a 16px gap.
3. **Primary CTA at the top of the mobile screen** → move it to the bottom third or use a fixed bottom bar.
4. **Text links one after another on a line** → larger font size or turn them into a list with padding.
5. **Very small table buttons** → on mobile, extend the touch area to the whole row.

## Fitts checklist

```
[ ] All touch targets measure ≥44×44px on mobile / ≥24×24px on desktop
[ ] Spacing ≥8px (mobile) or ≥4px (desktop) between clickable elements
[ ] Primary CTAs in the bottom third on mobile
[ ] Destructive actions ≥16px away from primary actions
[ ] Edges and corners used for global controls on desktop
[ ] Touch area of small icons extended with invisible padding
```

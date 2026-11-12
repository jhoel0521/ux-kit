# Hick's law — BLOCKING

## Statement

The time it takes to make a decision **increases with the number and complexity of the options**. When you bombard users with choices, they have to interpret, compare and decide — cognitive work they don't want to do.

Formulated by William Edmund Hick and Ray Hyman in 1952.

## Mandatory rules to deliver

### 1. At most 7 primary options visible per screen (rule id `hick-options`)

If a screen has more than 7 primary options (action buttons, main menu items, relevant clickable cards) at the same hierarchy level, **stop and regroup**.

Valid grouping strategies:

- **Categorize**: group related items under a category (e.g. "Settings" instead of 12 loose toggles).
- **Prioritize and hide**: show the 3–5 most used, hide the rest behind "More options" or a dropdown.
- **Paginate / tabs**: split into tabs or steps when there are logical groups.

### 2. Complex tasks → split them into steps (rule id `hick-steps`)

Any form with **more than 7 visible fields** must become:

- **Multi-step** (wizard): numbered steps with a progress bar (e.g. 1. Details → 2. Address → 3. Payment).
- **Accordion / collapsible sections**: with clear logical groups.
- **Progressive disclosure**: ask only for the essentials first, the rest later.

Valid example: a sign-up form split into "Login details" / "User profile" / "Finish".

### 3. Primary CTA visually prominent (rule id `primary-action-competition`)

When several actions are available, **one and only one** must be visually dominant:

- Solid color vs ghost/outline for secondary ones.
- Larger size.
- Prominent position.

If every button looks equally important, users hesitate and lose time.

### 4. Progressive onboarding

For new users, **don't show all the complexity at once**. Reveal features gradually:

- First session: only the core flow.
- Later: contextual tooltips as advanced cases appear.

## Beware of over-simplification

Hick **does not mean "hide everything"**. If you abstract too much:

- Users don't find what they need and leave.
- You create more clicks than needed (each hidden level adds a click).

Balance: frequent options reachable in 1 click, rare options in 2–3 clicks at most.

## How to validate in code

```tsx
// ❌ WRONG — 12 actions in a single bar
<Toolbar>
  <Button>Edit</Button>
  <Button>Delete</Button>
  <Button>Duplicate</Button>
  <Button>Export</Button>
  <Button>Share</Button>
  <Button>Print</Button>
  <Button>Archive</Button>
  <Button>Tag</Button>
  {/* ... */}
</Toolbar>

// ✅ RIGHT — 3 primary actions + a menu with the rest
<Toolbar>
  <Button variant="primary">Edit</Button>
  <Button variant="ghost">Share</Button>
  <DropdownMenu>
    <DropdownTrigger>More</DropdownTrigger>
    <DropdownItem>Duplicate</DropdownItem>
    <DropdownItem>Export</DropdownItem>
    <DropdownItem>Print</DropdownItem>
    <DropdownItem>Archive</DropdownItem>
    <DropdownItem className="text-red-500">Delete</DropdownItem>
  </DropdownMenu>
</Toolbar>
```

## Frequent errors to detect and fix

1. **Sign-up form with 15 fields on one page** → 3-step wizard.
2. **Primary navigation with 9 items** → regroup into 5–6 categories, move the rest to submenus or the footer.
3. **Settings page as a wall of toggles** → sections with headings (Account / Privacy / Notifications).
4. **Dashboard with 12 widgets of the same size** → hierarchy: 2–3 large highlighted widgets, the rest in a secondary grid.
5. **Modal with 4 equally prominent buttons** → 1 primary, 1 secondary, the rest as text.

## Hick checklist

```
[ ] ≤7 primary options visible per screen
[ ] Forms with >7 fields split into steps or sections
[ ] Primary CTA visually dominant over secondary ones
[ ] Advanced/rare options hidden behind "More" / context menus
[ ] Primary navigation with ≤7 first-level items
[ ] Onboarding reveals complexity progressively
[ ] No over-simplification: frequent options are ≤1 click away
```

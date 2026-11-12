# Miller's law — Suggestion (rule id `miller-chunks`)

## Statement

Human short-term memory handles **between 5 and 9 items** (7 ± 2) at the same time. Past that limit, users feel overwhelmed and start forgetting.

Formulated by George A. Miller in 1956 in _"The Magical Number Seven, Plus or Minus Two"_.

## Difference from Hick

- **Hick** is about **decision options** (more options = more time).
- **Miller** is about **items to remember/process at the same time** (more items = more cognitive load).

They are often applied together but address different problems.

## How to apply it: chunking

**Chunking** = grouping information into small, meaningful blocks.

### Classic example: numbers

```
❌ 5551234567        (10 loose digits, hard to retain)
✅ 555-123-4567       (3 chunks, easy to retain)

❌ 4532789012345678  (16 card digits)
✅ 4532 7890 1234 5678  (4 chunks of 4)
```

### Practical applications

#### 1. Menus and navigation

Limit primary items to 5–7. If you have more, group them:

```
❌ Products / Services / Solutions / Industries / Cases / Resources / Blog /
   Events / Careers / Investors / Press / Contact

✅ Products | Solutions | Resources | Company | Contact
   (where "Resources" holds Blog/Events/Cases and "Company" holds Careers/Investors/Press)
```

#### 2. Forms

Group related fields into visually separated sections:

```
PERSONAL INFORMATION
- First name
- Last name
- Date of birth

ADDRESS
- Street
- City
- Country

CONTACT
- Email
- Phone
```

Instead of 8 fields in a flat list, there are 3 chunks of 3 fields. The brain rests.

#### 3. Long lists

When you show long lists (products, inventory items), use:

- **Categories** with clear visual headings.
- **Separators** every 5–7 items.
- **Search and filters** so users don't have to keep everything in memory.

#### 4. Numeric data / codes

| Type | Wrong | Right |
|---|---|---|
| Phone | 5551234567 | 555-123-4567 |
| Card | 4532789012345678 | 4532 7890 1234 5678 |
| IBAN | ES7621001234567890123456 | ES76 2100 1234 5678 9012 3456 |
| Verification code | 482917 | 482-917 or 4 8 2 9 1 7 |

#### 5. Visual hierarchy

Use visual weight to reduce what users need to "hold":

- The important: large size, solid color.
- The secondary: smaller size, muted color.
- The tertiary: smaller still, light gray.

Users process the large things first, **discard** the rest from active memory and recall it only if needed.

## How to apply it in code

```tsx
// ❌ WRONG — 12 fields in a flat list
<form>
  <input name="firstName" />
  <input name="lastName" />
  <input name="birthDate" />
  <input name="email" />
  <input name="phone" />
  <input name="street" />
  <input name="city" />
  {/* ... 5 more ... */}
</form>

// ✅ RIGHT — grouped into semantic chunks
<form>
  <fieldset>
    <legend>Personal details</legend>
    <input name="firstName" />
    <input name="lastName" />
    <input name="birthDate" />
  </fieldset>

  <fieldset>
    <legend>Contact</legend>
    <input name="email" />
    <input name="phone" />
  </fieldset>

  <fieldset>
    <legend>Address</legend>
    <input name="street" />
    <input name="city" />
    <input name="zip" />
  </fieldset>
</form>
```

## Cognitive load in general

When a screen has many simultaneous decisions:

1. **Split into steps** (related to Hick).
2. **Remind users what they already did** (don't make them retain it: "Step 2 of 5 — Personal details").
3. **Show only what they need now**, hide the rest.

## Frequent errors

1. **Showing long numbers without formatting** (codes, IDs, phones).
2. **Lists of more than 10 items without separators or search**.
3. **Flat forms without sections** when there are more than 7 fields.
4. **Showing users the whole app state at once** instead of only what is relevant to their current task.
5. **Error messages listing 5+ problems at once** → solve them one at a time.

## Miller checklist

```
[ ] Menus / lists with >7 items are grouped into recognizable chunks
[ ] Long forms split into thematic sections (fieldsets/groups)
[ ] Long numeric data formatted with separators
[ ] Visual hierarchy reduces what users must actively retain
[ ] Numbered steps in multi-step flows ("Step 2 of 5")
[ ] Users are not asked to remember information from previous screens
```

# Forms, validation, microcopy, i18n

## 1. Forms
Every field has a cost. Remove first, then simplify, then group, and only at the end split into steps.
1. **Remove**: can it be inferred, asked later, or not asked?
2. **One column** in general (faster to complete and scan). Exception: short related fields (city + postcode, month + year).
3. **Labels above** fields (scanning, mobile, translation). Left labels only for dense desktop data forms with short labels.
4. **Group** into titled sections (`fieldset` + `legend`).
5. **Required vs optional**: mark the minority.
6. **Field width** proportional to expected content.
7. **Steps** only for dependencies, long tasks worth saving midway, or natural stages — with "Step 2 of 3", step titles, Back without data loss, final review.
8. **Smart defaults**; remember previous values.
9. **Never ask twice** (WCAG 3.3.7): "Same as shipping address".
10. **Allow paste** everywhere, including passwords and codes (WCAG 3.3.8). Show/hide password; password managers and passkeys; OTP with `autocomplete="one-time-code"` in one field.
11. **Submit button** describes the action ("Create account"), stays enabled, validates on press.

## 2. Validation and errors
- **When**: on blur and on submit. Not from the first keystroke. Live positive feedback only where it helps (password rules, username availability).
- **Where**: below the field, plus a **summary at the top** linking to each error on long forms; focus to first error or summary.
- **How**: text + icon + border (not just red). `aria-invalid` + `aria-describedby`; announce natively.
- **What to say**: what happened and how to fix it, plainly, without blame.
  - ❌ "Invalid input" · ✅ "Tax ID must have 7 to 12 digits"
  - ❌ "Error 422" · ✅ "We couldn't save because the code already exists. Use another code or edit the existing product."
- **Keep data** after any error, including server errors.
- **Tolerance** (Postel): accept spaces, dashes, case, common formats; normalize.
- **Server/network errors** are distinct from validation errors; offer retry; never lose work.

## 3. Microcopy
- Clarity over cleverness; user vocabulary; short sentences; active voice.
- Buttons: verb + object. Dialog button repeats the title's action ("Delete 3 products?" → "Delete" / "Cancel").
- Terminology consistency: keep a glossary in `.ux/standard/` (e.g. always "Receipt", never "Entry"/"Reception" for the same thing).
- Tone per brand, but empathetic and direct in errors; no jokes around losses.
- Relative dates ("5 min ago") with absolute date on hover/title.
- Sentence case in Spanish and most languages (avoid English Title Case habits).
- Empty states, errors and success messages are product content — write them, don't leave them to the backend.

## 4. Internationalization and localization
- Externalized strings from day one; plural-aware templates (ICU MessageFormat).
- Expansion: Spanish ≈ 20–30% longer than English; German more. Test with long strings.
- Formats via platform APIs (`Intl.*`, `java.text`, `FormatStyle`). Example es-BO: dd/mm/yyyy, decimal comma, dot thousands, "Bs" (BOB).
- Time zones: store UTC, show user's zone, state the zone on sensitive data.
- RTL when applicable: logical CSS properties, `start/end` in Compose/SwiftUI, mirrored directional icons.
- Names and addresses: don't assume first + last name; accept accents, ñ, apostrophes, hyphens.
- Correct `lang` so screen readers pronounce correctly.

# Nielsen's 10 usability heuristics — evaluation guide

Jakob Nielsen (1994; reaffirmed by NN/g 2020/2024). For each: audit questions and typical failures. Grade with `severity.md`.

**H1. Visibility of system status.** Does every action respond visibly in < 100 ms and show a result or indicator in < 1 s? Is the current location visible (active nav, breadcrumbs, title, step X of Y)? Is saved vs unsaved clear? Do long loads show progress; is pending offline sync visible? *Typical:* button doesn't change after tap (double submit), indistinguishable active tab, upload without progress.

**H2. Match between system and the real world.** User vocabulary, not system/database jargon ("Error 500", "null", "record_id")? Icons and metaphors that fit the user's culture? Local formats (date, decimal separator, currency)? *Typical:* raw backend errors, fields named after DB columns.

**H3. User control and freedom.** Undo/redo? Cancel multi-step flows without losing data? Close dialogs with X, Esc and (if no data at risk) outside tap? Does system back behave as expected (Android back, iOS swipe, browser history)? Can long operations be cancelled? *Typical:* wizard without Back, deletion without undo, SPA breaking the back button.

**H4. Consistency and standards.** Same action, same name and look everywhere? Platform conventions followed (`platforms.md`)? Button positions consistent? *Typical:* "Save"/"OK"/"Confirm" for the same thing; three primary button styles.

**H5. Error prevention.** Input constraints (date pickers, tolerant masks, right keyboard)? Confirmation or undo for destructive actions? Safe defaults? Dangerous actions far from frequent ones? *Typical:* "Delete" next to "Edit" with the same style.

**H6. Recognition rather than recall.** Options visible or easily retrievable? Recents, favorites, autocomplete? Previous-step data shown when needed (WCAG 3.3.7)? Persistent labels? *Typical:* asking for a product code from memory.

**H7. Flexibility and efficiency of use.** Keyboard shortcuts on heavy-use desktop/web? Bulk actions in tables? Global search? Saved filters/views? *Typical:* back-office tools needing 5 clicks per record with no bulk edit.

**H8. Aesthetic and minimalist design.** Elements that don't support the main task? Clear hierarchy with one primary action? *Typical:* dashboards with 20 equally sized KPIs.

**H9. Help users recognize, diagnose and recover from errors.** Plain message saying what happened, why and how to fix it? Next to the affected field, announced to AT, focus moved to the first error? Data preserved after the error? *Typical:* "Unknown error", "Invalid data", form cleared after server error.

**H10. Help and documentation.** Contextual help where needed? Help mechanism in the same place on every screen (WCAG 3.2.6)? *Typical:* help only in an external PDF.

## Recommended process
1. Define scope (screens/flows) and user profile.
2. First pass: walk the flow as the user.
3. Second pass: per key screen, go through H1–H10 noting location, heuristic, severity and evidence.
4. Merge duplicates; order by severity × frequency.
5. Ideally 3–5 independent evaluators (one finds ~35% of problems per Nielsen). If only one, say so in the report.

# Dark (deceptive) patterns

Designs that trick users into things they would not do with clear information. They damage trust and several are restricted by law (e.g. EU Digital Services Act Art. 25, GDPR consent rules, consumer protection authorities). A confirmed dark pattern is always a **blocker** (`dark-pattern`, fixed base).

Taxonomy based on Harry Brignull (deceptive.design) and OECD / European Commission classifications.

| Pattern | What it is | Signals in UI / code | Honest alternative |
|---|---|---|---|
| Confirmshaming | Guilt when declining ("No, I prefer paying more") | Emotional decline texts | Neutral "No, thanks" |
| Pre-checked options | Consent or extras checked by default | `checked`/`defaultChecked`/`= true` on marketing, insurance, donations | Unchecked, explicit opt-in |
| Misleading hierarchy | Huge colorful "Accept", tiny grey or hidden "Reject" | Visual weight gap in consent banners | Same visual weight for accept and reject |
| Obstruction / roach motel | Easy in, hard out | Cancel flow longer than sign-up flow | Cancel in the same number of steps and channel |
| Hidden costs / drip pricing | Fees appear at the end | Total differs between listing and checkout | Total price from the start |
| Fake urgency | Timers that reset, false "only 2 left" | Client-side countdowns without backend | Only real, verifiable urgency |
| Fake social proof | Invented reviews or "X people viewing" | Random numbers generated in the client | Real data or nothing |
| Nagging | Asking repeatedly (notifications, rate app) | Dialogs every session without "don't ask again" | Ask once, in context, respect "no" |
| Sneak into basket | Adding products without asking | Auto-added items | Suggest, don't add |
| Disguised ads | Ads looking like content or download buttons | Same style as organic content | Clear "Ad" label |
| Trick questions | Double negatives, inverted checkbox meaning | "Uncheck to not stop receiving…" | Direct, affirmative language |
| Forced continuity | Free trial charging without notice | Card required, no reminder before charge | Reminder before charge, easy cancel |
| Privacy-unfriendly defaults | Data shared by default | Public settings by default | Privacy by default (GDPR art. 25) |
| Interruption walls | Modals forcing sign-up | Immediate registration walls | Let users explore; ask with clear value |

## Gamification and notifications
- Streaks, badges and progress (Zeigarnik, goal-gradient) must serve the user's goal, not create anxiety.
- Red badges only for things requiring action.
- Push notifications: opt-in in context, configurable categories, quiet hours.

## How to audit
1. Walk sign-ups, subscriptions, payments, consents, cancellations, account deletion.
2. Count steps; compare visual weight of "yes" vs "no".
3. Search code: pre-checked marketing/consent fields, client-side timers, decline texts.
4. Check the total price is visible before the last step.

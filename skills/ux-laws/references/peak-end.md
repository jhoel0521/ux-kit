# Peak-End rule (apogeo y final) — Suggestion (rule id `peak-end`)

## Statement

Users judge an experience mainly by **two moments**:

1. The **peak**: the most intense moment, positive or negative.
2. The **end**: how it finishes.

The rest of the experience tends to be forgotten or averaged out. An experience with highs and lows but a good ending is remembered better than a mediocre, uniform one.

## Why it matters in UI

- **Lasting memories**: users rate your whole product based on a few moments.
- **Emotions**: these moments create an emotional bond with the brand.
- **Decision to return/recommend**: the ending directly influences retention.

## How to identify the peak and the end

For any flow, ask yourself:

1. **Possible positive peak**: what is the moment of greatest satisfaction? (getting the desired result, reaching the goal, seeing something they created).
2. **Possible negative peak**: what is the moment of greatest friction? (tedious form, waiting, error). If you can't remove it, **soften it**.
3. **End**: what is the last screen / message / interaction before closing the app or leaving?

## How to design them well

### The peak

Make the climax **over-rewarding** (better than the user expects):

- **Celebratory animation** when completing an important action (confetti when paying, animated checkmark when saving).
- **Rewarding micro-interaction** (subtle sound, haptic vibration, smooth transition).
- **Surprising result** (showing better progress than expected, a fun fact, a personalized phrase).
- **Explicit recognition** ("Done! You're among the 5% who finish this flow").

Market examples:

- **Duolingo**: confetti + motivational phrase + day streak when finishing a lesson.
- **Spotify Wrapped**: yearly visualization with personalized storytelling (the peak of the year).
- **Stripe**: green check animation when a payment is received.

### The end

The end must **NEVER** be:

- ❌ A blank screen.
- ❌ "Operation completed" without context.
- ❌ An abrupt return to the start without confirmation.
- ❌ An error that doesn't explain what to do.

The end **MUST** include:

1. **Clear confirmation**: "Your order #12345 was sent".
2. **Obvious next step**: "View details" / "Back to home" / "Share".
3. **Positive tone**: thanks, a brief celebration, a sense of closure.
4. **Useful information**: delivery time, tracking link, what to expect.

### Softening the negative peak

If a flow has an unavoidable friction point (payment, waiting, long form):

- **Show visible progress** (a bar moving forward).
- **Distract/entertain** during waits (animation, fun fact, changing message).
- **Confirm progress** ("Almost done, last step").
- **Reduce perceived time** with immediate feedback.

## How to apply it in code

```tsx
// ❌ WRONG — purchase flow ends abruptly
function CheckoutSuccess() {
  return <div>Purchase successful.</div>;
}

// ✅ RIGHT — peak and end taken care of
function CheckoutSuccess({ order }) {
  return (
    <div className="text-center p-8">
      <CheckmarkAnimation /> {/* visual peak */}
      <h1 className="text-3xl mt-6">All set, {order.customerName}!</h1>
      <p className="mt-2 text-lg">
        Your order <strong>#{order.id}</strong> is on its way.
      </p>
      <p className="text-sm text-gray-500 mt-1">
        It will arrive on {order.estimatedDate}. We sent the details to your email.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Button variant="primary">Track my order</Button>
        <Button variant="ghost">Back to home</Button>
      </div>
    </div>
  );
}
```

## Application by flow type

| Flow | Peak to design | End to design |
|---|---|---|
| Onboarding | The user's first successful action | "You're ready" screen with a CTA to the core |
| Purchase / Checkout | Visual confirmation of the accepted payment | Summary + tracking + thanks |
| Create content (post, doc) | The moment of publishing | View of the published content + share |
| Complete a task | Marking it done | Celebration + suggested next task |
| Login / Sign-up | Access granted | Personalized welcome + short tour |
| Error / Failure | (negative peak) | Clear message + how to recover |

## Frequent errors

1. **Generic "success" screen** that neither celebrates nor informs.
2. **Sending the user straight to home** without an intermediate confirmation.
3. **Forgetting the end of the error flow**: the user is stuck without knowing what to do.
4. **Flattened peak**: the most important action feels like any other.
5. **Too much peak too often**: if everything celebrates, nothing does (use it only at real key moments).

## Peak-End checklist

```
[ ] I identified the moment of greatest satisfaction in the flow and designed it on purpose
[ ] The end of the flow has: confirmation + next step + positive tone
[ ] Unavoidable waits and friction are softened with visual feedback
[ ] Error screens make "what to do now" clear
[ ] Rewarding micro-interactions on key actions (not on everything)
[ ] No generic success screens or abrupt cuts in the flow
```

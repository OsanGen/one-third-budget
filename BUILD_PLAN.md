# One Third Budget Build Plan

## 1) Route and file structure
- App Router single route:
  - `/` → `app/page.tsx` (single-screen coaching view)
- Minimal project layout:
  - `app/layout.tsx`
  - `app/page.tsx`
  - `app/globals.css`
  - `components/
    - coach/
      - `OneThirdCoachShell.tsx`
      - `BudgetInputsPanel.tsx`
      - `CurrentStatusPanel.tsx`
      - `SimpleBudgetBars.tsx`
    - ui/
      - `Card.tsx`
      - `MoneyInput.tsx`
      - `HelperText.tsx`
      - `SectionDivider.tsx`
  - `lib/
    - `types.ts`
    - `money.ts`
    - `storage.ts`
    - `planCalc.ts`
  - `hooks/
    - `useBudgetCoach.ts`
  - `public/
    - `icons/` (optional static calming illustrations)
- Optional future split if needed: add `app/api/` only for static exports. Not in MVP.

## 2) Component tree
- `OneThirdCoachShell`
  - `AppHeader`
  - `BudgetInputsPanel`
    - `MoneyInput` for take-home income
    - `MoneyInput` for fixed essentials
    - `MoneyInput` for flexible essentials
  - `CurrentStatusPanel`
    - `SimpleBudgetBars`
    - `StatusMessage`
  - `OptionalPlanSection`
    - up to 3 editable optional buckets
    - `MoneyInput` per bucket
  - `ActionBar`
    - `NudgeButton` (1 primary action)
    - `ResetButton` (1 secondary action)
- `SimpleBudgetBars`
  - `RemainingBudgetRow`
  - `OptionalVsTargetRow`
  - `OneThirdHintRow`
- `StatusMessage` shows one plain-language line with supportive state (OK / small drift / needs pause) and one optional nudge.

## 3) State shape
- Local, typed state in `lib/types.ts` and managed by one hook.

```ts
export type OptionalItem = {
  id: string;
  label: string;
  amount: number;
};

export type BudgetCoachState = {
  takeHomeIncome: number;
  fixedEssentials: number;
  flexibleEssentials: number;
  optionalItems: OptionalItem[];
  updatedAt: string;
  version: 1;
};

export type BudgetCoachUiState = {
  lastSavedAt: string | null;
  activeSection: 'overview' | 'optional';
  showAdvancedHint: boolean;
};
```

```ts
export type BudgetDerived = {
  essentialsTotal: number;
  spendableAfterEssentials: number;
  oneThirdBudget: number;
  optionalTotal: number;
  optionalRemaining: number;
  optionalStatus: 'good' | 'close' | 'over';
  safePercent: number;
  budgetHeadroom: number;
};
```

- `BudgetCoachHook` combines raw state + derived metrics and emits both raw and derived state.
- Keep defaults simple (all values `0`, three optional buckets with empty labels).

## 4) Derived calculations
- `essentialsTotal = fixedEssentials + flexibleEssentials`
- `spendableAfterEssentials = max(takeHomeIncome - essentialsTotal, 0)`
- `oneThirdBudget = roundToDollar(spendableAfterEssentials / 3)`
- `optionalTotal = sum(optionalItems.amount)`
- `optionalRemaining = oneThirdBudget - optionalTotal`
- `safePercent = clamp(optionalTotal / oneThirdBudget, 0, 1)`, with edge case `oneThirdBudget <= 0` => `0`
- `optionalStatus`:
  - `good`: `optionalRemaining >= 30`
  - `close`: `0 <= optionalRemaining < 30`
  - `over`: `optionalRemaining < 0`
- All math is integer-dollar safe with cents supported in storage but displayed as full-dollar rounds in MVP.
- Add `Math.max` guards for all derived values so user errors (negative inputs, blanks, text) cannot break visuals.

## 5) localStorage strategy and keys
- MVP persistence only, browser localStorage.
- Storage keys:
  - `oneThirdBudget:v1:state` (serialized `BudgetCoachState`)
  - `oneThirdBudget:v1:lastKnownPlan` (optional compact snapshot for quick restore)
  - `oneThirdBudget:v1:meta` (`{ version, schema, lastSavedAt }`)
- `storage.ts` API:
  - `loadBudgetState(): BudgetCoachState`
  - `saveBudgetState(state): void`
  - `clearBudgetState(): void`
  - `safeParseState(raw): BudgetCoachState`
- Version and schema versioning at `v1`; if parse fails, return defaults and set an in-memory flag for non-blocking “state reset” copy.
- Keep only current week and last edited state in this MVP.

## 6) Chart approach
- No chart library for MVP.
- Use lightweight, explainable visuals with semantic bars:
  - one horizontal bar for target one-third budget
  - one stacked bar for optional total used vs remaining
  - one soft cap marker at the one-third threshold
- Implemented with semantic HTML + Tailwind classes and simple inline SVG when needed.
- Accessibility rules:
  - each visual has text equivalent for screen readers
  - color changes use status text, not color alone
- If the user prefers a sparkline later, add optional `recharts` only when needed, not before core flow ships.

## 7) Testing plan
- Unit:
  - `lib/planCalc.ts`: all derived formulas
  - invalid/edge states: empty values, negatives, extreme values, zero income, 1 optional bucket, 3 optional buckets
- Hook/logic:
  - save/load roundtrip for localStorage
  - default fallback when storage is missing/corrupt
- Interaction:
  - manual mobile smoke test: one screen, two actions max per section, no jittery jumps, no heavy reflow
  - copy audit: plain language, no finance jargon, no em dash in visible copy
- Non-code tests:
  - cognitive load check with 3 simple scenarios in order of complexity
  - stress scenario test: high values and quick edits without losing state

## 8) Build order
1. Scaffold Next.js App Router shell and Tailwind setup.
2. Add `lib/types.ts` and `lib/planCalc.ts`.
3. Add storage layer with schema defaults and safe parse logic.
4. Add `useBudgetCoach.ts` hook and basic computed selectors.
5. Wire `app/page.tsx` layout with read-only static sections using derived state.
6. Add inputs for income/essentials/optional with minimal handlers.
7. Add `SimpleBudgetBars` and status messaging.
8. Add reset and save flows.
9. Add copy and spacing pass for calm, obvious hierarchy.
10. Add tests for formulas and fallback persistence behavior.
11. Manual mobile sanity sweep and finalize.

## 9) Major UX risks and how to avoid them
- Risk: too many choices causes overwhelm.
  - Keep fixed count of optional inputs (max 3) and group actions one section at a time.
- Risk: math feels abstract.
  - Translate every metric to one sentence tied to their week/day context ("You can still spend $X today").
- Risk: trauma-triggering wording when over budget.
  - Use supportive copy and neutral language, avoid blame, no red panic states.
- Risk: accidental taps on mobile.
  - Inputs large, one-finger easy targets, and one explicit primary action.
- Risk: people misread totals as a limit when it is a guide.
  - Label every number as “guide,” not command, and include a gentle “adjust when needed” note.
- Risk: inconsistent persistence.
  - Save on blur + debounce, recover from malformed storage without crashing.

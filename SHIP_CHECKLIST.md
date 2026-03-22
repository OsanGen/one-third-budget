# One Third Budget - Ship Notes

## Finished features

- Single-screen route with ordered sections and calm OSAN card structure.
- Live `Money in` input.
- Dynamic cap calculation from `Money in / 3`.
- Bucket model with add, edit name, edit amount, remove, quick add, and stable IDs.
- Live summary with status, remaining/overage, percent, and support text.
- Live progress bar and donut chart tied to live summary math.
- Next-move coach with one clear action and section scroll.
- Draft persistence (`one-third-budget:draft:v1`) with auto-save and restore.
- Saved month persistence (`one-third-budget:logs:v1`) with restore on load.
- Clear all saved months (with confirmation) and JSON export.
- Accessibility basics: labels, keyboard flow, visible focus, gentle announcements.
- UI primitives and tokenized styling aligned to OSAN principles.

## Acceptance checks

- [x] App runs with `npm run dev`.
- [x] Lint, test, and build pass.
- [x] Cap updates immediately from revenue edits.
- [x] Bucket edits update total and summary in the same render cycle.
- [x] Chart and progress bar reflect live numbers.
- [x] Coach strip always presents a clear next action.
- [x] Draft state restores after refresh.
- [x] Saved month history restores after refresh.
- [x] JSON export downloads a valid file in browser.
- [x] Clear action requires confirm copy and is explicit.
- [x] Copy is plain and short, with no jargon or complex labels.

## Known v2 improvements

- Add manual screen-reader-only flow testing and pass/fail notes.
- Add per-month delete/edit actions in the saved months list.
- Add optional date label or month picker at save time.
- Add a tiny help line for "what this number means" in each section.
- Add stronger persistence fallback messaging when storage is unavailable.

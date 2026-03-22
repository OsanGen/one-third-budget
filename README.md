# One Third Budget

One Third Budget is a single-screen, mobile-first web app that helps a person check optional spending in plain language. It is built with Next.js App Router and localStorage-only persistence.

## Who it is for

- People who want a very simple way to cap optional spending each month.
- First-time budgeters and people who get overwhelmed by complex dashboards.
- Anyone who wants a gentle coach, not a strict finance app.

## What it does

- Captures your `Money in` (monthly money coming in).
- Calculates your bucket cap as one third of `Money in`.
- Lets you add and edit optional spending buckets:
  - quick add chips for common categories
  - manual bucket add, edit name, and edit amount
- Shows live summary math:
  - cap, total in buckets, remaining, and usage status
  - over-cap warning with concrete fix direction
- Shows a calm donut chart and a usage progress bar that updates as you type.
- Guides your next step with `Your next move`.
- Lets you save month snapshots and view a history of saved months.
- Lets you export saved months as JSON and clear all saved months.

## Run it locally

1. Install dependencies

```bash
npm install
```

2. Start development

```bash
npm run dev
```

3. Open `http://localhost:3000`.

## Useful scripts

- `npm run dev` starts local development.
- `npm run build` builds production output.
- `npm run start` runs the production build.
- `npm run lint` checks for lint and framework warnings.
- `npm test` runs helper and storage unit tests.

## Key product rules in this app

- Single-screen flow with section anchors:
  - header, next move, money in, bucket cap, buckets, summary, saved months.
- Mobile-first, calm layout.
- Dynamic revenue input and immediate cap updates.
- `cap = money in / 3` with no hidden math.
- Editable buckets with simple add/edit/remove flow.
- Live summary and live chart.
- Always visible next action from the coach strip.
- LocalStorage-only persistence.
- Plain-language copy and plain controls.
- Accessibility-first basics: labels, focus rings, and live status updates.
- Low cognitive load defaults: no hidden settings, no extra steps.

## LocalStorage behavior

- Draft state is auto-saved on meaningful edits to:
  - `one-third-budget:draft:v1`
  - includes `monthlyRevenueText`, buckets, and `updatedAt`.
- Saved month snapshots are stored separately at:
  - `one-third-budget:logs:v1`
  - includes full month entries with totals, status, and bucket details.
- Clearing or resetting flow remains local only.
- If saved data is malformed, the app resets only that local key and continues.

## Current limitations

- No bank sync, no backend, no user accounts.
- No reminder or automation engine yet.
- No full screen-reader validation pass on physical devices yet.
- No advanced history editing (delete one saved month, rename label edits, filters).
- No server-side backup or recovery when browser storage is disabled.

## Notes for new collaborators

- Core logic is intentionally kept in `lib/`:
  - `lib/money.ts` for pure calculations.
  - `lib/storage.ts` for draft persistence.
  - `lib/monthLogs.ts` for saved month persistence.
- UI behavior lives in `app/page.tsx` with reusable primitives in `components/ui/`.
- Design tokens and OSAN styling are in `app/globals.css`.

## Make it a live shareable site

Use GitHub + Vercel for the fastest sharing path:

1. Create a GitHub repository and connect it to your local folder.
2. Push this project to GitHub.
3. Import the repo in Vercel and deploy.
4. Vercel gives you a URL you can share immediately.

### One-liner workflow (GitHub + Vercel)

```bash
git init
git add .
git commit -m "Initial One Third Budget release"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

Then:

- Open Vercel
- Click New Project
- Import your GitHub repo
- Accept defaults and deploy

You will get a live URL like:

- `https://your-app-name.vercel.app`

If you want a fully GitHub-native static host, I can also set up a GitHub Pages export flow next.

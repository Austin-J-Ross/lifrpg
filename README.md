# Quest

A browser-local character and quest tracker built with React, TypeScript, and Vite.

## Setup and run

Use Node.js 22.12 or newer and npm. Node 24 LTS is used by CI; Node 26 also works.

```powershell
npm.cmd ci
npm.cmd run dev
```

Open http://127.0.0.1:5173/. The development port is fixed and fails if occupied, keeping browser storage on a consistent origin. Source files must be served over HTTP; opening index.html directly is unsupported.

New users start with an empty profile, classes, and quests. Create a class before creating a quest. Explicit sample content is available in development at http://127.0.0.1:5173/?demo=1#/home. Demo sessions never save or overwrite real progress; production builds exclude the sample data.

## Architecture

| Path              | Responsibility                                                                      |
| ----------------- | ----------------------------------------------------------------------------------- |
| src/main.tsx      | Application entry and optional development fixture                                  |
| src/app           | React shell, hash routing, page focus and titles                                    |
| src/pages         | Home, About, Classes, and Quests composition                                        |
| src/features      | Profile, portrait, badge, class/skill, quest and domain components with CSS Modules |
| src/components/ui | Dialog, popover, feedback helpers, progress bar and empty states                    |
| src/domain        | Types, progression, dates, IDs and fixed rules                                      |
| src/state         | Context provider, typed reducer/actions and shared selectors                        |
| src/persistence   | Runtime validation, version migration, storage and backup adapter                   |
| src/styles        | Shared tokens, base styles and common layouts                                       |
| src/dev           | Explicit development-only sample state                                              |
| tests/fixtures    | Version-1 saved-data fixture                                                        |
| e2e               | Chromium journeys using development and production assets                           |

Components dispatch actions rather than mutate shared arrays. The reducer validates changes and computes progression; state updates drive all screens and the quest badge together. Forms and dialogs keep temporary state locally. Browser storage is accessed only through the persistence boundary. JavaScript and CSS have one authoritative source, with no embedded copies or HTML fragment loading.

## Commands

| Command              | Purpose                                                        |
| -------------------- | -------------------------------------------------------------- |
| npm run dev          | Development server at 127.0.0.1:5173                           |
| npm run typecheck    | Strict TypeScript checks                                       |
| npm run lint         | ESLint and React hook checks                                   |
| npm test             | Vitest rule, migration, reducer and component tests            |
| npm run build        | Type checking and production bundle in dist/                   |
| npm run preview      | Serve the build at 127.0.0.1:4173                              |
| npm run test:e2e     | Build and run Chromium browser journeys                        |
| npm run check        | Type checking, lint, unit/component tests and production build |
| npm run format:check | Verify formatting                                              |
| npm run format       | Apply formatting                                               |

On PowerShell, use npm.cmd if execution policy prevents npm.ps1 from running. Before the first browser test run, install Chromium with `npx.cmd playwright install chromium`. Linux CI uses `npx playwright install --with-deps chromium`.

Browser tests serve the actual built assets through Playwright request interception, avoiding any dependency on an open server port. A separate test uses Vite's development transformations and explicit demo initialization. Tests cover profile, class/skill and quest workflows, XP, reload, badge counts, keyboard use, mobile layout, routing/history, repository subpaths, migration, backup recovery and storage failures. Screenshots are written to artifacts/. These tests verify client rendering and interactions; they do not test an external hosting provider or operating-system networking.

CI installs from the lockfile, runs checks and formatting, installs Chromium, and runs browser tests. Failures retain traces under artifacts/test-results/.

## Saved data and recovery

Normal progress is stored in localStorage under `quest-character-v2` with schema version 2. Classes, skills and quests have stable IDs; links remain valid when array order changes.

On the same browser origin, the first launch automatically migrates a valid `quest-character-v1` payload. It retains the original key unchanged, copies its exact contents to `quest-character-v1-backup`, validates the migrated relationships, then writes version 2. Existing XP, levels, profile fields, deadlines and quest rewards are retained. If validation or backup creation fails, automatic saving pauses and the original data is left intact.

About provides **Export backup**, **Export original save**, and **Import backup**. Import accepts valid version-1 or version-2 JSON. Before replacing an existing version-2 save, it copies that exact payload, even if malformed, to a timestamped `quest-character-v2-before-import-...` key. A failed backup or import write leaves the current save unchanged. A valid explicit import can recover a blocked session. Storage errors remain visible; in-memory changes can still be exported.

Storage belongs to each browser origin, including scheme, hostname and port. Moving from a file URL, development server or another hosted address does not transfer data automatically. Export at the old address and import through About at the new one. For the original mock-up, which had no export interface, open its original address in the original browser and save the value of `localStorage.getItem('quest-character-v1')` from developer tools as a JSON file. Import that file at the new address. Keep the original until you have verified your migrated progress.

Concurrent editing in multiple tabs or devices is not synchronized. Export periodic backups of important progress.

## Static hosting

Run `npm run build` and publish the contents of dist/, including assets/. Vite uses relative asset paths and the router retains hash URLs, so a GitHub Pages repository subpath needs no route rewrite. Do not publish the source index.html alone. No backend or server credentials are required.

For GitHub Pages, configure a workflow to build and upload dist/ with the official Pages actions, or publish that directory through your existing hosting pipeline. The included CI validates the project but does not publish it automatically.

## Rules and current limits

Skills store cumulative XP; the cost to advance from level L is ceil(100 * 1.5^(L - 1)). Classes keep their original separate XP threshold and level progression. A quest awards XP once, and deadlines remain at 11:59 PM local time.

Health rings display explicitly labelled example values. Quest damage settings retain their planned rates, but automatic damage is not implemented. Accounts, cloud synchronization, notifications and automatic health tracking remain separate product work. See plan.md for the completed restructuring checklist.
# lifrpg

# Quest_HUAD application restructuring plan

Date: November 23, 2026  
Status: Implemented. React/TypeScript conversion, migration, tooling, and browser verification are complete.

## Goal

Turn Quest into a maintainable application with separate pages, reusable components, shared state, testable game rules, and reliable persistence. Establish one source for each part of the application and a repeatable way to run, inspect, test, and build it.

## Starting baseline (before restructuring)

| Area             | Current implementation                                                                                                                            | Problem to address                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Entry point      | `index.html` contains the complete interface, CSS, and JavaScript.                                                                                | A single file owns almost the entire application.                                                 |
| JavaScript       | `app.js` mirrors the embedded script.                                                                                                             | Changes require editing two copies.                                                               |
| Styling          | `styles.css` mirrors the embedded stylesheet.                                                                                                     | Styling also has two sources to maintain.                                                         |
| Pages            | Home, About, Classes, and Quests are sections toggled by hash navigation.                                                                         | Page markup and behavior are mixed together.                                                      |
| State and rules  | Global arrays, XP calculations, validation, rendering, and event handlers share one script.                                                       | Features depend on global state and manual calls to update other screens.                         |
| Persistence      | Browser `localStorage`, key `quest-character-v1`, schema version 1.                                                                               | Classes are referenced by array position and skills by name; changes need a deliberate migration. |
| Product behavior | Profile editing, class/skill creation, and quest creation/completion work locally. Health values are examples; automatic damage is unimplemented. | Functional behavior and demonstration data need clear separation.                                 |
| Tooling          | No package manifest, build setup, automated checks, or documented development server.                                                             | Changes are difficult to verify consistently.                                                     |

The working tree already contains uncommitted portrait quest-badge edits in `index.html`, `app.js`, and `styles.css`. Carry these changes forward. Their presence in source is separate from confirming their appearance and behavior in a running browser.

## Recommended technical foundation

Use **React, TypeScript, and Vite**, organized by feature. React gives the portrait, badge, forms, cards, and pages clear component boundaries. TypeScript makes the relationships between quests, classes, skills, and saved data explicit. Vite supplies local development and production builds.

| Concern           | Choice                                                          | Purpose                                                                                                         |
| ----------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Interface         | React with strict TypeScript                                    | Reusable components that update from application state.                                                         |
| Development/build | Vite and npm, with a committed lockfile                         | Repeatable installation, local preview, and a `dist/` build.                                                    |
| Routing           | React Router using hash URLs                                    | Keep `#/home`, `#/about`, `#/classes`, and `#/quests`, including refresh and browser history on static hosting. |
| Shared state      | React Context and a reducer                                     | One place to update saved application data; forms and open dialogs keep temporary state locally.                |
| Styling           | Shared CSS tokens/base styles and feature CSS Modules           | Preserve the current appearance while keeping component styles together.                                        |
| Persistence       | A dedicated localStorage adapter with validation and migrations | Keep storage details outside components and protect existing progress.                                          |
| Verification      | Vitest, React Testing Library, and a small Playwright suite     | Check game rules, saved-data migration, and important browser journeys.                                         |
| Code checks       | TypeScript, ESLint, and formatting configuration                | Catch invalid code and keep changes consistent.                                                                 |

This introduces a build step. Development will use a local server; releases will serve the generated `dist/` files. Opening the source `index.html` directly will no longer be the supported workflow. Choose mutually compatible stable dependency versions when implementation begins and record the required Node version.

The first release after restructuring remains a browser-local application. Accounts, a server/database, device synchronization, notifications, and automatic health damage are separate product work. The persistence boundary should make a future storage change possible without rewriting the interface.

## Proposed file organization

The paths below show ownership. Create individual files as their behavior is extracted; avoid empty placeholder modules.

| Path                                                          | Responsibility and representative files                                                                                                                          |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`                                                  | Small document containing metadata, the application mount point, and the module entry.                                                                           |
| `package.json`, `package-lock.json`                           | Dependencies and standard project commands.                                                                                                                      |
| `vite.config.ts`, `tsconfig*.json`, lint/format configuration | Build, type checking, and code-quality settings.                                                                                                                 |
| `src/main.tsx`                                                | Import global styles and mount the application.                                                                                                                  |
| `src/app/`                                                    | `App.tsx`, `AppRouter.tsx`, `AppLayout.tsx`, and shell components such as Sidebar, Topbar, and Footer.                                                           |
| `src/pages/`                                                  | `HomePage.tsx`, `AboutPage.tsx`, `ClassesPage.tsx`, and `QuestsPage.tsx`; compose features rather than own game rules.                                           |
| `src/features/profile/`                                       | Character portrait, displayed profile details, profile form, and their styles.                                                                                   |
| `src/features/quests/`                                        | Quest badge, list, item, creation form/dialog, and their styles. Share the same list/item components between Home and Quests.                                    |
| `src/features/classes/`                                       | Class tags, cards, class creation form, skill list, skill creation form, and their styles.                                                                       |
| `src/features/domains/`                                       | Health rings, domain details, and domain presentation.                                                                                                           |
| `src/components/ui/`                                          | Reusable dialog, detail popover, toast, progress bar, and empty-state components.                                                                                |
| `src/domain/`                                                 | Typed models, XP/progression functions, quest completion, class/domain mappings, quest-size definitions, and deadline helpers. No React, DOM, or storage access. |
| `src/state/`                                                  | Application provider, reducer/actions, and selectors such as active quest count and class progress.                                                              |
| `src/persistence/`                                            | Read/write adapter, runtime validation, schema versions, migration, and migration backup/import helpers.                                                         |
| `src/styles/`                                                 | Design tokens, global/reset styles, and shared layout rules. Feature-specific rules live beside components.                                                      |
| `src/assets/`                                                 | Shared visual assets and icon components as needed.                                                                                                              |
| `src/dev/`                                                    | Explicit demonstration state for development; excluded from normal first-run initialization.                                                                     |
| `tests/fixtures/`                                             | Representative legacy saved data and migration fixtures. Unit/component tests live beside the code they exercise.                                                |
| `e2e/`                                                        | Browser tests for navigation, profile edits, classes/skills, quests, persistence, and the portrait badge.                                                        |
| `.github/workflows/ci.yml`                                    | Install, type-check, lint, test, and build on repository changes.                                                                                                |
| `README.md`                                                   | Setup, commands, architecture overview, persistence behavior, limitations, and static-hosting instructions.                                                      |
| `plan.md`                                                     | This implementation sequence and its completion checklist.                                                                                                       |

## Ownership and data flow

1. A component collects input and dispatches a typed action, such as saving a profile, creating a class, adding a skill, or completing a quest.
2. The reducer applies domain rules and returns the next state. Validation also runs at this boundary so correctness does not depend solely on form controls.
3. Components read state through selectors. The portrait badge, Home list, Quests list, and class summaries update from the same data.
4. The persistence adapter saves validated, versioned state after initialization/migration succeeds. Storage failures produce a visible message without discarding the in-memory session.

Pages and components must not read or write localStorage directly. Domain functions must accept their inputs explicitly, including the current time where needed. Shared components must release event listeners and timers when removed.

## Data and compatibility decisions

- Define explicit types for profile, class, skill, quest, domain, and saved application state.
- Give classes, skills, and quests stable IDs. Convert legacy quest class indexes and skill names into ID references during migration.
- Keep the current skill XP formula and the separate class XP/leveling formula. Restructuring must not change the progression rules or recalculate existing progress unexpectedly.
- Keep the current 11:59 PM local deadline behavior and the optional no-damage flag. Test date handling around calendar and daylight-saving boundaries.
- Use one selector for the active quest count. Derive it from quests rather than persisting a separate counter.
- Completing the same quest twice must award XP once; an action for a missing/completed quest must not mutate progress.
- Preserve the original version-1 payload before migration. Write the new version only after validation succeeds. Unsupported or damaged saved data must not be silently overwritten with defaults.
- Account for storage origins: data from a directly opened file, a development server, and a hosted site are not automatically shared. Provide a documented legacy export/import route for an origin change; verify same-origin migration separately.
- New users start with a clean profile, empty classes, and empty quests. Keep the fixed domain definitions available, and provide useful empty states with a route to create the first class before creating a quest.
- Keep demonstration health values and sample progress explicitly separated from user data. Do not imply that overdue damage is being applied while that feature remains unimplemented.

## Implementation sequence

### Phase 1: Establish the baseline

- [x] Record the current working changes and inspect the application in a running browser.
- [x] Capture the current desktop and mobile layouts and list the working interactions on all four pages.
- [x] Verify the portrait badge in the running app: top-left placement, grey outer circle, red inner circle, current count, and navigation to Quests.
- [x] Record that the current sidebar portrait is hidden on mobile. Plan to reuse the portrait/badge in the mobile shell so the feature is available there too.
- [x] Prepare representative version-1 save fixtures, including custom profile details, classes, skills, and quests.

Completion: a concrete visual and behavioral baseline exists before the application is reorganized.

### Phase 2: Add the application toolchain

- [x] Add the React/TypeScript/Vite setup in place, preserving the current source and uncommitted changes during the transition.
- [x] Add npm commands for `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, and `test:e2e`.
- [x] Set a consistent development origin/port so routine restarts do not appear to lose saved data.
- [x] Add the application shell, hash routes, and shared design tokens using the existing visual design.
- [x] Configure asset paths for the eventual hosting location, including a repository subpath on GitHub Pages.
- [x] Open the development preview and confirm the new entry point actually runs before porting the remaining screens.

Completion: the project installs and runs through documented commands, and all four routes resolve.

### Phase 3: Extract rules, state, and persistence

- [x] Move models, domain definitions, progression, class/domain mapping, quest sizes, and deadline functions into domain modules.
- [x] Add stable IDs, typed actions, a reducer, and shared selectors.
- [x] Extract localStorage access and runtime validation into the persistence adapter.
- [x] Implement and test the version-1 migration and the origin-change export/import path before adopting the new save format.
- [x] Test XP thresholds, multiple level-ups, invalid relationships, and repeated quest completion.
- [x] Keep initialization, migration, and save ordering explicit so default state cannot overwrite an existing save while loading.

Completion: rules run without a browser, legacy progress survives migration, and all UI updates can use a single state model.

### Phase 4: Move the interface into pages and components

- [x] Extract shared dialogs, popovers, feedback, progress bars, and empty states.
- [x] Port profile display/editing and the character portrait.
- [x] Port classes, class creation, skills, and class/domain details.
- [x] Port quest creation and completion, reusing quest components across Home and Quests.
- [x] Connect the badge to the shared active-quest selector and hash navigation; reuse it with the portrait in desktop and mobile layouts.
- [x] Preserve route headings, document titles, browser history, focus restoration, keyboard access, and touch/hold details.
- [x] Move styles beside their owning components while preserving layout, colors, and responsive behavior.

Completion: existing functional journeys run through components and shared state, without manual cross-page rendering calls.

### Phase 5: Finish the transition from the demonstration

- [x] Replace automatic personal sample data with clean first-run state and helpful empty states. Retain existing saved user data through migration.
- [x] Keep sample content available through explicit development fixtures.
- [x] Remove the "Interactive mock-up" label and correct copy that currently claims automatic damage occurs. Identify the remaining health demonstration accurately until its rules are implemented.
- [x] Reduce `index.html` to the application entry document.
- [x] Remove the old root `app.js`, `styles.css`, and embedded copies once their replacements pass the behavior checks.
- [x] Update the README to describe the real development/build workflow and browser-local persistence.

Completion: each piece has one authoritative source, and normal use no longer starts with demonstration quests or personal sample details.

### Phase 6: Verify and make the result reviewable

- [x] Run type checking, linting, focused unit/component tests, and the production build.
- [x] Run browser journeys for profile save/reload, class/skill creation, quest creation/completion, and version-1 migration.
- [x] Verify badge counts for zero, one, and several quests, including add, completion, reload, and click/keyboard navigation.
- [x] Check desktop and narrow mobile layouts, keyboard focus, dialogs, popovers, and overflow.
- [x] Check direct hash links, refresh, back/forward navigation, unknown-route fallback, and the built app under a repository subpath.
- [x] Verify storage-denied, storage-full, malformed-save, and unsupported-save cases without losing the original data.
- [x] Add CI for the checks and build. Document publishing the generated `dist/` directory to static hosting.
- [x] Open the working preview and show the actual interface, including the portrait badge, with the final change summary.

Completion: checks pass, the built app works, and the visible result has been inspected in a browser.

## Definition of done

- The app has distinct pages, feature components, domain rules, shared state, and persistence modules.
- Existing profile, class, skill, quest, XP, and navigation behavior remains available.
- Existing valid saves migrate without losing progress; an origin change has a usable transfer path.
- The portrait badge has the requested appearance, stays synchronized, and opens Quests.
- New users receive clean initial state and usable empty states.
- Health/damage limitations are accurately represented.
- JavaScript and CSS are maintained once, with no embedded mirror copies.
- Development, checks, production builds, and static hosting are documented and reproducible.
- The implementation is demonstrated in a working preview rather than inferred from source changes alone.

## Technical references

- [Vite getting started](https://vite.dev/guide/)
- [Vite static deployment and GitHub Pages](https://vite.dev/guide/static-deploy.html)
- [React Router HashRouter](https://reactrouter.com/api/declarative-routers/HashRouter)
- [Vitest guide](https://vitest.dev/guide/)

## Implementation result — November 23, 2026

The project now uses React, strict TypeScript, Vite, React Router hash routes, Context/reducer state, stable IDs, versioned persistence, feature CSS Modules, Vitest/Testing Library, Playwright, formatting, and CI. The original uncommitted badge work was carried into a reusable component and inspected on desktop and mobile. Legacy scripts, fragment templates, mirrored styles, and interim Node-only tooling were removed.

Version-1 saves migrate with an exact backup and preserved progress. Invalid or inaccessible saves cannot be overwritten by default initialization. Explicit backup import can recover invalid data while retaining an original copy. New users start with clean state; sample progress is development-only.

Verification includes production browser journeys and a Vite development-transform browser test, plus desktop/mobile screenshots in artifacts/. Direct browser requests to localhost remain restricted by this execution environment; request interception lets Chromium load the real application assets and exercise the same client code. The Vite server starts normally on the configured port. External hosting and operating-system networking are outside these checks.

Health/damage automation, accounts, cloud sync, and notifications remain outside this restructuring scope, as planned.

Final checks: `npm run check` passed (strict TypeScript, ESLint, 18 unit/component tests, production build). All 7 Chromium browser tests passed. Formatting checks passed. Desktop and mobile captures were inspected.

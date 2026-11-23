# Quest

Open index.html directly in a browser. It includes all CSS and JavaScript, so no installation, server, or build step is required.

## Pages

- Home (#/home): display-only name and profile, class tags, domain rings, and upcoming quests.
- About (#/about): edit first/last name, pronouns, location, and bio for display on Home.
- Classes (#/classes): class summaries, internally scrollable skill lists, skill levels/XP, new skills, and new classes.
- Quests (#/quests): create and complete quests assigned to a class and skill, with fixed 11:59 PM local deadlines and optional damage.

Separate hash URLs support browser history and direct linking on GitHub Pages. Every class starts with General. Writer also has Short Stories and Characters; Game Designer also has Mechanics.

## Progression

Skills store cumulative XP. Each skill starts at level 1. The XP cost to advance from level L is ceil(100 * 1.5^(L - 1)): 100, 150, 225, 338, etc. Adjust SKILL_XP_BASE and SKILL_XP_GROWTH in app.js to change the curve. Class progress retains its existing separate progression.

## Saved data

Profile, classes, skills, quests, and XP save to localStorage in the current browser. Data is not synced between devices or browsers. Initial data is a demonstration. Domain health and overdue damage are still visual examples; automatic damage is not implemented.

## Source and publishing

index.html is the self-contained deliverable. app.js and styles.css mirror its embedded assets for editing; update both embedded assets when changing source. Publish index.html at the root of a GitHub Pages repository. No special routing configuration is needed.

import { test, expect } from './fixtures';
import { readFileSync } from 'node:fs';
const legacy = JSON.parse(
  readFileSync(
    new URL('../tests/fixtures/legacy-v1.json', import.meta.url),
    'utf8',
  ),
);
import fs from 'node:fs/promises';
const origin = 'http://quest.local';
test('validates and saves monthly costs and home HP independently', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + '/#/home');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Life Stats' })
    .click();
  await page.getByRole('button', { name: 'Edit Monthly Cost Targets' }).click();
  const costs = page.getByRole('dialog', { name: 'Edit Monthly Cost Targets' });
  const subscriptions = costs.getByLabel('Subscriptions ($)', { exact: true });
  await subscriptions.fill('-2');
  await costs.getByRole('button', { name: 'Save stats' }).click();
  await expect(costs).toBeVisible();
  await subscriptions.fill('21.125');
  expect(
    await subscriptions.evaluate(
      (field: HTMLInputElement) => field.validity.stepMismatch,
    ),
  ).toBe(true);
  await subscriptions.fill('21.19');
  await costs.getByLabel('Utilities ($)', { exact: true }).fill('125.50');
  await costs.getByRole('button', { name: 'Save stats' }).click();
  await page.getByRole('button', { name: 'Edit Home' }).click();
  const home = page.getByRole('dialog', { name: 'Edit Home' });
  const stock = home.getByLabel('Stock (total HP)', { exact: true });
  await stock.fill('-1');
  await home.getByRole('button', { name: 'Save stats' }).click();
  await expect(home).toBeVisible();
  await stock.fill('9.5');
  expect(
    await stock.evaluate(
      (field: HTMLInputElement) => field.validity.stepMismatch,
    ),
  ).toBe(true);
  await stock.fill('150');
  await home.getByRole('button', { name: 'Save stats' }).click();
  await page.reload();
  await expect(
    page
      .getByRole('region', { name: 'Monthly Cost Targets' })
      .getByText('$21.19', { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Monthly Cost Targets' })
      .getByText('$125.50', { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Home', exact: true })
      .getByText('150 HP total', { exact: true }),
  ).toBeVisible();
});

test('About saves optional names and a photo independently', async ({
  page,
}) => {
  await page.goto(origin + '/#/about');
  await expect(page.getByRole('textbox')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Export backup' })).toHaveCount(
    0,
  );
  const save = page.getByRole('button', { name: 'Save profile' });
  await save.click();
  await expect(page.getByRole('status')).toHaveText('Profile saved.');

  const image = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 30;
    return canvas.toDataURL('image/png');
  });
  await page.getByLabel('Full-body photo (optional)').setInputFiles({
    name: 'portrait.png',
    mimeType: 'image/png',
    buffer: Buffer.from(image.split(',')[1], 'base64'),
  });
  await save.click();
  await expect(
    page.getByRole('button', { name: 'Remove current photo' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Adventurer' })).toBeVisible();
  await expect(page.locator('img.character-icon')).toHaveAttribute(
    'src',
    image,
  );
});

test('resizes large portrait uploads and rejects files over 5 MB', async ({
  page,
}) => {
  await page.goto(origin + '/#/about');
  const photo = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1500;
    const ctx = canvas.getContext('2d')!;
    const pixels = ctx.createImageData(canvas.width, canvas.height);
    let seed = 12345;
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      pixels.data[i] = seed & 255;
      pixels.data[i + 1] = (seed >>> 8) & 255;
      pixels.data[i + 2] = (seed >>> 16) & 255;
      pixels.data[i + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  const buffer = Buffer.from(photo, 'base64');
  expect(buffer.length).toBeGreaterThan(1024 * 1024);
  expect(buffer.length).toBeLessThanOrEqual(5 * 1024 * 1024);
  const picker = page.getByLabel('Full-body photo (optional)');
  await picker.setInputFiles({
    name: 'large.png',
    mimeType: 'image/png',
    buffer,
  });
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(
    page.getByRole('button', { name: 'Remove current photo' }),
  ).toBeVisible();
  await picker.setInputFiles({
    name: 'too-large.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByRole('alert')).toContainText('up to 5 MB');
  await page.reload();
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Phys. Stats' })
    .click();
  const portrait = page.getByRole('img', {
    name: 'Full-body character portrait',
  });
  await expect(portrait).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
  const dimensions = await portrait.evaluate(
    async (element: HTMLImageElement) => {
      await element.decode();
      return [element.naturalWidth, element.naturalHeight];
    },
  );
  expect(dimensions).toEqual([853, 1280]);
});

test('saves mental stats and a log with one sentiment per entry', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + '/#/home');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Mntl. Stats', exact: true })
    .click();
  await page.getByRole('button', { name: 'Log', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Log a mental status' });
  await expect(form.getByLabel('Title', { exact: true })).toHaveCSS(
    'font-size',
    '16px',
  );
  await expect(form.getByLabel('Description')).toHaveCSS('font-size', '16px');
  await expect(form.getByRole('radio')).toHaveCount(3);
  await expect(form.getByRole('radio', { name: 'Neutral' })).toBeChecked();
  await form.getByRole('radio', { name: 'Positive' }).check();
  await expect(form.getByRole('radio', { name: 'Neutral' })).not.toBeChecked();
  await form.getByLabel('Title', { exact: true }).fill('Reading session');
  await form.getByLabel('Description').fill('Finished a chapter.');
  await form.getByRole('button', { name: 'Save log' }).click();
  await page
    .getByRole('button', { name: 'Edit Activity Weekly Average', exact: true })
    .click();
  const editor = page.getByRole('dialog', {
    name: 'Edit Activity Weekly Average',
  });
  await expect(editor.getByLabel('Focus*', { exact: true })).toHaveCount(0);
  await editor.getByLabel('Reading Hours', { exact: true }).fill('1.5 h');
  await editor.getByRole('button', { name: 'Save stats' }).click();
  await page
    .getByRole('button', { name: 'Edit Mental Stats', exact: true })
    .click();
  const mental = page.getByRole('dialog', {
    name: 'Edit Mental Stats',
    exact: true,
  });
  await mental.getByLabel('Focus*', { exact: true }).fill('80%');
  await mental.getByRole('button', { name: 'Save stats' }).click();
  await page.reload();
  await expect(
    page.getByRole('region', { name: 'Stats', exact: true }).getByText('1.5 h'),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Stats', exact: true }).getByText('80%'),
  ).toBeVisible();
  const log = page.getByRole('region', { name: 'Log', exact: true });
  await expect(log.getByRole('listitem')).toContainText('Reading session');
  await expect(log.getByRole('listitem')).toContainText('positive');
  await expect(log.getByRole('listitem')).toContainText('Finished a chapter.');
});

test('logs a portrait status and saves physical stats across reloads', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.setFixedTime(new Date('2026-11-24T15:00:00Z'));
  await page.goto(origin + '/#/home');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Phys. Stats' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Phys. Stats' }),
  ).toBeVisible();
  const portrait = page.getByRole('region', { name: 'Body status portrait' });
  await expect(portrait.getByRole('button')).toHaveText([
    'Head',
    'Torso',
    'Right arm',
    'Left arm',
    'Right leg',
    'Left leg',
  ]);
  await portrait
    .getByRole('button', { name: 'Right arm', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Right arm status' });
  await dialog.getByLabel('Status message').fill('Sore after practice.');
  await dialog.getByRole('button', { name: 'Log status' }).click();
  await page.getByRole('button', { name: 'Edit General' }).click();
  const general = page.getByRole('dialog', { name: 'Edit General' });
  await general.getByLabel('Height', { exact: true }).fill('175 cm');
  await general.getByLabel('Weight', { exact: true }).fill('72 kg');
  await expect(
    general.getByLabel('Strength (arms)', { exact: true }),
  ).toHaveCount(0);
  await general.getByRole('button', { name: 'Save stats' }).click();
  await page.getByRole('button', { name: 'Edit Physical Stats' }).click();
  const editor = page.getByRole('dialog', { name: 'Edit Physical Stats' });
  await expect(editor.getByLabel('Height', { exact: true })).toHaveCount(0);
  await editor.getByLabel('Strength (arms)', { exact: true }).fill('8 reps');
  await editor.getByRole('button', { name: 'Save stats' }).click();
  await page.reload();
  const stats = page.getByRole('region', { name: 'Stats', exact: true });
  await expect(stats.getByText('8 reps')).toBeVisible();
  const units = stats.getByRole('switch', { name: 'Metric units' });
  await expect(units).toHaveText('Imperial');
  await expect(stats.getByText('5 ft 8.9 in')).toBeVisible();
  await expect(stats.getByText('158.7 lb')).toBeVisible();
  await units.click();
  await expect(units).toHaveText('Metric');
  await expect(stats.getByText('175 cm')).toBeVisible();
  await expect(stats.getByText('72 kg')).toBeVisible();
  await page.reload();
  await expect(units).toHaveAttribute('aria-checked', 'true');
  const log = page.getByRole('region', { name: 'Status log' });
  await expect(log.getByRole('listitem')).toContainText('Right arm');
  await expect(log.getByRole('listitem')).toContainText('Sore after practice.');
  await expect(log.locator('time')).toHaveAttribute(
    'datetime',
    '2026-11-24T15:00:00.000Z',
  );
});

test('opens a health tray with a meter and static metric labels', async ({
  page,
}) => {
  await page.goto(origin + '/#/home');
  const mental = page.getByRole('button', { name: 'Mental health' });
  const physical = page.getByRole('button', { name: 'Physical health' });
  await mental.click();
  await expect(mental).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByRole('meter', { name: 'Mental example health' }),
  ).toHaveAttribute('aria-valuenow', '62');
  await expect(page.getByText('Sleep', { exact: true })).toBeVisible();
  await physical.click();
  await expect(mental).toHaveAttribute('aria-expanded', 'false');
  const tray = page.getByRole('region', { name: 'Physical health' });
  await expect(tray.getByRole('meter')).toHaveAttribute('aria-valuenow', '81');
  await expect(tray.getByRole('listitem')).toHaveText(['Weight', 'Calories']);
  await tray.getByText('Weight', { exact: true }).click();
  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await physical.click();
  await expect(tray).toBeHidden();
});

test.describe('touch navigation', () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });

  test('opens the About tray on tap', async ({ page }) => {
    await page.goto(origin + '/#/home');
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    const about = page.getByRole('link', { name: 'About', exact: true });
    await expect(about).toBeHidden();
    await menu.tap();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(page).toHaveURL(/#\/home$/);
    await about.tap();
    await expect(page).toHaveURL(/#\/about$/);
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  });

  test('filters the vertical loadout, quick-adds a habit, and completes by swiping', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 520 });
    await page.clock.setFixedTime(new Date('2026-11-24T15:00:00Z'));
    await page.addInitScript(
      (data) =>
        localStorage.setItem('quest-character-v1', JSON.stringify(data)),
      legacy,
    );
    await page.goto(origin + '/#/home');
    const today = page.getByRole('region', { name: 'Quest loadout' });
    const rows = today.getByRole('article');
    await expect(rows).toHaveCount(3);
    await expect(rows.first()).toContainText('Finish the bathroom trim');
    await expect(
      today
        .getByRole('region', { name: 'Today', exact: true })
        .getByRole('heading'),
    ).toHaveText('Today · 2');
    await expect(rows.first()).toContainText('Damage: −6 Shelter');
    await expect(today.getByText(/overdue/i)).toHaveCount(0);
    await expect(today.locator('time')).toHaveCount(0);
    await expect(
      today
        .getByRole('region', { name: 'Upcoming', exact: true })
        .getByRole('heading'),
    ).toHaveText('Upcoming · 1');
    expect(
      await rows.first().evaluate((row) => {
        const list = row.parentElement!.parentElement!;
        return list.scrollHeight > list.clientHeight;
      }),
    ).toBe(true);
    await today.getByRole('button', { name: 'M (Medium)', exact: true }).tap();
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Plan a date night');
    await today.getByRole('button', { name: 'Add task' }).tap();
    await expect(page.getByLabel('Quest objective')).toHaveCSS(
      'font-size',
      '16px',
    );
    await expect(
      page.getByRole('combobox', { name: 'Type', exact: true }),
    ).toHaveCSS('font-size', '16px');
    await page.getByLabel('Quest objective').fill('Take a walk');
    await page
      .getByRole('combobox', { name: 'Type', exact: true })
      .selectOption('habit');
    await page.getByRole('button', { name: 'Create Habit' }).click();
    await expect(rows).toHaveCount(2);
    await expect(
      rows
        .filter({ hasText: 'Take a walk' })
        .getByRole('img', { name: 'Habit' }),
    ).toBeVisible();
    await today
      .getByRole('button', { name: 'M (Medium)', exact: true })
      .click();
    const quest = today.getByRole('button', {
      name: 'Complete Finish the bathroom trim',
    });
    const box = await quest.boundingBox();
    if (!box) throw new Error('Quest row not visible');
    const client = await page.context().newCDPSession(page);
    const y = Math.round(box.y + box.height / 2);
    const startX = Math.round(box.x + 12);
    async function swipe(fraction: number) {
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y }],
      });
      for (const step of [0.2, 0.4, 0.6, 0.8, 1]) {
        const x = Math.round(startX + box!.width * fraction * step);
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x, y }],
        });
      }
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
    }
    await swipe(0.4);
    await expect(quest).toHaveCSS('transform', 'none');
    await expect(rows).toHaveCount(4);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await swipe(0.7);
    const reward = page.getByRole('dialog', { name: 'Quest complete' });
    await expect(
      reward.getByRole('progressbar', { name: 'General experience' }),
    ).toBeVisible();
    await reward.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(rows).toHaveCount(3);
    await expect(page).toHaveURL(/#\/home$/);
  });
});

test('fresh profile, class, skill, quests, XP, counts and reload', async ({
  page,
}) => {
  await page.goto(origin + '/#/home');
  await expect(
    page.getByRole('heading', { name: 'Adventurer', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Quest loadout' }).getByRole('article'),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await page.getByLabel('First name').fill('Taylor');
  await page.getByLabel('Last name').fill('Quest');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('link', { name: 'Classes', exact: true }).click();
  await page.getByRole('button', { name: '+ New class', exact: true }).click();
  await page.getByLabel('Class name').fill('Writer');
  await page
    .getByRole('combobox', { name: 'Category', exact: true })
    .selectOption('artistic');
  await page.getByRole('button', { name: 'Create Class', exact: true }).click();
  await page.getByLabel('New skill for Writer').fill('Stories');
  await page.getByRole('button', { name: '+ Add skill', exact: true }).click();
  await page.locator('#portrait-quest-badge').click();
  await page.getByRole('button', { name: '+ New quest', exact: true }).click();
  await page.getByLabel('Quest objective').fill('Write a scene');
  await page
    .getByRole('combobox', { name: 'Skill', exact: true })
    .selectOption({ label: 'Stories' });
  await page.getByLabel('Deadline', { exact: true }).fill('2027-05-01');
  await page.getByRole('switch', { name: /No damage/ }).check();
  await page.getByRole('button', { name: 'Create Quest', exact: true }).click();
  await expect(page.locator('#portrait-quest-count')).toHaveText('1');
  await page.getByRole('button', { name: '+ New quest', exact: true }).click();
  await page.getByLabel('Quest objective').fill('Read a story');
  await page.getByRole('button', { name: 'Create Quest', exact: true }).click();
  await page
    .getByRole('button', { name: 'Edit Read a story', exact: true })
    .click();
  const editQuest = page.getByRole('dialog', {
    name: 'Edit quest',
    exact: true,
  });
  await expect(editQuest.getByLabel('Quest objective')).toHaveValue(
    'Read a story',
  );
  await editQuest.getByLabel('Quest objective').fill('Read another story');
  await editQuest
    .getByRole('button', { name: 'Save changes', exact: true })
    .click();
  await expect(page.locator('#portrait-quest-count')).toHaveText('2');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Write a scene' }),
  ).toBeVisible();
  const completeScene = page.getByRole('button', {
    name: 'Complete Write a scene',
    exact: true,
  });
  await completeScene.click();
  await expect(
    page.getByRole('button', { name: 'Cancel', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(completeScene).toBeFocused();
  await expect(page.locator('#portrait-quest-count')).toHaveText('2');
  await completeScene.click();
  await page.getByRole('button', { name: 'Confirm completion' }).click();
  const reward = page.getByRole('dialog', { name: 'Quest complete' });
  await expect(reward.getByText('Stories · +100 XP')).toBeVisible();
  await expect(reward.getByText('Level 1 → 2')).toBeVisible();
  await expect(
    reward.getByRole('progressbar', { name: 'Stories experience' }),
  ).toHaveAttribute('aria-valuemax', '150');
  await reward.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('#portrait-quest-count')).toHaveText('1');
  await expect(
    page.getByRole('button', { name: 'Complete Read another story' }),
  ).toBeFocused();
  await page
    .getByRole('button', { name: 'Complete Read another story' })
    .click();
  await page.getByRole('button', { name: 'Confirm completion' }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('#portrait-quest-count')).toHaveText('0');
  await page.reload();
  const completedLog = page.getByRole('region', { name: /Completed quests/ });
  await expect(completedLog.getByRole('listitem')).toHaveCount(2);
  await expect(
    completedLog.getByText('Write a scene', { exact: true }),
  ).toBeVisible();
  await expect(
    completedLog.getByText('Read another story', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /^Complete / })).toHaveCount(0);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('quest-character-v2')!),
  );
  expect(
    saved.classes[0].skills.find((s: { name: string }) => s.name === 'Stories')
      .xp,
  ).toBe(100);
  expect(saved.classes[0].xp).toBe(200);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('link', { name: 'Classes', exact: true }).click();
  await page.getByRole('button', { name: 'Edit class Writer' }).click();
  await page.getByLabel('Class name').fill('Author');
  await page.getByLabel('Class level').fill('4');
  await page.getByRole('button', { name: 'Save class' }).click();
  await page.getByRole('button', { name: 'Edit skill Stories' }).click();
  await page.getByLabel('Skill name').fill('Fiction');
  await page.getByLabel('Skill level').fill('3');
  await page.getByRole('button', { name: 'Save skill' }).click();
  await page.reload();
  const author = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: 'Author', exact: true }),
  });
  await expect(author.getByText('Level 4', { exact: true })).toBeVisible();
  await expect(author.getByText('Level 3', { exact: true })).toBeVisible();
  await expect(
    author.getByRole('progressbar', { name: 'Fiction experience' }),
  ).toHaveAttribute('aria-valuemax', '225');
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Taylor Quest', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('region', { name: 'Quest loadout' }).getByRole('article'),
  ).toHaveCount(0);
});
test('migrates legacy saves and displays the quest loadout on desktop and mobile', async ({
  page,
}) => {
  await page.addInitScript(
    (data) => localStorage.setItem('quest-character-v1', JSON.stringify(data)),
    legacy,
  );
  await page.goto(origin + '/#/home');
  await expect(
    page.getByRole('region', { name: 'Quest loadout' }).getByRole('article'),
  ).toHaveCount(3);
  const migration = await page.evaluate(() => ({
    old: localStorage.getItem('quest-character-v1'),
    backup: localStorage.getItem('quest-character-v1-backup'),
    current: JSON.parse(localStorage.getItem('quest-character-v2')!),
  }));
  expect(migration.old).toBe(migration.backup);
  expect(migration.current.classes[0].skills[0].xp).toBe(640);
  expect(typeof migration.current.quests[0].classId).toBe('string');
  await expect(
    page.getByRole('heading', { name: 'Character details' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Your next quests' }),
  ).toHaveCount(0);
  await expect(page.locator('main .topline, main .footer')).toHaveCount(0);
  await fs.mkdir('artifacts', { recursive: true });
  await page.screenshot({
    path: 'artifacts/quest-desktop.png',
    fullPage: true,
  });
  await expect(page.locator('#portrait-quest-badge')).toHaveCount(0);
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 812 });
    await expect(
      page.getByRole('button', { name: 'Add task', exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'artifacts/quest-mobile.png', fullPage: true });
  await expect(
    page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: /quest/i }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Menu', exact: true }).press('Enter');
  await page.getByRole('link', { name: 'Quest Log', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Your quests', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '+ New quest' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: '+ New quest' })).toBeFocused();
});
test('hash navigation, history, reload and a repository subpath', async ({
  page,
}) => {
  await page.goto(origin + '/quest_huad/#/quests');
  await expect(
    page.getByRole('heading', { name: 'Your quests', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'About you' })).toBeFocused();
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Your quests', exact: true }),
  ).toBeVisible();
  await page.goForward();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'About you' })).toBeVisible();
  await page.goto(origin + '/quest_huad/#/missing');
  await expect(
    page.getByRole('heading', { name: 'Adventurer', exact: true }),
  ).toBeVisible();
});
test('explicit backup import recovers malformed data and supports export', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('quest-character-v2', 'malformed original');
      sessionStorage.setItem('seeded', 'yes');
    }
  });
  await page.goto(origin + '/#/backups');
  await expect(page.getByRole('alert')).toContainText(
    'Automatic saving is paused',
  );
  await page.getByLabel('Import backup').setInputFiles({
    name: 'legacy.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy)),
  });
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Import backup', exact: true })
    .click();
  await expect(page.locator('#portrait-quest-count')).toHaveText('3');
  await expect(page.getByRole('alert')).not.toBeVisible();
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage)
        .filter((k) => k.includes('before-import'))
        .map((k) => localStorage.getItem(k)),
    ),
  ).toContain('malformed original');
  const downloaded = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Export backup', exact: true })
    .click();
  const download = await downloaded;
  expect(
    JSON.parse(await fs.readFile((await download.path())!, 'utf8')).version,
  ).toBe(2);
  await page.reload();
  await expect(page.locator('#portrait-quest-count')).toHaveText('3');
});
test('storage-denied sessions remain usable and clearly report the limitation', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Storage denied');
      },
    }),
  );
  await page.goto(origin + '/#/home');
  await expect(
    page.getByRole('heading', { name: 'Adventurer', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Storage denied');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await page.getByLabel('First name').fill('Session only');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Session only', exact: true }),
  ).toBeVisible();
});

test('quota failures preserve in-memory progress and allow backup export', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException('Storage full', 'QuotaExceededError');
    };
  });
  await page.goto(origin + '/#/about');
  await page.getByLabel('First name').fill('Unsaved progress');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Browser storage is unavailable',
  );
  await page.getByRole('link', { name: 'Manage backups' }).click();
  const pending = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Export backup', exact: true })
    .click();
  const download = await pending;
  const backup = JSON.parse(
    await fs.readFile((await download.path())!, 'utf8'),
  );
  expect(backup.profile.firstName).toBe('Unsaved progress');
  expect(
    await page.evaluate(() => localStorage.getItem('quest-character-v2')),
  ).toBeNull();
});

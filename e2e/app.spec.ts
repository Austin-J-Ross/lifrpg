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
test('fresh profile, class, skill, quests, XP, counts and reload', async ({
  page,
}) => {
  await page.goto(origin + '/#/home');
  await expect(
    page.getByRole('heading', { name: 'Adventurer', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#portrait-quest-count')).toHaveText('0');
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await page.getByLabel('First name').fill('Taylor');
  await page.getByLabel('Last name').fill('Quest');
  await page.getByRole('button', { name: 'Save profile' }).click();
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
  await expect(page.locator('#portrait-quest-count')).toHaveText('2');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Write a scene' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Complete Write a scene', exact: true })
    .click();
  await expect(page.locator('#portrait-quest-count')).toHaveText('1');
  await expect(
    page.getByRole('button', { name: 'Complete Read a story' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Complete Read a story' }).click();
  await expect(page.locator('#portrait-quest-count')).toHaveText('0');
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('quest-character-v2')!),
  );
  expect(
    saved.classes[0].skills.find((s: { name: string }) => s.name === 'Stories')
      .xp,
  ).toBe(100);
  expect(saved.classes[0].xp).toBe(200);
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Taylor Quest', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator('#portrait-quest-count')).toHaveText('0');
});
test('migrates legacy saves and displays the requested badge on desktop and mobile', async ({
  page,
}) => {
  await page.addInitScript(
    (data) => localStorage.setItem('quest-character-v1', JSON.stringify(data)),
    legacy,
  );
  await page.goto(origin + '/#/home');
  await expect(page.locator('#portrait-quest-count')).toHaveText('3');
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
  const colors = await page.locator('#portrait-quest-badge').evaluate((el) => ({
    outer: getComputedStyle(el).backgroundColor,
    inner: getComputedStyle(el.firstElementChild!).backgroundColor,
  }));
  expect(colors).toEqual({
    outer: 'rgb(182, 184, 181)',
    inner: 'rgb(179, 63, 66)',
  });
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 812 });
    await expect(page.locator('#portrait-quest-badge')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'artifacts/quest-mobile.png', fullPage: true });
  await page.locator('#portrait-quest-badge').focus();
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
  await page.goto(origin + '/#/about');
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

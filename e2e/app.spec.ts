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
test('logs and recalls readings through their domain rings', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-11-23T15:00:00Z'));
  await page.goto(origin + '/#/home');
  await page.getByRole('button', { name: 'Mental health' }).click();
  const mental = page.getByRole('dialog', { name: 'Mental health' });
  await expect(
    mental.getByText('No entry', { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await mental.getByRole('button', { name: 'Log sleep' }).click();
  await mental.getByLabel('Wake-up date').fill('2026-11-22');
  await mental.getByLabel('Hours slept').fill('7.5');
  await mental.getByRole('button', { name: 'Save sleep' }).click();
  await expect(
    mental.getByText('No entry', { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await mental.getByText('Sleep history').click();
  await expect(mental.getByText('7.5 h')).toBeVisible();
  await mental.getByRole('button', { name: 'Close', exact: true }).click();

  await page.getByRole('button', { name: 'Physical health' }).click();
  const physical = page.getByRole('dialog', { name: 'Physical health' });
  await physical.getByRole('button', { name: 'Log weight' }).click();
  await physical.getByLabel('Date', { exact: true }).fill('2026-11-21');
  await physical
    .getByRole('spinbutton', { name: 'Weight', exact: true })
    .fill('72.4');
  await physical.getByLabel('Unit').selectOption('kg');
  await physical.getByRole('button', { name: 'Save weight' }).click();
  await physical.getByRole('button', { name: 'Log calories' }).click();
  await physical.getByLabel('Daily calories (kcal)').fill('1850');
  await physical.getByRole('button', { name: 'Save calories' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Physical health' }).click();
  await expect(
    physical.getByText('72.4 kg').filter({ visible: true }),
  ).toBeVisible();
  await expect(
    physical.locator('time[datetime="2026-11-21"]').first(),
  ).toBeVisible();
  await expect(
    physical.getByText('1,850 kcal').filter({ visible: true }),
  ).toBeVisible();
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

  test('scrolls Today quests horizontally and completes them without changing pages', async ({
    page,
  }) => {
    await page.addInitScript(
      (data) =>
        localStorage.setItem('quest-character-v1', JSON.stringify(data)),
      legacy,
    );
    await page.goto(origin + '/#/home');
    const today = page.getByRole('region', { name: 'Today' });
    const cards = today.getByRole('article');
    await expect(cards).toHaveCount(3);
    const complete = cards.first().getByRole('button', { name: /^Complete / });
    await expect(complete).toHaveText('Complete');
    await expect(complete).toBeInViewport();
    const box = await cards.first().boundingBox();
    if (!box) throw new Error('Today quest cards are missing');
    const client = await page.context().newCDPSession(page);
    const y = Math.round(box.y + 20);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 280, y }],
    });
    for (const x of [240, 200, 160, 120, 80]) {
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y }],
      });
    }
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await expect
      .poll(() =>
        cards.first().evaluate((card) => card.parentElement!.scrollLeft),
      )
      .toBeGreaterThan(0);
    await expect(page).toHaveURL(/#\/home$/);
    await cards
      .nth(1)
      .getByRole('button', { name: /^Complete / })
      .click();
    await expect(cards).toHaveCount(2);
    await expect(
      today.getByRole('link', { name: '2 active quests. View quests' }),
    ).toBeVisible();
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Quests' })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Your quests' }),
    ).toBeVisible();
  });
});

test('fresh profile, class, skill, quests, XP, counts and reload', async ({
  page,
}) => {
  await page.goto(origin + '/#/home');
  await expect(
    page.getByRole('heading', { name: 'Adventurer', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#portrait-quest-count')).toHaveText('0');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
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
  await expect(
    page.getByRole('link', { name: '3 active quests. View quests' }),
  ).toHaveText('3active quests');
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

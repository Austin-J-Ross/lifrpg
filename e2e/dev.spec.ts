import { test, expect } from '@playwright/test';
import { createServer } from 'vite';
import fs from 'node:fs/promises';
test('development modules and explicit demo boot through Vite transforms', async ({
  page,
}) => {
  const server = await createServer({
    server: { middlewareMode: true, hmr: false, watch: null },
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    // HMR transport is not under test; keep the offline browser off real sockets.
    await page.routeWebSocket('**', (socket) =>
      socket.send(JSON.stringify({ type: 'connected' })),
    );
    await page.route('http://quest-dev.local/**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/') {
        await route.fulfill({
          contentType: 'text/html',
          body: await server.transformIndexHtml(
            '/',
            await fs.readFile('index.html', 'utf8'),
          ),
        });
        return;
      }
      const result = await server.transformRequest(url.pathname + url.search);
      if (result)
        await route.fulfill({
          contentType: 'text/javascript',
          body: result.code,
        });
      else await route.fulfill({ status: 404 });
    });
    await page.goto('http://quest-dev.local/?demo=1#/home');
    await expect(
      page.getByRole('heading', { name: 'Douglas', exact: true }),
    ).toBeVisible();
    await expect(page.locator('#portrait-quest-count')).toHaveText('3');
    await expect(page.getByRole('alert')).toContainText('Demo session');
    await fs.mkdir('artifacts', { recursive: true });
    await page.screenshot({
      path: 'artifacts/quest-dev-preview.png',
      fullPage: true,
    });
    expect(errors).toEqual([]);
  } finally {
    await server.close();
  }
});

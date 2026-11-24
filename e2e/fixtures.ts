import { test as base, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
// Serve the actual production assets in-browser; no open server port is required.
export const test = base.extend({
  page: async ({ page }, provide) => {
    const root = path.resolve('dist');
    await page.route('http://quest.local/**', async (route) => {
      const url = new URL(route.request().url());
      let pathname = decodeURIComponent(url.pathname).replace(
        /^\/quest_huad(?=\/)/,
        '',
      );
      if (pathname === '/' || pathname === '') pathname = '/index.html';
      const file = path.resolve(root, '.' + pathname);
      if (!file.startsWith(root + path.sep)) {
        await route.fulfill({ status: 404 });
        return;
      }
      try {
        await route.fulfill({
          body: await fs.readFile(file),
          contentType: file.endsWith('.js')
            ? 'text/javascript'
            : file.endsWith('.css')
              ? 'text/css'
              : file.endsWith('.html')
                ? 'text/html'
                : 'application/octet-stream',
        });
      } catch {
        await route.fulfill({ status: 404 });
      }
    });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await provide(page);
    expect(errors).toEqual([]);
  },
});
export { expect };

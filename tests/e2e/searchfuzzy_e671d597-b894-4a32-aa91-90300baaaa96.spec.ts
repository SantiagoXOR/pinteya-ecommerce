
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('SearchFuzzy_2025-10-14', async ({ page, context }) => {
  
    // Navigate to URL
    await page.goto('http://localhost:3001/search?search=latex', { waitUntil: 'load' });

    // Navigate to URL
    await page.goto('http://localhost:3000/search?search=latex', { waitUntil: 'load' });

    // Take screenshot
    await page.screenshot({ path: 'search-latex.png', { fullPage: true } });

    // Navigate to URL
    await page.goto('http://localhost:3000/search?search=impregnantes', { waitUntil: 'load' });

    // Take screenshot
    await page.screenshot({ path: 'search-impregnantes.png', { fullPage: true } });
});
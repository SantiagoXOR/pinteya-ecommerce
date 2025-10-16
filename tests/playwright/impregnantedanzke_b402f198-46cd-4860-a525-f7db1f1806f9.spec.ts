
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('ImpregnanteDanzke_2025-10-15', async ({ page, context }) => {
  
    // Navigate to URL
    await page.goto('http://localhost:3000/search?q=impregnantes');

    // Click element
    await page.click('text=Impregnante Danzke >> nth=0');

    // Take screenshot
    await page.screenshot({ path: 'search-impregnantes-grid-2.png', { fullPage: true } });

    // Click element
    await page.click('css=[data-testid="commercial-product-card"]:nth-match(1)');

    // Click element
    await page.click('css=[data-testid="commercial-product-card"] >> nth=0');

    // Take screenshot
    await page.screenshot({ path: 'search-impregnantes-modal.png', { fullPage: true } });
});
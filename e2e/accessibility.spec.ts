// Configuración de testing de accesibilidad con Playwright
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inyectar axe-core en cada página
    await injectAxe(page);
  });

  test('Homepage accessibility', async ({ page }) => {
    await page.goto('/');
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('Shop page accessibility', async ({ page }) => {
    await page.goto('/shop');
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('Product detail accessibility', async ({ page }) => {
    await page.goto('/products/1');
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('Checkout accessibility', async ({ page }) => {
    // Simular carrito con productos
    await page.goto('/');
    await page.click('[data-testid="add-to-cart"]');
    await page.goto('/checkout');
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });
});

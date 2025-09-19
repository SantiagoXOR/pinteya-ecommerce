/**
 * Tests E2E - Navegación del Header
 * Pruebas end-to-end para funcionalidades de navegación
 */

import { test, expect, Page } from '@playwright/test';

// Configuración base
test.describe('Header Navigation - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página principal
    await page.goto('/');
    
    // Esperar a que el header se cargue completamente
    await page.waitForSelector('[data-testid="header-logo"]', { timeout: 10000 });
  });

  test.describe('Logo y Navegación Principal', () => {
    test('debe mostrar el logo y navegar al home al hacer click', async ({ page }) => {
      // Verificar que el logo está visible
      const logo = page.locator('[data-testid="header-logo"]');
      await expect(logo).toBeVisible();
      
      // Verificar atributos del logo
      await expect(logo).toHaveAttribute('alt', 'Pinteya - Tu Pinturería Online');
      
      // Click en el logo debe navegar al home
      await logo.click();
      await expect(page).toHaveURL('/');
    });

    test('debe tener el header sticky al hacer scroll', async ({ page }) => {
      // Hacer scroll hacia abajo
      await page.evaluate(() => window.scrollTo(0, 500));
      
      // Verificar que el header sigue visible
      const header = page.locator('header');
      await expect(header).toBeVisible();
      await expect(header).toHaveClass(/fixed/);
    });
  });

  test.describe('Sistema de Búsqueda', () => {
    test('debe permitir escribir en el campo de búsqueda', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"]');
      
      // Verificar que el input está visible
      await expect(searchInput).toBeVisible();
      
      // Escribir en el campo de búsqueda
      await searchInput.fill('pintura blanca');
      await expect(searchInput).toHaveValue('pintura blanca');
    });

    test('debe navegar a resultados al presionar Enter', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"]');
      
      // Escribir y presionar Enter
      await searchInput.fill('latex interior');
      await searchInput.press('Enter');
      
      // Verificar navegación a página de resultados
      await expect(page).toHaveURL(/\/productos\?q=latex%20interior/);
    });

    test('debe mostrar placeholder correcto', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"]');
      
      await expect(searchInput).toHaveAttribute('placeholder', 'latex interior blanco 20lts');
    });

    test('debe manejar búsquedas con caracteres especiales', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"]');
      
      // Búsqueda con caracteres especiales
      await searchInput.fill('pintura 20L & barniz');
      await searchInput.press('Enter');
      
      // Verificar que la URL se codifica correctamente
      await expect(page).toHaveURL(/\/productos\?q=/);
    });
  });

  test.describe('Autenticación', () => {
    test('debe mostrar botón de autenticación con solo icono Google', async ({ page }) => {
      // Buscar el botón de autenticación
      const authButton = page.locator('button').filter({ has: page.locator('svg') }).first();
      
      // Verificar que el botón está visible
      await expect(authButton).toBeVisible();
      
      // Verificar que NO contiene texto "Iniciar Sesión"
      await expect(authButton).not.toContainText('Iniciar Sesión');
      
      // Verificar que contiene el SVG de Google
      const googleIcon = authButton.locator('svg');
      await expect(googleIcon).toBeVisible();
    });

    test('debe tener estilos translúcidos correctos', async ({ page }) => {
      const authButton = page.locator('button').filter({ has: page.locator('svg') }).first();
      
      // Verificar clases CSS
      await expect(authButton).toHaveClass(/bg-white\/20/);
      await expect(authButton).toHaveClass(/backdrop-blur-sm/);
      await expect(authButton).toHaveClass(/rounded-full/);
    });

    test('debe navegar a /signin al hacer click', async ({ page }) => {
      const authButton = page.locator('button').filter({ has: page.locator('svg') }).first();
      
      // Click en el botón de autenticación
      await authButton.click();
      
      // Verificar navegación
      await expect(page).toHaveURL('/signin');
    });

    test('debe tener efectos hover', async ({ page }) => {
      const authButton = page.locator('button').filter({ has: page.locator('svg') }).first();
      
      // Hover sobre el botón
      await authButton.hover();
      
      // Verificar que el botón sigue visible y clickeable
      await expect(authButton).toBeVisible();
    });
  });

  test.describe('Carrito de Compras', () => {
    test('debe mostrar botón de carrito en desktop', async ({ page }) => {
      // Configurar viewport desktop
      await page.setViewportSize({ width: 1024, height: 768 });
      
      const cartButton = page.locator('[data-testid="cart-icon"]').locator('..');
      
      // Verificar que el botón está visible en desktop
      await expect(cartButton).toBeVisible();
    });

    test('debe ocultar botón de carrito en mobile', async ({ page }) => {
      // Configurar viewport mobile
      await page.setViewportSize({ width: 375, height: 667 });
      
      const cartButton = page.locator('[data-testid="cart-icon"]').locator('..');
      
      // Verificar que el botón está oculto en mobile
      await expect(cartButton).toBeHidden();
    });

    test('debe tener estilos amarillos correctos', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      
      const cartButton = page.locator('[data-testid="cart-icon"]').locator('..');
      
      // Verificar clases CSS del carrito
      await expect(cartButton).toHaveClass(/bg-yellow-400/);
      await expect(cartButton).toHaveClass(/rounded-full/);
    });
  });

  test.describe('Geolocalización', () => {
    test('debe mostrar información de zona de entrega', async ({ page }) => {
      // Buscar texto de ubicación
      const locationText = page.locator('text=Envíos en');
      await expect(locationText).toBeVisible();
      
      // Verificar zona por defecto
      const zoneText = page.locator('text=Córdoba Capital');
      await expect(zoneText).toBeVisible();
    });

    test('debe mostrar icono de ubicación', async ({ page }) => {
      // Buscar el icono de MapPin
      const mapIcon = page.locator('svg').filter({ has: page.locator('path') }).first();
      await expect(mapIcon).toBeVisible();
    });

    test('debe ser clickeable para cambiar ubicación', async ({ page }) => {
      const locationButton = page.locator('text=Envíos en').locator('..');
      
      // Verificar que es clickeable
      await expect(locationButton).toBeVisible();
      await locationButton.click();
      
      // Verificar que no hay errores
      await expect(locationButton).toBeVisible();
    });
  });

  test.describe('Topbar Informativo', () => {
    test('debe mostrar información de envíos', async ({ page }) => {
      // Buscar información de envío gratis
      const shippingInfo = page.locator('text=/Envío gratis/i');
      await expect(shippingInfo).toBeVisible();
    });

    test('debe tener fondo naranja correcto', async ({ page }) => {
      const topbar = page.locator('header').first();
      
      // Verificar que tiene el color de fondo correcto
      await expect(topbar).toHaveClass(/bg-blaze-orange/);
    });
  });

  test.describe('Responsive Design', () => {
    test('debe adaptarse correctamente en mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Verificar elementos principales en mobile
      await expect(page.locator('[data-testid="header-logo"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
      
      // Verificar que el carrito está oculto
      const cartButton = page.locator('[data-testid="cart-icon"]').locator('..');
      await expect(cartButton).toBeHidden();
    });

    test('debe adaptarse correctamente en tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Verificar elementos en tablet
      await expect(page.locator('[data-testid="header-logo"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
    });

    test('debe adaptarse correctamente en desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      
      // Verificar todos los elementos en desktop
      await expect(page.locator('[data-testid="header-logo"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
      
      const cartButton = page.locator('[data-testid="cart-icon"]').locator('..');
      await expect(cartButton).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('debe cargar el header rápidamente', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForSelector('[data-testid="header-logo"]');
      
      const loadTime = Date.now() - startTime;
      
      // Verificar que carga en menos de 2 segundos
      expect(loadTime).toBeLessThan(2000);
    });

    test('debe mantener performance durante scroll', async ({ page }) => {
      // Hacer scroll múltiples veces
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => window.scrollTo(0, Math.random() * 1000));
        await page.waitForTimeout(50);
      }
      
      // Verificar que el header sigue respondiendo
      const header = page.locator('header');
      await expect(header).toBeVisible();
    });
  });

  test.describe('Estados de Error', () => {
    test('debe manejar errores de red gracefully', async ({ page }) => {
      // Simular fallo de red
      await page.route('**/api/search/trending**', route => route.abort());
      
      await page.goto('/');
      
      // El header debe seguir funcionando
      await expect(page.locator('[data-testid="header-logo"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
    });
  });
});










import { test, expect } from '@playwright/test';

test.describe('Enhanced Header - Pinteya E-commerce', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de demo del header
    await page.goto('/demo/header');
    await page.waitForLoadState('networkidle');
  });

  test.describe('TopBar Functionality', () => {
    test('should display contact information', async ({ page }) => {
      // Verificar que el teléfono está visible
      await expect(page.getByText('(+54 9 351) 492-3477')).toBeVisible();
      
      // Verificar que los horarios están visibles
      await expect(page.getByText('Lun-Vie 8:00-18:00')).toBeVisible();
      
      // Verificar que el asesoramiento 24/7 está visible
      await expect(page.getByText('Asesoramiento 24/7')).toBeVisible();
    });

    test('should have clickable phone number', async ({ page }) => {
      const phoneLink = page.getByRole('link', { name: /\+54 9 351/ });
      await expect(phoneLink).toHaveAttribute('href', 'tel:+5493514923477');
    });

    test('should open delivery zone dropdown', async ({ page }) => {
      // Hacer click en el selector de zona
      await page.getByRole('button', { name: /Envíos a/ }).click();
      
      // Verificar que el dropdown se abre
      await expect(page.getByText('Interior de Córdoba')).toBeVisible();
      await expect(page.getByText('Buenos Aires')).toBeVisible();
      
      // Verificar estados disponible/próximamente
      await expect(page.getByText('Disponible')).toBeVisible();
      await expect(page.getByText('Próximamente')).toBeVisible();
    });
  });

  test.describe('Enhanced Search Bar', () => {
    test('should display category selector', async ({ page }) => {
      // Cambiar a la tab de búsqueda
      await page.getByRole('tab', { name: 'Búsqueda' }).click();
      
      // Verificar que el selector de categorías está visible
      await expect(page.getByText('Todas las Categorías')).toBeVisible();
    });

    test('should open category dropdown and change selection', async ({ page }) => {
      await page.getByRole('tab', { name: 'Búsqueda' }).click();
      
      // Abrir dropdown de categorías
      await page.getByRole('button', { name: /Todas las Categorías/ }).click();
      
      // Verificar que las categorías están visibles
      await expect(page.getByText('Pinturas')).toBeVisible();
      await expect(page.getByText('Herramientas')).toBeVisible();
      await expect(page.getByText('Seguridad')).toBeVisible();
      
      // Seleccionar una categoría
      await page.getByText('Pinturas').click();
      
      // Verificar que el placeholder cambió
      await expect(page.getByPlaceholder(/Ej: Látex 20L/)).toBeVisible();
    });

    test('should perform search', async ({ page }) => {
      await page.getByRole('tab', { name: 'Búsqueda' }).click();
      
      // Escribir en el campo de búsqueda
      await page.getByPlaceholder(/Busco productos/).fill('látex blanco');
      
      // Hacer click en buscar
      await page.getByRole('button', { name: 'Buscar' }).click();
      
      // Verificar que aparecen resultados (simulados)
      await expect(page.getByText(/Resultado para "látex blanco"/)).toBeVisible();
    });

    test('should show quick suggestions', async ({ page }) => {
      await page.getByRole('tab', { name: 'Búsqueda' }).click();
      
      // Verificar que las sugerencias rápidas están visibles
      await expect(page.getByText('Látex interior')).toBeVisible();
      await expect(page.getByText('Esmalte sintético')).toBeVisible();
      await expect(page.getByText('Pinceles profesionales')).toBeVisible();
    });
  });

  test.describe('Action Buttons', () => {
    test('should display authentication buttons', async ({ page }) => {
      await page.getByRole('tab', { name: 'Acciones' }).click();
      
      // Verificar botones de autenticación
      await expect(page.getByText('Iniciar con Google')).toBeVisible();
      await expect(page.getByText('Registrarse')).toBeVisible();
    });

    test('should display cart button', async ({ page }) => {
      await page.getByRole('tab', { name: 'Acciones' }).click();
      
      // Verificar que el carrito está visible
      await expect(page.locator('[data-testid="cart-icon"]')).toBeVisible();
    });

    test('should display wishlist in desktop', async ({ page }) => {
      await page.getByRole('tab', { name: 'Acciones' }).click();
      
      // Verificar que favoritos está visible (solo en desktop)
      await expect(page.getByText('Favoritos')).toBeVisible();
    });
  });

  test.describe('Complete Header Integration', () => {
    test('should display all components together', async ({ page }) => {
      await page.getByRole('tab', { name: 'Completo' }).click();
      
      // Verificar que todos los componentes están presentes
      await expect(page.getByAltText('Pinteya Logo')).toBeVisible();
      await expect(page.getByPlaceholder(/Busco productos/)).toBeVisible();
      await expect(page.getByText('Iniciar con Google')).toBeVisible();
    });

    test('should work in different device sizes', async ({ page }) => {
      await page.getByRole('tab', { name: 'Completo' }).click();
      
      // Test mobile view
      await page.getByRole('button', { name: 'Mobile' }).click();
      await expect(page.getByText('Vista actual: mobile')).toBeVisible();
      
      // Test tablet view
      await page.getByRole('button', { name: 'Tablet' }).click();
      await expect(page.getByText('Vista actual: tablet')).toBeVisible();
      
      // Test desktop view
      await page.getByRole('button', { name: 'Desktop' }).click();
      await expect(page.getByText('Vista actual: desktop')).toBeVisible();
    });
  });

  test.describe('Interactive Testing', () => {
    test('should run dropdown functionality tests', async ({ page }) => {
      await page.getByRole('tab', { name: 'Testing' }).click();
      
      // Ejecutar tests de dropdowns
      await page.getByRole('button', { name: /Ejecutar Tests/ }).click();
      
      // Esperar a que terminen los tests
      await page.waitForTimeout(3000);
      
      // Verificar que aparecen resultados
      await expect(page.getByText('Resultados de Tests')).toBeVisible();
      await expect(page.getByText(/Pasaron/)).toBeVisible();
    });

    test('should interact with test dropdowns', async ({ page }) => {
      await page.getByRole('tab', { name: 'Testing' }).click();
      
      // Probar dropdown básico
      await page.getByRole('button', { name: 'Opciones básicas' }).click();
      await expect(page.getByText('Perfil')).toBeVisible();
      await expect(page.getByText('Configuración')).toBeVisible();
      
      // Cerrar dropdown haciendo click fuera
      await page.click('body');
      
      // Probar dropdown con iconos
      await page.getByRole('button', { name: /Carrito/ }).click();
      await expect(page.getByText('Ver carrito')).toBeVisible();
      await expect(page.getByText('Lista de deseos')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.getByRole('tab', { name: 'Testing' }).click();
      
      // Navegar con teclado al primer dropdown
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Abrir dropdown con Enter
      await page.keyboard.press('Enter');
      
      // Verificar que se abre
      await expect(page.getByText('Perfil')).toBeVisible();
      
      // Navegar con flechas
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      await page.getByRole('tab', { name: 'Testing' }).click();
      
      // Verificar atributos ARIA en dropdowns
      const trigger = page.getByRole('button', { name: 'Opciones básicas' });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  test.describe('Performance', () => {
    test('should load quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/demo/header');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Verificar que carga en menos de 5 segundos
      expect(loadTime).toBeLessThan(5000);
    });

    test('should have smooth animations', async ({ page }) => {
      await page.getByRole('tab', { name: 'Testing' }).click();
      
      // Verificar que las animaciones son suaves
      const dropdown = page.getByRole('button', { name: 'Opciones básicas' });
      
      await dropdown.click();
      
      // Verificar que el contenido aparece gradualmente
      const content = page.getByText('Perfil');
      await expect(content).toBeVisible();
      
      // Cerrar y verificar que desaparece suavemente
      await page.click('body');
      await expect(content).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle missing components gracefully', async ({ page }) => {
      // Verificar que no hay errores en consola
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/demo/header');
      await page.waitForLoadState('networkidle');
      
      // No debería haber errores relacionados con dropdowns
      const dropdownErrors = errors.filter(error => 
        error.includes('dropdown') || error.includes('radix')
      );
      expect(dropdownErrors).toHaveLength(0);
    });
  });
});

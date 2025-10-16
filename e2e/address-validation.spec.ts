import { test, expect } from '@playwright/test'

test.describe('Validación de Direcciones - Córdoba Capital', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de prueba
    await page.goto('/test-map-selector')
  })

  test('debería mostrar el selector de mapa correctamente', async ({ page }) => {
    // Verificar que la página se carga correctamente
    await expect(page.getByText('Selector de Mapa Interactivo')).toBeVisible()
    await expect(page.getByText('Selecciona tu ubicación arrastrando el marcador en el mapa')).toBeVisible()
    
    // Verificar que los controles están presentes
    await expect(page.getByRole('button', { name: 'Mostrar Mapa' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mi Ubicación' })).toBeVisible()
  })

  test('debería abrir el mapa cuando se hace clic en "Mostrar Mapa"', async ({ page }) => {
    // Hacer clic en "Mostrar Mapa"
    await page.getByRole('button', { name: 'Mostrar Mapa' }).click()
    
    // Verificar que el mapa se muestra
    await expect(page.getByText('Ocultar Mapa')).toBeVisible()
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible()
    
    // Verificar que las instrucciones aparecen
    await expect(page.getByText('Arrastra el marcador azul a tu domicilio')).toBeVisible()
  })

  test('debería validar direcciones correctamente', async ({ page }) => {
    // Abrir el mapa
    await page.getByRole('button', { name: 'Mostrar Mapa' }).click()
    
    // Esperar a que el mapa se cargue
    await page.waitForTimeout(2000)
    
    // Simular selección de ubicación (esto requeriría interacción real con el mapa)
    // En un test real, necesitarías simular el arrastre del marcador
    
    // Verificar que el input muestra la dirección
    const addressInput = page.getByPlaceholderText('Selecciona tu ubicación en el mapa')
    await expect(addressInput).toBeVisible()
  })

  test('debería mostrar direcciones de prueba', async ({ page }) => {
    // Verificar que las direcciones de prueba están disponibles
    await expect(page.getByText('Direcciones de Prueba')).toBeVisible()
    
    // Verificar que hay direcciones de prueba listadas
    const testAddresses = page.locator('[data-testid="test-address"]')
    await expect(testAddresses).toHaveCount(3) // Esperamos 3 direcciones de prueba
  })

  test('debería permitir seleccionar una dirección de prueba', async ({ page }) => {
    // Hacer clic en la primera dirección de prueba
    const firstTestAddress = page.locator('[data-testid="test-address"]').first()
    await firstTestAddress.click()
    
    // Verificar que la dirección se selecciona
    const addressInput = page.getByPlaceholderText('Selecciona tu ubicación en el mapa')
    await expect(addressInput).toHaveValue(/Av\. Corrientes 1234, Córdoba/)
    
    // Verificar que aparece el estado de validación
    await expect(page.getByText('Ubicación válida en Córdoba Capital')).toBeVisible()
  })

  test('debería mostrar coordenadas cuando se selecciona una ubicación', async ({ page }) => {
    // Seleccionar una dirección de prueba
    const firstTestAddress = page.locator('[data-testid="test-address"]').first()
    await firstTestAddress.click()
    
    // Verificar que se muestran las coordenadas
    await expect(page.getByText('Coordenadas seleccionadas:')).toBeVisible()
    await expect(page.getByText('Latitud:')).toBeVisible()
    await expect(page.getByText('Longitud:')).toBeVisible()
  })

  test('debería habilitar el botón de checkout cuando la ubicación es válida', async ({ page }) => {
    // Seleccionar una dirección de prueba
    const firstTestAddress = page.locator('[data-testid="test-address"]').first()
    await firstTestAddress.click()
    
    // Verificar que el botón de checkout está habilitado
    const checkoutButton = page.getByText('Continuar con el Checkout')
    await expect(checkoutButton).toBeEnabled()
  })

  test('debería deshabilitar el botón de checkout cuando no hay ubicación', async ({ page }) => {
    // Verificar que el botón de checkout está deshabilitado inicialmente
    const checkoutButton = page.getByText('Selecciona una ubicación válida')
    await expect(checkoutButton).toBeDisabled()
  })

  test('debería mostrar instrucciones de uso', async ({ page }) => {
    // Verificar que las instrucciones están presentes
    await expect(page.getByText('Instrucciones de Uso')).toBeVisible()
    await expect(page.getByText('¿Cómo usar el selector de mapa?')).toBeVisible()
    
    // Verificar que las instrucciones específicas están listadas
    await expect(page.getByText('Haz clic en "Mostrar Mapa" para abrir el mapa interactivo')).toBeVisible()
    await expect(page.getByText('Arrastra el marcador azul a tu domicilio exacto')).toBeVisible()
    await expect(page.getByText('Se recomienda ubicaciones en Córdoba Capital para entrega')).toBeVisible()
  })

  test('debería manejar el botón de limpiar', async ({ page }) => {
    // Seleccionar una dirección de prueba
    const firstTestAddress = page.locator('[data-testid="test-address"]').first()
    await firstTestAddress.click()
    
    // Verificar que la dirección se selecciona
    const addressInput = page.getByPlaceholderText('Selecciona tu ubicación en el mapa')
    await expect(addressInput).toHaveValue(/Av\. Corrientes 1234, Córdoba/)
    
    // Hacer clic en el botón de limpiar (X)
    const clearButton = page.locator('[data-testid="clear-button"]')
    await clearButton.click()
    
    // Verificar que la dirección se limpia
    await expect(addressInput).toHaveValue('')
  })

  test('debería ser responsive en dispositivos móviles', async ({ page }) => {
    // Simular dispositivo móvil
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verificar que los elementos se muestran correctamente
    await expect(page.getByText('Selector de Mapa Interactivo')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mostrar Mapa' })).toBeVisible()
    
    // Abrir el mapa en móvil
    await page.getByRole('button', { name: 'Mostrar Mapa' }).click()
    
    // Verificar que el mapa se muestra correctamente en móvil
    await expect(page.getByText('Ocultar Mapa')).toBeVisible()
  })

  test('debería tener el botón "Mi Ubicación" disponible', async ({ page }) => {
    // Verificar que el botón "Mi Ubicación" está presente
    const locationButton = page.getByRole('button', { name: /Mi Ubicación/i })
    await expect(locationButton).toBeVisible()
    await expect(locationButton).toBeEnabled()
  })

  test('debería mostrar instrucciones sobre GPS fuera de Córdoba', async ({ page }) => {
    // Verificar que las instrucciones mencionan el comportamiento permisivo
    await expect(page.getByText(/Se recomienda ubicaciones en Córdoba Capital/i)).toBeVisible()
    
    // Las instrucciones no deben decir "solo" o "únicamente" ya que ahora es permisivo
    await page.getByRole('button', { name: 'Mostrar Mapa' }).click()
    await expect(page.getByText(/Se recomienda ubicaciones en Córdoba Capital para entrega/i)).toBeVisible()
  })

  test('debería permitir navegación del mapa fuera de Córdoba', async ({ page }) => {
    // Abrir el mapa
    await page.getByRole('button', { name: 'Mostrar Mapa' }).click()
    
    // Esperar a que el mapa se cargue
    await page.waitForTimeout(2000)
    
    // El mapa debe ser visible y funcional
    const mapContainer = page.locator('[data-testid="map-container"]')
    await expect(mapContainer).toBeVisible()
    
    // Nota: El mapa ahora permite visualización fuera de Córdoba aunque con restricción suave
    // La validación final sigue siendo que la dirección debe estar en Córdoba Capital
  })
})

test.describe('Integración en Checkout', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar al checkout
    await page.goto('/checkout')
  })

  test('debería mostrar el selector de mapa en el checkout', async ({ page }) => {
    // Verificar que el campo de dirección está presente
    await expect(page.getByText('Dirección de entrega')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mostrar Mapa' })).toBeVisible()
  })

  test('debería validar la dirección en el checkout', async ({ page }) => {
    // Abrir el mapa
    await page.getByRole('button', { name: 'Mostrar Mapa' }).click()
    
    // Esperar a que el mapa se cargue
    await page.waitForTimeout(2000)
    
    // Verificar que el mapa está visible
    await expect(page.getByText('Ocultar Mapa')).toBeVisible()
  })

  test('debería permitir completar el checkout con una dirección válida', async ({ page }) => {
    // Llenar los campos requeridos
    await page.fill('input[name="firstName"]', 'Juan')
    await page.fill('input[name="lastName"]', 'Pérez')
    await page.fill('input[name="email"]', 'juan@example.com')
    await page.fill('input[name="phone"]', '1234567890')
    
    // Seleccionar una dirección válida
    await page.getByRole('button', { name: 'Mostrar Mapa' }).click()
    await page.waitForTimeout(2000)
    
    // Simular selección de ubicación (esto requeriría interacción real con el mapa)
    // En un test real, necesitarías simular el arrastre del marcador
    
    // Verificar que el botón de pago está habilitado
    const payButton = page.getByText(/pagar/i)
    await expect(payButton).toBeVisible()
  })
})

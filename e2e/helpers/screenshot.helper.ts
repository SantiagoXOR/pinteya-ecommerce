// ===================================
// SCREENSHOT HELPER
// Funciones auxiliares para capturar screenshots en tests
// ===================================

import { Page } from '@playwright/test'
import path from 'path'

/**
 * Directorio base para screenshots
 */
const SCREENSHOTS_DIR = path.join(process.cwd(), 'test-results', 'screenshots')

/**
 * Genera nombre de archivo con timestamp
 */
function getScreenshotFilename(name: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${name}-${timestamp}.png`
}

/**
 * Toma screenshot de un elemento específico con nombre descriptivo
 */
export async function takeStepScreenshot(page: Page, name: string) {
  const filename = getScreenshotFilename(name)
  const filepath = path.join(SCREENSHOTS_DIR, filename)
  
  await page.screenshot({ path: filepath })
  console.log(`📸 Screenshot: ${filename}`)
  
  return filepath
}

/**
 * Toma screenshot de la página completa
 */
export async function takeFullPageScreenshot(page: Page, name: string) {
  const filename = getScreenshotFilename(name)
  const filepath = path.join(SCREENSHOTS_DIR, filename)
  
  await page.screenshot({ path: filepath, fullPage: true })
  console.log(`📸 Screenshot completo: ${filename}`)
  
  return filepath
}

/**
 * Toma screenshot de un selector específico
 */
export async function takeElementScreenshot(
  page: Page,
  name: string,
  selector: string
) {
  const filename = getScreenshotFilename(name)
  const filepath = path.join(SCREENSHOTS_DIR, filename)
  
  await page.locator(selector).screenshot({ path: filepath })
  console.log(`📸 Screenshot de elemento: ${filename}`)
  
  return filepath
}

/**
 * Compara screenshot con baseline (placeholder para implementación futura)
 */
export async function compareScreenshot(
  page: Page,
  baseline: string
): Promise<boolean> {
  // TODO: Implementar comparación con baseline usando jest-image-snapshot o similar
  console.log(`🔍 Comparando con baseline: ${baseline}`)
  return true
}

/**
 * Crea archivo de metadata para el screenshot
 */
export async function createScreenshotMetadata(
  page: Page,
  name: string,
  description: string
) {
  const filename = getScreenshotFilename(name)
  const filepath = path.join(SCREENSHOTS_DIR, `${filename}.meta.json`)
  
  const metadata = {
    name,
    description,
    url: page.url(),
    timestamp: new Date().toISOString(),
  }
  
  // En un setup real, escribiríamos el archivo
  console.log(`📝 Metadata: ${JSON.stringify(metadata)}`)
  
  return metadata
}


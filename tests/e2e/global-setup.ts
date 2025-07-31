import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando configuración global de Playwright...');
  
  // Verificar que el servidor esté corriendo
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Verificar que la aplicación esté disponible
    await page.goto(baseURL);
    await page.waitForSelector('body', { timeout: 10000 });
    
    console.log('✅ Servidor de desarrollo verificado y funcionando');
    
    await browser.close();
  } catch (error) {
    console.error('❌ Error en la configuración global:', error);
    throw error;
  }
  
  console.log('✅ Configuración global completada');
}

export default globalSetup;

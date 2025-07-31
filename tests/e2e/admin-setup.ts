import { chromium, FullConfig } from '@playwright/test';

async function adminGlobalSetup(config: FullConfig) {
  console.log('🔧 Configurando entorno para tests administrativos...');
  
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Verificar que la aplicación esté disponible
    console.log('🌐 Verificando servidor de desarrollo...');
    await page.goto(baseURL);
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Verificar que el panel administrativo esté accesible
    console.log('🔐 Verificando acceso al panel administrativo...');
    await page.goto(`${baseURL}/admin`);
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Verificar que las APIs administrativas respondan
    console.log('🔌 Verificando APIs administrativas...');
    const response = await page.request.get(`${baseURL}/api/admin/products`);
    if (!response.ok() && response.status() !== 401) {
      console.warn('⚠️  API de productos no responde correctamente');
    }
    
    console.log('✅ Configuración administrativa completada');
    
    await browser.close();
  } catch (error) {
    console.error('❌ Error en la configuración administrativa:', error);
    throw error;
  }
}

export default adminGlobalSetup;

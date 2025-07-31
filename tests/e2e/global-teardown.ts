import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Iniciando limpieza global de Playwright...');
  
  // Aquí puedes agregar cualquier limpieza necesaria
  // Por ejemplo: limpiar base de datos de test, cerrar conexiones, etc.
  
  console.log('✅ Limpieza global completada');
}

export default globalTeardown;

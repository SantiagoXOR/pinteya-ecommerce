import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Limpiando entorno después de tests de validación de direcciones...')
  
  // Aquí puedes agregar limpieza adicional si es necesaria
  // Por ejemplo, limpiar archivos temporales, resetear base de datos, etc.
  
  console.log('✅ Limpieza completada')
}

export default globalTeardown
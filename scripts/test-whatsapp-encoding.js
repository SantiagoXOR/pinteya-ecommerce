#!/usr/bin/env node

/**
 * Script para probar la codificación de WhatsApp
 * =============================================
 * 
 * Prueba diferentes métodos de codificación para preservar saltos de línea
 * 
 * Uso: node -r dotenv/config scripts/test-whatsapp-encoding.js
 */

// Función para generar mensaje de prueba
function generateTestMessage() {
  const lines = [
    `✨ *¡Gracias por tu compra en Pinteya!* 🛍`,
    `🤝 Te compartimos el detalle para coordinar la entrega:`,
    '',
    `*Detalle de Orden:*`,
    `• Orden: ORD-TEST-123`,
    `• Subtotal: $10.000,00`,
    `• Total: $10.000,00`,
    '',
    `*Datos Personales:*`,
    `• Nombre: Test User`,
    `• Teléfono: 📞 1234567890`,
    '',
    `✅ ¡Listo! 💚 En breve te contactamos.`
  ]

  return lines.join('\n')
}

function testEncoding() {
  console.log('🧪 Probando diferentes métodos de codificación para WhatsApp...\n')

  const originalMessage = generateTestMessage()
  
  console.log('📱 Mensaje original:')
  console.log('=' .repeat(50))
  console.log(originalMessage)
  console.log('=' .repeat(50))
  console.log('Líneas:', originalMessage.split('\n').length)
  console.log('Contiene saltos de línea:', originalMessage.includes('\n') ? '✅' : '❌')

  // Método 1: encodeURIComponent estándar
  console.log('\n🔧 Método 1: encodeURIComponent estándar')
  const encoded1 = encodeURIComponent(originalMessage)
  const decoded1 = decodeURIComponent(encoded1)
  
  console.log('Codificado:', encoded1.substring(0, 100) + '...')
  console.log('Decodificado líneas:', decoded1.split('\n').length)
  console.log('Preserva saltos:', decoded1.includes('\n') ? '✅' : '❌')

  // Método 2: Reemplazar saltos de línea antes de codificar
  console.log('\n🔧 Método 2: Reemplazar \\n por %0A antes de codificar')
  const messageWithNewlines = originalMessage.replace(/\n/g, '%0A')
  const encoded2 = encodeURIComponent(messageWithNewlines)
  const decoded2 = decodeURIComponent(encoded2).replace(/%0A/g, '\n')
  
  console.log('Codificado:', encoded2.substring(0, 100) + '...')
  console.log('Decodificado líneas:', decoded2.split('\n').length)
  console.log('Preserva saltos:', decoded2.includes('\n') ? '✅' : '❌')

  // Método 3: Usar replaceAll para saltos de línea
  console.log('\n🔧 Método 3: Usar replaceAll para saltos de línea')
  const encoded3 = encodeURIComponent(originalMessage)
  const decoded3 = decodeURIComponent(encoded3)
  
  console.log('Codificado:', encoded3.substring(0, 100) + '...')
  console.log('Decodificado líneas:', decoded3.split('\n').length)
  console.log('Preserva saltos:', decoded3.includes('\n') ? '✅' : '❌')

  // Método 4: Verificar si el problema está en la decodificación
  console.log('\n🔧 Método 4: Verificar decodificación manual')
  const encoded4 = encodeURIComponent(originalMessage)
  console.log('¿Contiene %0A?', encoded4.includes('%0A') ? '✅' : '❌')
  console.log('¿Contiene %0D%0A?', encoded4.includes('%0D%0A') ? '✅' : '❌')
  
  const decoded4 = decodeURIComponent(encoded4)
  console.log('Decodificado líneas:', decoded4.split('\n').length)
  console.log('Preserva saltos:', decoded4.includes('\n') ? '✅' : '❌')

  // Mostrar el mensaje decodificado
  console.log('\n📱 Mensaje decodificado (Método 1):')
  console.log('=' .repeat(50))
  console.log(decoded1)
  console.log('=' .repeat(50))

  console.log('\n📱 Mensaje decodificado (Método 2):')
  console.log('=' .repeat(50))
  console.log(decoded2)
  console.log('=' .repeat(50))

  console.log('\n🎯 CONCLUSIÓN:')
  console.log('El problema está en que encodeURIComponent/decodeURIComponent')
  console.log('debería preservar los saltos de línea, pero algo los está perdiendo.')
  console.log('Necesitamos investigar más a fondo el proceso de guardado.')
}

// Función principal
function main() {
  testEncoding()
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { testEncoding }

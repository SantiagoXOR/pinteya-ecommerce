#!/usr/bin/env node

/**
 * Script para verificar el formato del mensaje
 * ===========================================
 * 
 * Verifica que el mensaje tenga el formato correcto con saltos de línea
 * 
 * Uso: node -r dotenv/config scripts/verify-message-format.js
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyMessageFormat() {
  console.log('🔍 Verificación precisa del formato del mensaje...\n')

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('whatsapp_message')
      .eq('order_number', 'ORD-1760696945-c8ec734a')
      .single()

    if (error) {
      console.log('❌ Error:', error.message)
      return
    }

    const message = data.whatsapp_message

    console.log('📊 Análisis detallado:')
    console.log('- Longitud total:', message.length)
    console.log('- Contiene \\n:', message.includes('\n') ? '✅' : '❌')
    console.log('- Contiene \\r\\n:', message.includes('\r\n') ? '✅' : '❌')
    console.log('- Contiene \\r:', message.includes('\r') ? '✅' : '❌')

    // Mostrar caracteres especiales
    console.log('\n🔍 Caracteres especiales encontrados:')
    const specialChars = message.match(/[\n\r\t]/g)
    if (specialChars) {
      console.log('- Caracteres especiales:', specialChars.length)
      console.log('- Tipos:', [...new Set(specialChars)])
    } else {
      console.log('- No se encontraron caracteres especiales')
    }

    // Dividir por saltos de línea y mostrar
    const lines = message.split('\n')
    console.log('\n📝 Líneas detectadas:', lines.length)

    if (lines.length > 1) {
      console.log('\n📱 Primeras 5 líneas:')
      lines.slice(0, 5).forEach((line, i) => {
        console.log(`${i + 1}: "${line}"`)
      })
    }

    // Verificar si el problema está en la visualización
    console.log('\n🔍 Verificación de visualización:')
    console.log('Mensaje con replace de \\n por [SALTO]:')
    console.log(message.replace(/\n/g, '[SALTO]').substring(0, 200) + '...')

    // Mostrar el mensaje completo
    console.log('\n📱 Mensaje completo:')
    console.log('=' .repeat(60))
    console.log(message)
    console.log('=' .repeat(60))

    // Verificar si el mensaje se ve correctamente en WhatsApp
    console.log('\n🎯 CONCLUSIÓN:')
    if (message.includes('\n')) {
      console.log('✅ El mensaje contiene saltos de línea correctos')
      console.log('✅ Debería mostrarse correctamente en WhatsApp')
    } else {
      console.log('❌ El mensaje NO contiene saltos de línea')
      console.log('❌ Necesita ser corregido')
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message)
  }
}

// Función principal
async function main() {
  await verifyMessageFormat()
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { verifyMessageFormat }

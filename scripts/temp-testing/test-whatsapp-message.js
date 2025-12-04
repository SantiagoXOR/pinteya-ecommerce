#!/usr/bin/env node

/**
 * Test Simple: Generación de Mensaje WhatsApp
 * 
 * Este script verifica que la función de generación de mensaje
 * de WhatsApp funcione correctamente sin necesidad de base de datos
 */

// Simular datos de prueba
const mockOrder = {
  id: 'test-order-123',
  order_number: 'ORD-1234567890-abc123',
  total: 15000.50,
  status: 'pending'
}

const mockOrderData = {
  payer: {
    name: 'Juan',
    surname: 'Pérez',
    email: 'juan.perez@test.com',
    phone: '3511234567'
  },
  shipping: {
    address: {
      street_name: 'Av. Colón',
      street_number: '1234',
      zip_code: '5000',
      city_name: 'Córdoba',
      state_name: 'Córdoba'
    }
  },
  items: [
    {
      id: '1',
      quantity: 2
    },
    {
      id: '2',
      quantity: 1
    }
  ]
}

const mockProducts = [
  {
    id: 1,
    name: 'Pintura Latex Interior',
    price: 5000,
    discounted_price: 4500,
    category: { name: 'Pinturas' },
    brand: 'Alba'
  },
  {
    id: 2,
    name: 'Rodillo de Espuma',
    price: 1500,
    discounted_price: null,
    category: { name: 'Herramientas' },
    brand: 'Truper'
  }
]

// Función de generación de mensaje (copiada del código)
function generateMercadoPagoWhatsAppMessage(order, orderData, products) {
  const formatARS = (v) => Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const bullet = '•'
  
  const lines = [
    `✨ *¡Gracias por tu compra en Pinteya!* 🛍`,
    `💳 Tu pago con MercadoPago ha sido procesado exitosamente`,
    ``,
    `*Detalle de Orden:*`,
    `${bullet} Orden: ${order.order_number || order.id}`,
    `${bullet} Total: $${formatARS(Number(order.total || 0))}`,
    ``,
    `*Datos Personales:*`,
    `${bullet} Nombre: ${orderData.payer.name} ${orderData.payer.surname}`,
    `${bullet} Teléfono: 📞 ${orderData.payer.phone || 'No proporcionado'}`,
    `${bullet} Email: ✉️ ${orderData.payer.email}`,
    ``,
    `*Productos:*`,
  ]

  // Agregar productos
  for (const item of orderData.items) {
    const product = products.find(p => p.id === parseInt(item.id))
    if (product) {
      const finalPrice = product.discounted_price ?? product.price
      const lineTotal = finalPrice * item.quantity
      
      let productLine = `${bullet} ${product.name}`
      
      // Agregar detalles del producto si están disponibles
      const details = []
      if (product.category?.name) details.push(`Categoría: ${product.category.name}`)
      if (product.brand) details.push(`Marca: ${product.brand}`)
      
      if (details.length > 0) {
        productLine += ` (${details.join(', ')})`
      }
      
      productLine += ` x${item.quantity} - $${formatARS(lineTotal)}`
      lines.push(productLine)
    }
  }

  // Datos de envío si están disponibles
  if (orderData.shipping?.address) {
    lines.push('', `*Datos de Envío:*`)
    lines.push(`${bullet} Dirección: 📍 ${orderData.shipping.address.street_name} ${orderData.shipping.address.street_number}`)
    lines.push(`${bullet} Ciudad: ${orderData.shipping.address.city_name}, ${orderData.shipping.address.state_name}`)
    lines.push(`${bullet} CP: ${orderData.shipping.address.zip_code}`)
  }

  lines.push('', `✅ ¡Listo! 💚 En breve te contactamos para confirmar disponibilidad y horario.`)

  return lines.join('\n')
}

// Función para generar URL de WhatsApp
function generateWhatsAppUrl(message) {
  const businessPhone = '5493513411796'
  return `https://api.whatsapp.com/send?phone=${businessPhone}&text=${encodeURIComponent(message)}`
}

async function testWhatsAppMessage() {
  console.log('🧪 TEST: Generación de Mensaje WhatsApp para MercadoPago')
  console.log('=' .repeat(60))

  try {
    // Generar mensaje
    console.log('\n📝 Generando mensaje de WhatsApp...')
    const message = generateMercadoPagoWhatsAppMessage(mockOrder, mockOrderData, mockProducts)
    
    console.log('✅ Mensaje generado exitosamente')
    console.log('   - Longitud:', message.length, 'caracteres')
    console.log('   - Líneas:', message.split('\n').length)

    // Generar URL de WhatsApp
    console.log('\n🔗 Generando URL de WhatsApp...')
    const whatsappUrl = generateWhatsAppUrl(message)
    
    console.log('✅ URL de WhatsApp generada')
    console.log('   - Longitud URL:', whatsappUrl.length, 'caracteres')
    console.log('   - Teléfono incluido:', whatsappUrl.includes('5493513411796'))

    // Mostrar contenido del mensaje
    console.log('\n📄 CONTENIDO DEL MENSAJE:')
    console.log('-'.repeat(60))
    console.log(message)
    console.log('-'.repeat(60))

    // Mostrar URL completa
    console.log('\n🔗 URL DE WHATSAPP:')
    console.log('-'.repeat(60))
    console.log(whatsappUrl)
    console.log('-'.repeat(60))

    // Verificaciones específicas
    console.log('\n✅ VERIFICACIONES:')
    const checks = [
      { name: 'Contiene "MercadoPago"', result: message.includes('MercadoPago') },
      { name: 'Contiene "Pinteya"', result: message.includes('Pinteya') },
      { name: 'Contiene número de orden', result: message.includes('ORD-1234567890-abc123') },
      { name: 'Contiene total formateado', result: message.includes('$15.000,50') },
      { name: 'Contiene datos personales', result: message.includes('Juan Pérez') },
      { name: 'Contiene productos', result: message.includes('Productos:') },
      { name: 'Contiene datos de envío', result: message.includes('Datos de Envío:') },
      { name: 'Contiene dirección', result: message.includes('Av. Colón 1234') },
      { name: 'Contiene ciudad', result: message.includes('Córdoba') },
      { name: 'Termina con mensaje de confirmación', result: message.includes('¡Listo!') }
    ]

    checks.forEach(check => {
      console.log(`   ${check.result ? '✅' : '❌'} ${check.name}`)
    })

    const passedChecks = checks.filter(c => c.result).length
    const totalChecks = checks.length

    console.log(`\n📊 RESULTADO: ${passedChecks}/${totalChecks} verificaciones pasaron`)

    if (passedChecks === totalChecks) {
      console.log('\n🎉 ¡TEST EXITOSO! El mensaje de WhatsApp se genera correctamente')
    } else {
      console.log('\n⚠️  Algunas verificaciones fallaron. Revisar el código.')
    }

  } catch (error) {
    console.error('\n❌ ERROR EN EL TEST:')
    console.error('   - Mensaje:', error.message)
    console.error('   - Stack:', error.stack)
  }
}

// Ejecutar el test
if (require.main === module) {
  testWhatsAppMessage()
}

module.exports = { testWhatsAppMessage, generateMercadoPagoWhatsAppMessage, generateWhatsAppUrl }

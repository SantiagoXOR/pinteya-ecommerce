require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateOrderWithImprovedFormat() {
  const orderNumber = 'ORD-1760698637-25bc0335';
  
  try {
    console.log(`🔍 Actualizando orden ${orderNumber} con formato mejorado...`);
    
    // Obtener la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (orderError) {
      console.error('❌ Error al obtener la orden:', orderError);
      return;
    }

    if (!order) {
      console.error('❌ Orden no encontrada');
      return;
    }

    // Obtener items de la orden con detalles del producto
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        quantity,
        price,
        product_id,
        products (
          id,
          name,
          color,
          medida,
          brand,
          description
        )
      `)
      .eq('order_id', order.id);

    if (itemsError) {
      console.error('❌ Error al obtener items:', itemsError);
      return;
    }

    // Generar nuevo mensaje con formato mejorado
    const formatARS = (v) => Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const bullet = '•';
    
    const lines = [
      `✨ *¡Gracias por tu compra en Pinteya!* 🛍`,
      `🤝 Te compartimos el detalle para coordinar la entrega:`,
      '',
      `*Detalle de Orden:*`,
      `${bullet} Orden: ${order.order_number}`,
      `${bullet} Subtotal: $${formatARS(order.total)}`,
      `${bullet} Envío: $0,00`,
      `${bullet} Total: $${formatARS(order.total)}`,
      '',
      `*Datos Personales:*`,
      `${bullet} Nombre: ${order.payer_info.name} ${order.payer_info.surname}`,
      `${bullet} Teléfono: 📞 ${order.payer_info.phone}`,
      `${bullet} Email: 📧 ${order.payer_info.email}`,
      '',
      `*Productos:*`,
    ];

    // Generar líneas de productos con detalles
    for (const item of orderItems) {
      const product = item.products;
      const lineTotal = item.price * item.quantity;
      
      // Construir línea detallada del producto
      let productLine = `${bullet} ${product.name}`;
      
      // Agregar detalles del producto si están disponibles
      const details = [];
      if (product.color) details.push(`Color: ${product.color}`);
      if (product.medida) details.push(`Medida: ${product.medida}`);
      if (product.brand) details.push(`Marca: ${product.brand}`);
      
      if (details.length > 0) {
        productLine += ` (${details.join(', ')})`;
      }
      
      productLine += ` x${item.quantity} - $${formatARS(lineTotal)}`;
      lines.push(productLine);
    }

    // Datos de envío
    lines.push('', `*Datos de Envío:*`);
    lines.push(`${bullet} Dirección: 📍 ${order.shipping_address.street_name} ${order.shipping_address.street_number}`);
    lines.push(`${bullet} Ciudad: ${order.shipping_address.city_name}, ${order.shipping_address.state_name}`);
    lines.push(`${bullet} CP: ${order.shipping_address.zip_code}`);
    lines.push('', `✅ ¡Listo! 💚 En breve te contactamos para confirmar disponibilidad y horario.`);

    const newMessage = lines.join('\n');
    
    console.log('📱 Nuevo mensaje generado:');
    console.log('='.repeat(60));
    console.log(newMessage);
    console.log('='.repeat(60));

    // Codificar el mensaje para WhatsApp
    const whatsappMessage = encodeURIComponent(newMessage);
    const rawPhone = process.env.WHATSAPP_BUSINESS_NUMBER || '5493513411796';
    const whatsappNumber = rawPhone.replace(/\D/g, '');
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${whatsappMessage}`;

    console.log('\n🔗 Nueva URL de WhatsApp:');
    console.log(whatsappUrl);

    // Actualizar la orden con el nuevo mensaje
    console.log('\n💾 Actualizando orden en la base de datos...');
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        whatsapp_message: newMessage,
        whatsapp_notification_link: whatsappUrl,
        whatsapp_generated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('❌ Error al actualizar la orden:', updateError);
      return;
    }

    console.log('✅ Orden actualizada exitosamente con el nuevo formato!');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
updateOrderWithImprovedFormat().then(() => {
  console.log('🏁 Script completado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});

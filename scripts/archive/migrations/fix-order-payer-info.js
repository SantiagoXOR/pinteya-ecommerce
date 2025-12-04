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

async function fixOrderPayerInfo() {
  const orderNumber = 'ORD-1760696945-c8ec734a';
  
  try {
    console.log(`🔍 Buscando orden ${orderNumber}...`);
    
    // Obtener la orden con el mensaje de WhatsApp
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

    console.log('✅ Orden encontrada:', {
      id: order.id,
      order_number: order.order_number,
      total: order.total,
      payer_info: order.payer_info
    });

    // Extraer información del pagador del mensaje de WhatsApp
    if (!order.whatsapp_message) {
      console.error('❌ No hay mensaje de WhatsApp para extraer datos del pagador');
      return;
    }

    console.log('📱 Mensaje de WhatsApp actual:');
    console.log(order.whatsapp_message);

    // Extraer datos del pagador del mensaje
    const message = order.whatsapp_message;
    
    // Buscar patrón: "Nombre: [nombre] [apellido]"
    const nameMatch = message.match(/\*Datos Personales:\*\s*•\s*Nombre:\s*([^\n]+)/);
    if (!nameMatch) {
      console.error('❌ No se pudo extraer el nombre del mensaje');
      return;
    }

    const fullName = nameMatch[1].trim();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Buscar patrón: "Teléfono: 📞 [teléfono]"
    const phoneMatch = message.match(/•\s*Teléfono:\s*📞\s*([^\n]+)/);
    if (!phoneMatch) {
      console.error('❌ No se pudo extraer el teléfono del mensaje');
      return;
    }

    // Buscar patrón: "Email: 📧 [email]"
    const emailMatch = message.match(/•\s*Email:\s*📧\s*([^\n]+)/);
    if (!emailMatch) {
      console.error('❌ No se pudo extraer el email del mensaje');
      return;
    }

    const phone = phoneMatch[1].trim();
    const email = emailMatch[1].trim();

    console.log('📋 Datos extraídos:');
    console.log('- Nombre:', firstName);
    console.log('- Apellido:', lastName);
    console.log('- Teléfono:', phone);
    console.log('- Email:', email);

    // Crear objeto payer_info
    const payerInfo = {
      name: firstName,
      surname: lastName,
      email: email,
      phone: phone,
      identification: null // No disponible en el mensaje actual
    };

    console.log('💾 Actualizando payer_info en la base de datos...');

    // Actualizar la orden con payer_info
    const { error: updateError } = await supabase
      .from('orders')
      .update({ payer_info: payerInfo })
      .eq('id', order.id);

    if (updateError) {
      console.error('❌ Error al actualizar payer_info:', updateError);
      return;
    }

    console.log('✅ payer_info actualizado exitosamente');
    console.log('📊 Datos guardados:', JSON.stringify(payerInfo, null, 2));

    // Verificar que se guardó correctamente
    const { data: updatedOrder, error: verifyError } = await supabase
      .from('orders')
      .select('payer_info')
      .eq('id', order.id)
      .single();

    if (verifyError) {
      console.error('❌ Error al verificar la actualización:', verifyError);
      return;
    }

    console.log('✅ Verificación exitosa:');
    console.log('📋 payer_info guardado:', JSON.stringify(updatedOrder.payer_info, null, 2));

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
fixOrderPayerInfo().then(() => {
  console.log('🏁 Script completado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});

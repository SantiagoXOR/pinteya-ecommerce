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

async function testWhatsAppFormat() {
  const orderNumber = 'ORD-1760698637-25bc0335';
  
  try {
    console.log(`🔍 Analizando orden ${orderNumber}...`);
    
    // Obtener la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('whatsapp_message, whatsapp_notification_link')
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

    console.log('📱 Mensaje guardado en BD:');
    console.log('='.repeat(50));
    console.log(order.whatsapp_message);
    console.log('='.repeat(50));

    console.log('\n🔍 Análisis de saltos de línea:');
    const message = order.whatsapp_message;
    const lines = message.split('\n');
    console.log(`📊 Total de líneas: ${lines.length}`);
    
    lines.forEach((line, index) => {
      console.log(`Línea ${index + 1}: "${line}"`);
    });

    console.log('\n🔗 URL de WhatsApp:');
    console.log(order.whatsapp_notification_link);

    console.log('\n🔍 Decodificando URL para verificar:');
    const url = new URL(order.whatsapp_notification_link);
    const encodedMessage = url.searchParams.get('text');
    const decodedMessage = decodeURIComponent(encodedMessage);
    
    console.log('📱 Mensaje decodificado de la URL:');
    console.log('='.repeat(50));
    console.log(decodedMessage);
    console.log('='.repeat(50));

    console.log('\n🔍 Análisis del mensaje decodificado:');
    const decodedLines = decodedMessage.split('\n');
    console.log(`📊 Total de líneas decodificadas: ${decodedLines.length}`);
    
    decodedLines.forEach((line, index) => {
      console.log(`Línea ${index + 1}: "${line}"`);
    });

    // Comparar si son iguales
    console.log('\n🔍 Comparación:');
    console.log(`¿Mensajes idénticos? ${message === decodedMessage ? '✅ SÍ' : '❌ NO'}`);
    
    if (message !== decodedMessage) {
      console.log('\n🔍 Diferencias encontradas:');
      const messageChars = message.split('');
      const decodedChars = decodedMessage.split('');
      
      for (let i = 0; i < Math.max(messageChars.length, decodedChars.length); i++) {
        if (messageChars[i] !== decodedChars[i]) {
          console.log(`Posición ${i}: BD="${messageChars[i]}" (${messageChars[i].charCodeAt(0)}) vs URL="${decodedChars[i]}" (${decodedChars[i].charCodeAt(0)})`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
testWhatsAppFormat().then(() => {
  console.log('🏁 Script completado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});

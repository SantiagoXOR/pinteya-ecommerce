// Script temporal para agregar descuentos a algunos productos para demostración
// Este script se puede ejecutar una vez para ver el diseño completo del ProductCard

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addDiscountsDemo() {
  console.log('🎨 Agregando descuentos temporales para demostración del ProductCard...');

  try {
    // Obtener algunos productos para agregar descuentos
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, discounted_price')
      .limit(6);

    if (error) {
      console.error('❌ Error al obtener productos:', error);
      return;
    }

    if (!products || products.length === 0) {
      console.log('⚠️ No se encontraron productos en la base de datos');
      return;
    }

    console.log(`📦 Encontrados ${products.length} productos`);

    // Agregar descuentos a productos específicos
    const updates = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Solo agregar descuento si no tiene uno ya
      if (!product.discounted_price) {
        let discountPercentage = 0;
        
        // Asignar descuentos basados en el nombre del producto
        const name = product.name.toLowerCase();
        if (name.includes('lija') || name.includes('galgo')) {
          discountPercentage = 15;
        } else if (name.includes('pinceleta') || name.includes('pincel')) {
          discountPercentage = 25;
        } else if (name.includes('sherwin') || name.includes('premium')) {
          discountPercentage = 20;
        } else if (i % 2 === 0) {
          // Agregar descuento a productos alternos
          discountPercentage = 10 + (i * 5); // 10%, 20%, 30%, etc.
        }

        if (discountPercentage > 0) {
          const discountedPrice = Math.round(product.price * (1 - discountPercentage / 100));
          
          updates.push({
            id: product.id,
            discounted_price: discountedPrice
          });

          console.log(`💰 ${product.name}: $${product.price} → $${discountedPrice} (${discountPercentage}% OFF)`);
        }
      }
    }

    if (updates.length === 0) {
      console.log('ℹ️ Todos los productos ya tienen descuentos configurados');
      return;
    }

    // Aplicar las actualizaciones
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ discounted_price: update.discounted_price })
        .eq('id', update.id);

      if (updateError) {
        console.error(`❌ Error al actualizar producto ${update.id}:`, updateError);
      }
    }

    console.log(`✅ Se agregaron descuentos a ${updates.length} productos`);
    console.log('🎉 ¡Ahora los ProductCards mostrarán los badges de descuento naranjas!');
    console.log('🌐 Visita http://localhost:3001/shop para ver los cambios');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

async function removeDiscountsDemo() {
  console.log('🧹 Removiendo descuentos temporales...');

  try {
    const { error } = await supabase
      .from('products')
      .update({ discounted_price: null })
      .not('discounted_price', 'is', null);

    if (error) {
      console.error('❌ Error al remover descuentos:', error);
      return;
    }

    console.log('✅ Descuentos temporales removidos');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar según el argumento
const action = process.argv[2];

if (action === 'remove') {
  removeDiscountsDemo();
} else {
  addDiscountsDemo();
}

// Script de debugging para verificar la respuesta de la API de órdenes

async function debugOrdersAPI() {
  try {
    console.log('🔍 Fetching orders from API...');
    const response = await fetch('http://localhost:3000/api/admin/orders?page=1&limit=20&sort_by=created_at&sort_order=desc');
    
    if (!response.ok) {
      console.error('❌ API response not OK:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Raw API Response:', JSON.stringify(data, null, 2));
    
    // Verificar estructura básica
    console.log('\n🔍 Response Structure Analysis:');
    console.log('- success:', data.success);
    console.log('- data exists:', !!data.data);
    console.log('- orders exists:', !!data.data?.orders);
    console.log('- orders is array:', Array.isArray(data.data?.orders));
    console.log('- orders count:', data.data?.orders?.length || 0);
    
    if (data.data?.orders && Array.isArray(data.data.orders)) {
      console.log('\n📋 First Order Analysis:');
      const firstOrder = data.data.orders[0];
      if (firstOrder) {
        console.log('- Order keys:', Object.keys(firstOrder));
        console.log('- id:', firstOrder.id, '(type:', typeof firstOrder.id, ')');
        console.log('- order_number:', firstOrder.order_number, '(type:', typeof firstOrder.order_number, ')');
        console.log('- user_id:', firstOrder.user_id, '(type:', typeof firstOrder.user_id, ')');
        console.log('- total:', firstOrder.total, '(type:', typeof firstOrder.total, ')');
        console.log('- created_at:', firstOrder.created_at, '(type:', typeof firstOrder.created_at, ')');
        console.log('- status:', firstOrder.status, '(type:', typeof firstOrder.status, ')');
        
        // Simular validación
        const hasId = firstOrder.id && (typeof firstOrder.id === 'string' || typeof firstOrder.id === 'number');
        const hasTotal = typeof firstOrder.total === 'number' && firstOrder.total >= 0;
        const hasCreatedAt = firstOrder.created_at && typeof firstOrder.created_at === 'string';
        
        console.log('\n✅ Validation Results:');
        console.log('- hasId:', hasId);
        console.log('- hasTotal:', hasTotal);
        console.log('- hasCreatedAt:', hasCreatedAt);
        console.log('- Would pass validation:', hasId && hasTotal && hasCreatedAt);
      } else {
        console.log('❌ No orders found in response');
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging orders API:', error);
  }
}

// Ejecutar el debug
debugOrdersAPI();
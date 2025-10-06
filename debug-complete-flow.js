// Debug script para probar el flujo completo de badges inteligentes
// Simula el flujo desde SingleGridItem hasta CommercialProductCard

// Simulación de datos de productos reales
const testProducts = [
  {
    id: 1,
    name: "Esmalte Sintético Blanco Brillante 1L",
    brand: "SINTEPLAST",
    description: "Esmalte sintético de alta calidad para interiores y exteriores",
    price: 46345.6,
    category: "Pinturas"
  },
  {
    id: 2,
    name: "Bandeja Chata para Pintura 25cm",
    brand: "SINTEPLAST", 
    description: "Bandeja para pintura de plástico resistente",
    price: 5200,
    category: "Accesorios"
  },
  {
    id: 3,
    name: "Lija al Agua Grano 120",
    brand: "SINTEPLAST",
    description: "Lija al agua para acabados finos",
    price: 1500,
    category: "Herramientas"
  },
  {
    id: 4,
    name: "Barniz Campbell Brillante 1L",
    brand: "CAMPBELL",
    description: "Barniz transparente brillante para madera",
    price: 28500,
    category: "Barnices"
  },
  {
    id: 5,
    name: "Recuplast Baño y Cocina Antihumedad",
    brand: "SINTEPLAST",
    description: "Pintura especial para ambientes húmedos",
    price: 46345.6,
    category: "Pinturas"
  }
];

// Configuración de badgeConfig como en SingleGridItem
const badgeConfig = {
  showCapacity: true,
  showColor: true,
  showFinish: true,
  showMaterial: true,
  showGrit: true
};

// Simulación de PRODUCT_TYPES (simplificada)
const PRODUCT_TYPES = [
  {
    name: 'Esmalte Sintético',
    category: 'Pinturas',
    capacityUnit: 'L',
    defaultCapacity: '1L',
    colorCategories: ['Blanco', 'Negro', 'Rojo', 'Azul', 'Verde', 'Amarillo']
  },
  {
    name: 'Barniz',
    category: 'Barnices', 
    capacityUnit: 'L',
    defaultCapacity: '1L',
    colorCategories: ['Transparente', 'Natural']
  },
  {
    name: 'Lija',
    category: 'Herramientas',
    capacityUnit: 'grano',
    defaultCapacity: '120',
    colorCategories: []
  }
];

// Patrones de capacidad
const CAPACITY_PATTERNS = [
  { pattern: /(\d+(?:\.\d+)?)\s*L(?:itros?)?/gi, unit: 'L' },
  { pattern: /(\d+(?:\.\d+)?)\s*ml/gi, unit: 'ml' },
  { pattern: /(\d+(?:\.\d+)?)\s*kg/gi, unit: 'kg' },
  { pattern: /(\d+(?:\.\d+)?)\s*g(?:ramos?)?/gi, unit: 'g' },
  { pattern: /grano\s*(\d+)/gi, unit: 'grano' },
  { pattern: /(\d+)\s*cm/gi, unit: 'cm' }
];

// Colores conocidos
const COLOR_NAMES = [
  'Blanco', 'Negro', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Rosa', 'Violeta', 'Marrón',
  'Gris', 'Transparente', 'Natural', 'Brillante'
];

// Tipos de acabado
const FINISH_TYPES = [
  'Brillante', 'Mate', 'Satinado', 'Semi-mate', 'Semi-brillante', 'Texturado'
];

// Tipos de material
const MATERIAL_TYPES = [
  'Sintético', 'Acrílico', 'Látex', 'Esmalte', 'Barniz', 'Laca', 'Poliuretano'
];

// Función para extraer capacidad del nombre
function extractCapacityFromName(productName) {
  if (!productName) return null;
  
  for (const { pattern, unit } of CAPACITY_PATTERNS) {
    const match = productName.match(pattern);
    if (match) {
      const value = match[1] || match[0].replace(/[^\d.]/g, '');
      return { value: parseFloat(value), unit, displayText: `${value}${unit}` };
    }
  }
  return null;
}

// Función para extraer color del nombre
function extractColorFromName(productName) {
  if (!productName) return null;
  
  const upperName = productName.toUpperCase();
  for (const color of COLOR_NAMES) {
    if (upperName.includes(color.toUpperCase())) {
      return { name: color, displayText: color };
    }
  }
  return null;
}

// Función para extraer acabado del nombre
function extractFinishFromName(productName) {
  if (!productName) return null;
  
  const upperName = productName.toUpperCase();
  for (const finish of FINISH_TYPES) {
    if (upperName.includes(finish.toUpperCase())) {
      return { type: finish, displayText: finish };
    }
  }
  return null;
}

// Función para extraer material del nombre
function extractMaterialFromName(productName) {
  if (!productName) return null;
  
  const upperName = productName.toUpperCase();
  for (const material of MATERIAL_TYPES) {
    if (upperName.includes(material.toUpperCase())) {
      return { type: material, displayText: material };
    }
  }
  return null;
}

// Función para extraer grano (para lijas)
function extractGritFromName(productName) {
  if (!productName) return null;
  
  const granoMatch = productName.match(/grano\s*(\d+)/gi);
  if (granoMatch) {
    const grit = granoMatch[0].replace(/[^\d]/g, '');
    return { value: parseInt(grit), displayText: `Grano ${grit}` };
  }
  return null;
}

// Función principal para extraer información del producto
function extractProductCapacity(productName, variants = [], description = '') {
  const info = {};
  
  // Extraer capacidad
  const capacity = extractCapacityFromName(productName);
  if (capacity) {
    info.capacity = capacity;
  }
  
  // Extraer color
  const color = extractColorFromName(productName);
  if (color) {
    info.color = color;
  }
  
  // Extraer acabado
  const finish = extractFinishFromName(productName);
  if (finish) {
    info.finish = finish;
  }
  
  // Extraer material
  const material = extractMaterialFromName(productName);
  if (material) {
    info.material = material;
  }
  
  // Extraer grano
  const grit = extractGritFromName(productName);
  if (grit) {
    info.grit = grit;
  }
  
  return info;
}

// Función para formatear badges
function formatProductBadges(extractedInfo, badgeConfig) {
  const badges = [];
  
  // Badge de capacidad
  if (badgeConfig.showCapacity && extractedInfo.capacity) {
    badges.push({
      type: 'capacity',
      displayText: extractedInfo.capacity.displayText,
      color: '#FFFFFF',
      bgColor: '#2563EB'
    });
  }
  
  // Badge de color
  if (badgeConfig.showColor && extractedInfo.color) {
    badges.push({
      type: 'color',
      displayText: extractedInfo.color.displayText,
      color: '#FFFFFF',
      bgColor: '#7C3AED'
    });
  }
  
  // Badge de acabado
  if (badgeConfig.showFinish && extractedInfo.finish) {
    badges.push({
      type: 'finish',
      displayText: extractedInfo.finish.displayText,
      color: '#FFFFFF',
      bgColor: '#059669'
    });
  }
  
  // Badge de material
  if (badgeConfig.showMaterial && extractedInfo.material) {
    badges.push({
      type: 'material',
      displayText: extractedInfo.material.displayText,
      color: '#FFFFFF',
      bgColor: '#DC2626'
    });
  }
  
  // Badge de grano
  if (badgeConfig.showGrit && extractedInfo.grit) {
    badges.push({
      type: 'grit',
      displayText: extractedInfo.grit.displayText,
      color: '#FFFFFF',
      bgColor: '#EA580C'
    });
  }
  
  return badges;
}

// Función para simular el flujo completo
function simulateCompleteFlow(product) {
  console.log(`\n🔍 === SIMULANDO FLUJO COMPLETO PARA: ${product.name} ===`);
  
  // 1. SingleGridItem pasa badgeConfig a CommercialProductCard
  console.log('📋 1. Configuración de badges desde SingleGridItem:');
  console.log('   badgeConfig:', JSON.stringify(badgeConfig, null, 2));
  
  // 2. CommercialProductCard extrae información del producto
  console.log('\n🔧 2. Extrayendo información del producto...');
  const extractedInfo = extractProductCapacity(product.name, [], product.description);
  console.log('   extractedInfo:', JSON.stringify(extractedInfo, null, 2));
  
  // 3. CommercialProductCard genera badges inteligentes
  console.log('\n🏷️ 3. Generando badges inteligentes...');
  const intelligentBadges = formatProductBadges(extractedInfo, badgeConfig);
  console.log('   intelligentBadges:', JSON.stringify(intelligentBadges, null, 2));
  
  // 4. Verificar si se renderizarían badges
  console.log('\n✅ 4. Resultado del renderizado:');
  if (intelligentBadges.length > 0) {
    console.log(`   ✅ SE RENDERIZARÍAN ${intelligentBadges.length} BADGES:`);
    intelligentBadges.forEach((badge, index) => {
      console.log(`      ${index + 1}. ${badge.type}: "${badge.displayText}" (${badge.bgColor})`);
    });
  } else {
    console.log('   ❌ NO SE RENDERIZARÍAN BADGES - Array vacío');
  }
  
  return {
    product,
    extractedInfo,
    intelligentBadges,
    wouldRender: intelligentBadges.length > 0
  };
}

// Ejecutar simulación para todos los productos
console.log('🚀 INICIANDO SIMULACIÓN COMPLETA DEL FLUJO DE BADGES INTELIGENTES');
console.log('=' .repeat(80));

const results = testProducts.map(simulateCompleteFlow);

// Resumen final
console.log('\n📊 === RESUMEN FINAL ===');
const successfulProducts = results.filter(r => r.wouldRender);
const failedProducts = results.filter(r => !r.wouldRender);

console.log(`✅ Productos CON badges: ${successfulProducts.length}/${results.length}`);
successfulProducts.forEach(r => {
  console.log(`   - ${r.product.name} (${r.intelligentBadges.length} badges)`);
});

console.log(`❌ Productos SIN badges: ${failedProducts.length}/${results.length}`);
failedProducts.forEach(r => {
  console.log(`   - ${r.product.name}`);
});

if (failedProducts.length > 0) {
  console.log('\n🔍 ANÁLISIS DE PRODUCTOS SIN BADGES:');
  failedProducts.forEach(r => {
    console.log(`\n   ${r.product.name}:`);
    console.log(`     - Información extraída: ${Object.keys(r.extractedInfo).length} campos`);
    console.log(`     - Campos: ${Object.keys(r.extractedInfo).join(', ') || 'ninguno'}`);
  });
}

console.log('\n🎯 CONCLUSIÓN:');
if (successfulProducts.length === results.length) {
  console.log('✅ TODOS los productos generan badges correctamente');
} else if (successfulProducts.length > 0) {
  console.log('⚠️ ALGUNOS productos generan badges, otros no');
} else {
  console.log('❌ NINGÚN producto genera badges - Problema en el sistema');
}
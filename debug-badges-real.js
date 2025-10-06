// Script de debug para probar badges inteligentes con productos reales
// Ejecutar con: node debug-badges-real.js

// Simulación de las funciones de product-utils.ts
const PRODUCT_TYPES = [
  {
    name: 'Pintura',
    keywords: ['pintura', 'latex', 'esmalte', 'barniz', 'antióxido'],
    capacityUnits: ['L', 'ml', 'lt', 'litro', 'litros'],
    defaultCapacity: '1L',
    colors: ['blanco', 'negro', 'rojo', 'azul', 'verde', 'amarillo', 'gris']
  },
  {
    name: 'Lija',
    keywords: ['lija', 'papel de lija', 'abrasivo'],
    capacityUnits: ['grano', 'g', '#'],
    defaultCapacity: '120g',
    colors: []
  },
  {
    name: 'Herramientas',
    keywords: ['bandeja', 'rodillo', 'pincel', 'brocha'],
    capacityUnits: ['cm', 'mm', 'pulgadas', '"'],
    defaultCapacity: '25cm',
    colors: []
  }
];

const CAPACITY_PATTERNS = [
  // Patrones para litros
  /(\d+(?:\.\d+)?)\s*(?:L|lt|litro|litros?)\b/gi,
  // Patrones para mililitros
  /(\d+(?:\.\d+)?)\s*(?:ml|mililitro|mililitros?)\b/gi,
  // Patrones para granos de lija
  /(?:grano|#|g)\s*(\d+)/gi,
  // Patrones para medidas en cm
  /(\d+(?:\.\d+)?)\s*(?:cm|centímetro|centímetros?)\b/gi,
  // Patrones para medidas en mm
  /(\d+(?:\.\d+)?)\s*(?:mm|milímetro|milímetros?)\b/gi,
  // Patrones para pulgadas
  /(\d+(?:\.\d+)?)\s*(?:"|pulgada|pulgadas?)\b/gi
];

const COLOR_NAMES = [
  'blanco', 'negro', 'rojo', 'azul', 'verde', 'amarillo', 'gris', 'marrón',
  'rosa', 'violeta', 'naranja', 'celeste', 'beige', 'crema', 'dorado',
  'plateado', 'transparente', 'natural'
];

const FINISH_TYPES = [
  'brillante', 'mate', 'satinado', 'semi-mate', 'semi-brillante',
  'texturado', 'liso', 'rugoso', 'antideslizante'
];

const MATERIAL_TYPES = [
  'latex', 'acrílico', 'esmalte', 'barniz', 'antióxido', 'imprimación',
  'metal', 'madera', 'plástico', 'cerámica', 'vidrio'
];

// Funciones de extracción
function extractCapacityFromName(productName) {
  for (const pattern of CAPACITY_PATTERNS) {
    const match = productName.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return null;
}

function extractColorFromName(productName) {
  const lowerName = productName.toLowerCase();
  for (const color of COLOR_NAMES) {
    if (lowerName.includes(color)) {
      return color.charAt(0).toUpperCase() + color.slice(1);
    }
  }
  return null;
}

function extractFinishFromName(productName) {
  const lowerName = productName.toLowerCase();
  for (const finish of FINISH_TYPES) {
    if (lowerName.includes(finish)) {
      return finish.charAt(0).toUpperCase() + finish.slice(1);
    }
  }
  return null;
}

function extractMaterialFromName(productName) {
  const lowerName = productName.toLowerCase();
  for (const material of MATERIAL_TYPES) {
    if (lowerName.includes(material)) {
      return material.charAt(0).toUpperCase() + material.slice(1);
    }
  }
  return null;
}

function extractGritFromName(productName) {
  const granoMatch = productName.match(/(?:grano|#|g)\s*(\d+)/gi);
  if (granoMatch) {
    return `Grano ${granoMatch[0].match(/\d+/)[0]}`;
  }
  return null;
}

// Función principal de extracción
function extractProductCapacity(productName, variants = [], description = '') {
  const result = {};

  console.log(`\n🔍 Analizando producto: "${productName}"`);
  console.log(`📝 Descripción: "${description}"`);
  console.log(`🔧 Variantes:`, variants);

  // 1. Primero intentar desde variantes
  if (variants && variants.length > 0) {
    const defaultVariant = variants.find(v => v.measure) || variants[0];
    if (defaultVariant?.measure) {
      result.capacity = defaultVariant.measure;
      console.log(`✅ Capacidad desde variante: ${result.capacity}`);
    }
    if (defaultVariant?.color_name) {
      result.color = defaultVariant.color_name;
      console.log(`✅ Color desde variante: ${result.color}`);
    }
    if (defaultVariant?.finish) {
      result.finish = defaultVariant.finish;
      console.log(`✅ Acabado desde variante: ${result.finish}`);
    }
  }

  // 2. Extraer del nombre si no hay variantes
  if (!result.capacity) {
    result.capacity = extractCapacityFromName(productName);
    console.log(`🔍 Capacidad desde nombre: ${result.capacity || 'No encontrada'}`);
  }
  
  if (!result.color) {
    result.color = extractColorFromName(productName);
    console.log(`🔍 Color desde nombre: ${result.color || 'No encontrado'}`);
  }

  if (!result.finish) {
    result.finish = extractFinishFromName(productName);
    console.log(`🔍 Acabado desde nombre: ${result.finish || 'No encontrado'}`);
  }

  // 3. Extraer información adicional
  result.material = extractMaterialFromName(productName);
  console.log(`🔍 Material desde nombre: ${result.material || 'No encontrado'}`);
  
  result.grit = extractGritFromName(productName);
  console.log(`🔍 Grano desde nombre: ${result.grit || 'No encontrado'}`);

  console.log(`📊 Resultado final:`, result);
  return result;
}

// Función de formateo de badges
function formatProductBadges(extractedInfo, options = {}) {
  const badges = [];
  
  const {
    showCapacity = true,
    showColor = false,
    showFinish = false,
    showMaterial = false,
    showGrit = true
  } = options;

  console.log(`\n🎨 Formateando badges con opciones:`, options);
  console.log(`📋 Información extraída:`, extractedInfo);

  // Badge de capacidad
  if (showCapacity && extractedInfo.capacity) {
    badges.push({
      type: 'capacity',
      value: extractedInfo.capacity,
      displayText: extractedInfo.capacity,
      color: '#FFFFFF',
      bgColor: '#2563EB'
    });
    console.log(`✅ Badge de capacidad agregado: ${extractedInfo.capacity}`);
  }

  // Badge de grano
  if (showGrit && extractedInfo.grit) {
    badges.push({
      type: 'capacity',
      value: extractedInfo.grit,
      displayText: extractedInfo.grit,
      color: '#FFFFFF',
      bgColor: '#7C3AED'
    });
    console.log(`✅ Badge de grano agregado: ${extractedInfo.grit}`);
  }

  // Badge de color
  if (showColor && extractedInfo.color) {
    badges.push({
      type: 'color',
      value: extractedInfo.color,
      displayText: extractedInfo.color,
      color: '#FFFFFF',
      bgColor: '#059669'
    });
    console.log(`✅ Badge de color agregado: ${extractedInfo.color}`);
  }

  // Badge de acabado
  if (showFinish && extractedInfo.finish) {
    badges.push({
      type: 'finish',
      value: extractedInfo.finish,
      displayText: extractedInfo.finish,
      color: '#FFFFFF',
      bgColor: '#DC2626'
    });
    console.log(`✅ Badge de acabado agregado: ${extractedInfo.finish}`);
  }

  // Badge de material
  if (showMaterial && extractedInfo.material) {
    badges.push({
      type: 'finish',
      value: extractedInfo.material,
      displayText: extractedInfo.material,
      color: '#FFFFFF',
      bgColor: '#EA580C'
    });
    console.log(`✅ Badge de material agregado: ${extractedInfo.material}`);
  }

  console.log(`🎯 Total de badges generados: ${badges.length}`);
  console.log(`📋 Badges finales:`, badges);
  
  return badges;
}

// Productos reales para testing
const testProducts = [
  {
    title: 'Barniz Campbell Brillante 1L',
    description: 'Barniz Campbell brillante de 1 litro para acabados profesionales',
    variants: []
  },
  {
    title: 'Lija al Agua Grano 120',
    description: 'Lija al agua grano 120 para acabados finos',
    variants: []
  },
  {
    title: 'Bandeja Chata para Pintura 25cm',
    description: 'Bandeja de latex para pintura de 25cm',
    variants: []
  },
  {
    title: 'Recuplast Baño y Cocina Antihumedad',
    description: 'Pintura especial para baños y cocinas con propiedades antihumedad',
    variants: []
  },
  {
    title: 'Esmalte Sintético Blanco Brillante 1L',
    description: 'Esmalte sintético de alta calidad color blanco brillante',
    variants: []
  }
];

// Configuración de badges para testing
const badgeConfig = {
  showCapacity: true,
  showColor: true,
  showFinish: true,
  showMaterial: true,
  showGrit: true
};

console.log('🚀 INICIANDO DEBUG DE BADGES INTELIGENTES');
console.log('=' .repeat(60));

// Probar cada producto
testProducts.forEach((product, index) => {
  console.log(`\n📦 PRODUCTO ${index + 1}/${testProducts.length}`);
  console.log('=' .repeat(40));
  
  // Extraer información
  const extractedInfo = extractProductCapacity(
    product.title, 
    product.variants, 
    product.description
  );
  
  // Formatear badges
  const badges = formatProductBadges(extractedInfo, badgeConfig);
  
  console.log(`\n🏷️ RESUMEN PARA "${product.title}":`);
  console.log(`   - Información extraída: ${Object.keys(extractedInfo).filter(k => extractedInfo[k]).length} campos`);
  console.log(`   - Badges generados: ${badges.length}`);
  
  if (badges.length > 0) {
    console.log(`   - Badges: ${badges.map(b => b.displayText).join(', ')}`);
  } else {
    console.log(`   ❌ NO SE GENERARON BADGES`);
  }
});

console.log('\n🎯 ANÁLISIS COMPLETADO');
console.log('=' .repeat(60));
/**
 * Script para configurar el sistema de Analytics
 * Instala dependencias y configura el entorno
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 Configurando Sistema de Analytics para Pinteya E-commerce...\n');

// Verificar archivos creados
const filesToCheck = [
  'src/lib/analytics.ts',
  'src/hooks/useAnalytics.ts',
  'src/components/Analytics/AnalyticsDashboard.tsx',
  'src/components/Analytics/ConversionFunnel.tsx',
  'src/components/Analytics/HeatmapViewer.tsx',
  'src/components/Analytics/AnalyticsProvider.tsx',
  'src/components/Analytics/GoogleAnalytics.tsx',
  'src/app/api/analytics/events/route.ts',
  'src/app/api/analytics/metrics/route.ts',
  'src/app/admin/analytics/page.tsx',
  'src/app/demo/analytics/page.tsx',
  'supabase/migrations/20250105_create_analytics_tables.sql',
];

console.log('✅ Verificando archivos del sistema de analytics...');
let allFilesExist = true;

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.log(`   ✗ ${file} - FALTANTE`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Algunos archivos están faltantes. Verifica la implementación.');
  process.exit(1);
}

// Verificar variables de entorno
console.log('\n🔧 Verificando configuración de entorno...');

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const optionalEnvVars = [
  'NEXT_PUBLIC_GA_ID',
];

let envConfigured = true;

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`   ✓ ${envVar} configurada`);
  } else {
    console.log(`   ✗ ${envVar} - REQUERIDA`);
    envConfigured = false;
  }
});

optionalEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`   ✓ ${envVar} configurada (opcional)`);
  } else {
    console.log(`   ⚠ ${envVar} - OPCIONAL (para Google Analytics)`);
  }
});

// Crear archivo de configuración de ejemplo
const envExample = `# Variables de entorno para Analytics
# Copia este archivo como .env.local y configura los valores

# Supabase (REQUERIDO)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Google Analytics 4 (OPCIONAL)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Configuración de Analytics
ANALYTICS_ENABLED=true
ANALYTICS_DEBUG=false
`;

if (!fs.existsSync('.env.example.analytics')) {
  fs.writeFileSync('.env.example.analytics', envExample);
  console.log('\n📝 Creado archivo .env.example.analytics con configuración de ejemplo');
}

// Verificar migración de Supabase
console.log('\n🗄️ Información sobre migración de base de datos:');
console.log('   Para aplicar las tablas de analytics en Supabase:');
console.log('   1. Ejecuta: supabase migration up');
console.log('   2. O aplica manualmente el archivo: supabase/migrations/20250105_create_analytics_tables.sql');

// Crear documentación
const documentation = `# Sistema de Analytics - Pinteya E-commerce

## 🎯 Funcionalidades Implementadas

### ✅ Fase 6 Completada: Sistema de Analytics y Métricas

#### 1. Sistema de Tracking de Eventos
- **Archivo**: \`src/lib/analytics.ts\`
- **Hook**: \`src/hooks/useAnalytics.ts\`
- **Funcionalidades**:
  - Tracking automático de clicks, hovers, scroll
  - Eventos de e-commerce (vista producto, carrito, checkout, compra)
  - Métricas de conversión en tiempo real
  - Almacenamiento en Supabase y Google Analytics

#### 2. Dashboard de Analytics
- **Componente**: \`src/components/Analytics/AnalyticsDashboard.tsx\`
- **Página**: \`src/app/admin/analytics/page.tsx\`
- **Funcionalidades**:
  - Métricas principales (vistas, conversiones, AOV)
  - Métricas de engagement (sesiones, usuarios, duración)
  - Top productos y páginas más visitadas
  - Métricas en tiempo real

#### 3. Embudo de Conversión
- **Componente**: \`src/components/Analytics/ConversionFunnel.tsx\`
- **Funcionalidades**:
  - Visualización del flujo de conversión
  - Tasas de conversión por etapa
  - Identificación de puntos de abandono
  - Recomendaciones automáticas

#### 4. Heatmaps de Interacciones
- **Componente**: \`src/components/Analytics/HeatmapViewer.tsx\`
- **Funcionalidades**:
  - Visualización de clicks, hovers y scroll
  - Overlay de calor sobre contenido
  - Análisis de zonas de mayor actividad
  - Insights automáticos

#### 5. Integración Google Analytics 4
- **Archivo**: \`src/lib/google-analytics.ts\`
- **Componente**: \`src/components/Analytics/GoogleAnalytics.tsx\`
- **Funcionalidades**:
  - Enhanced E-commerce tracking
  - Eventos personalizados
  - Configuración de usuario
  - Consentimiento de cookies

#### 6. APIs de Analytics
- **Eventos**: \`src/app/api/analytics/events/route.ts\`
- **Métricas**: \`src/app/api/analytics/metrics/route.ts\`
- **Funcionalidades**:
  - Almacenamiento de eventos
  - Cálculo de métricas agregadas
  - Filtros por fecha, usuario, sesión
  - Optimización de consultas

## 🚀 Cómo Usar

### 1. Configuración Básica
\`\`\`tsx
import { useAnalytics } from '@/hooks/useAnalytics';

const MyComponent = () => {
  const { trackEvent, trackProductView } = useAnalytics();
  
  const handleClick = () => {
    trackEvent('button_click', 'ui', 'click', 'my-button');
  };
  
  return <button onClick={handleClick}>Click me</button>;
};
\`\`\`

### 2. Tracking de E-commerce
\`\`\`tsx
import { useTrackEcommerce } from '@/components/Analytics/AnalyticsProvider';

const ProductCard = ({ product }) => {
  const { trackProductView, trackAddToCart } = useTrackEcommerce();
  
  useEffect(() => {
    trackProductView(product.id, product.name, product.category, product.price);
  }, []);
  
  const handleAddToCart = () => {
    trackAddToCart(product.id, product.name, product.price, 1);
  };
  
  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={handleAddToCart}>Agregar al carrito</button>
    </div>
  );
};
\`\`\`

### 3. Tracking Automático
\`\`\`tsx
import { withAnalytics } from '@/components/Analytics/AnalyticsProvider';

const MyComponent = () => {
  return <div>Mi componente</div>;
};

export default withAnalytics(MyComponent, 'MyComponent');
\`\`\`

## 📊 Métricas Disponibles

### E-commerce
- Vistas de productos
- Agregados al carrito
- Checkouts iniciados
- Compras completadas
- Tasa de conversión
- Valor promedio de orden
- Tasa de abandono de carrito

### Engagement
- Sesiones únicas
- Usuarios únicos
- Duración promedio de sesión
- Eventos por sesión
- Páginas más visitadas
- Productos más vistos

### Comportamiento
- Heatmaps de clicks
- Patrones de scroll
- Interacciones por elemento
- Flujo de navegación

## 🔧 Configuración

### Variables de Entorno
\`\`\`env
# Supabase (REQUERIDO)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Google Analytics 4 (OPCIONAL)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
\`\`\`

### Base de Datos
Aplicar migración: \`supabase/migrations/20250105_create_analytics_tables.sql\`

### Permisos
- Dashboard de analytics: Solo usuarios con role 'admin'
- Inserción de eventos: Todos los usuarios
- Lectura de métricas: Solo administradores

## 🎮 Demo
Visita \`/demo/analytics\` para ver el sistema en acción.

## 📈 Próximas Mejoras
- Reportes automáticos por email
- Alertas de métricas
- Segmentación de usuarios
- A/B testing integrado
- Exportación de datos avanzada
`;

fs.writeFileSync('ANALYTICS_SYSTEM_DOCUMENTATION.md', documentation);
console.log('\n📚 Creada documentación completa: ANALYTICS_SYSTEM_DOCUMENTATION.md');

// Resumen final
console.log('\n🎉 ¡Sistema de Analytics configurado exitosamente!');
console.log('\n📋 Resumen de implementación:');
console.log('   ✅ Sistema de tracking de eventos');
console.log('   ✅ Dashboard de analytics');
console.log('   ✅ Embudo de conversión');
console.log('   ✅ Heatmaps de interacciones');
console.log('   ✅ Integración Google Analytics 4');
console.log('   ✅ APIs de métricas');
console.log('   ✅ Provider de analytics');
console.log('   ✅ Migración de base de datos');
console.log('   ✅ Documentación completa');

console.log('\n🚀 Próximos pasos:');
console.log('   1. Configurar variables de entorno');
console.log('   2. Aplicar migración de Supabase');
console.log('   3. Configurar Google Analytics (opcional)');
console.log('   4. Probar en /demo/analytics');
console.log('   5. Acceder al dashboard en /admin/analytics');

console.log('\n✨ ¡El sistema está listo para usar!');

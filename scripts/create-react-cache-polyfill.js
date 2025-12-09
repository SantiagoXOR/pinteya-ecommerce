const fs = require('fs');
const path = require('path');

// Crear polyfill para react/cache antes del build
const reactPath = path.join(process.cwd(), 'node_modules', 'react');
const cachePath = path.join(reactPath, 'cache.js');

// Verificar que node_modules/react existe
if (!fs.existsSync(reactPath)) {
  console.error('❌ Error: node_modules/react no encontrado. Ejecuta npm install primero.');
  process.exit(1);
}

// Verificar si react/cache ya existe
// Forzar recreación en cada build para asegurar que esté actualizado
if (fs.existsSync(cachePath)) {
  console.log('ℹ️  react/cache existe, recreando para asegurar compatibilidad...');
  fs.unlinkSync(cachePath);
}

// Asegurar que el directorio existe
if (!fs.existsSync(reactPath)) {
  fs.mkdirSync(reactPath, { recursive: true });
}

// Polyfill mejorado para react/cache
// CRÍTICO: Debe funcionar con el patrón (0, r.cache) usado por webpack
// El problema es que webpack necesita que cache sea una propiedad accesible directamente
const polyfillContent = `'use strict';

// Polyfill para react/cache en React 18.3.1
// Next.js 15 puede requerir esto pero no está disponible en React 18.3.1

function cacheImpl(fn) {
  if (typeof fn !== 'function') {
    throw new Error('cache requires a function');
  }
  // En React 19, cache memoiza funciones, aquí simplemente devolvemos la función
  return fn;
}

// CRÍTICO: Para que (0, r.cache) funcione, necesitamos exportar la función directamente
// y luego agregar propiedades después de la exportación
// Primero, hacemos que cacheImpl tenga la propiedad cache
cacheImpl.cache = cacheImpl;

// Exportar como función directamente (CommonJS)
// Esto permite que webpack acceda a r.cache cuando r es el módulo
const moduleExports = cacheImpl;

// Agregar propiedades al objeto exportado después
moduleExports.cache = cacheImpl;
moduleExports.default = cacheImpl;

// Asegurar que cache es enumerable y accesible
Object.defineProperty(moduleExports, 'cache', {
  value: cacheImpl,
  writable: false,
  enumerable: true,
  configurable: false
});

Object.defineProperty(moduleExports, 'default', {
  value: cacheImpl,
  writable: false,
  enumerable: true,
  configurable: false
});

// Exportar
module.exports = moduleExports;

// Soporte adicional para ES modules
if (typeof exports !== 'undefined') {
  exports.cache = cacheImpl;
  exports.default = cacheImpl;
}
`;

fs.writeFileSync(cachePath, polyfillContent, 'utf8');
console.log('✅ Polyfill de react/cache creado/actualizado en:', cachePath);

// Verificar que el archivo se creó correctamente
if (fs.existsSync(cachePath)) {
  const stats = fs.statSync(cachePath);
  console.log(`   Tamaño: ${stats.size} bytes`);
  
  // Verificar contenido básico
  const content = fs.readFileSync(cachePath, 'utf8');
  if (content.includes('cacheImpl') && content.includes('module.exports')) {
    console.log('✅ Polyfill verificado correctamente');
  } else {
    console.warn('⚠️  Advertencia: El contenido del polyfill podría no ser correcto');
  }
} else {
  console.error('❌ Error: No se pudo crear el archivo polyfill');
  process.exit(1);
}


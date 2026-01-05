const fs = require('fs');
const path = require('path');

// Crear polyfill para react/cache antes del build
const reactPath = path.join(process.cwd(), 'node_modules', 'react');
const cachePath = path.join(reactPath, 'cache.js');
const localPolyfillPath = path.join(process.cwd(), 'src', 'lib', 'polyfills', 'react-cache.js');

// Verificar que node_modules/react existe
if (!fs.existsSync(reactPath)) {
  console.error('❌ Error: node_modules/react no encontrado. Ejecuta npm install primero.');
  process.exit(1);
}

// Asegurar que el directorio existe
if (!fs.existsSync(reactPath)) {
  fs.mkdirSync(reactPath, { recursive: true });
}

// Verificar si existe el polyfill local
if (fs.existsSync(localPolyfillPath)) {
  console.log('✅ Polyfill local encontrado, copiando a node_modules...');
  
  // Eliminar el polyfill existente si existe para forzar actualización
  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath);
  }
  
  // Copiar el polyfill local a node_modules
  fs.copyFileSync(localPolyfillPath, cachePath);
  console.log('✅ Polyfill copiado a:', cachePath);
  
  // Verificar que el archivo se copió correctamente
  if (fs.existsSync(cachePath)) {
    const stats = fs.statSync(cachePath);
    console.log(`   Tamaño: ${stats.size} bytes`);
    console.log('✅ Polyfill verificado correctamente');
  } else {
    console.error('❌ Error: No se pudo copiar el archivo polyfill');
    process.exit(1);
  }
  
  // Continuar para que el build pueda usar el polyfill
  // No hacer exit(0) porque el build puede necesitar continuar
} else {

  // Si no existe el polyfill local, crear uno básico
  console.log('⚠️  Polyfill local no encontrado, creando uno básico...');

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
// CRÍTICO: Debe funcionar con todos los patrones de importación:
// - import cache from 'react/cache'
// - import { cache } from 'react/cache'
// - import * as n from 'react/cache'; n.cache()
// - (0, n.cache)() usado por webpack
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

// CRÍTICO: Crear objeto de exportación que soporte todos los patrones
// Necesitamos que funcione como objeto (import * as n) y como función (import cache)
const cacheExport = function(fn) {
  return cacheImpl(fn);
};

// Agregar propiedades directamente a la función (enumerables para import * as n)
Object.defineProperty(cacheExport, 'cache', {
  value: cacheImpl,
  writable: false,
  enumerable: true,  // CRÍTICO: debe ser enumerable para import * as n
  configurable: false
});

Object.defineProperty(cacheExport, 'default', {
  value: cacheImpl,
  writable: false,
  enumerable: true,
  configurable: false
});

Object.defineProperty(cacheExport, '__esModule', {
  value: true,
  writable: false,
  enumerable: false,
  configurable: false
});

// Exportar la función con propiedades
module.exports = cacheExport;

// Exportar también como objeto para compatibilidad adicional
module.exports.cache = cacheImpl;
module.exports.default = cacheImpl;
module.exports.__esModule = true;

// Soporte para ES modules (si se usa transpilador)
if (typeof exports !== 'undefined') {
  Object.defineProperty(exports, '__esModule', { value: true });
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
}
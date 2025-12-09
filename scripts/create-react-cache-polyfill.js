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
// Empezamos con un objeto plano y luego le agregamos las propiedades
const moduleExports = {};

// Primero definir cache como propiedad enumerable (CRÍTICO para (0, n.cache))
Object.defineProperty(moduleExports, 'cache', {
  value: cacheImpl,
  writable: false,
  enumerable: true,
  configurable: false
});

// Definir default export
Object.defineProperty(moduleExports, 'default', {
  value: cacheImpl,
  writable: false,
  enumerable: true,
  configurable: false
});

// Marcar como módulo ES
Object.defineProperty(moduleExports, '__esModule', {
  value: true,
  writable: false,
  enumerable: false,
  configurable: false
});

// También hacer que moduleExports sea callable (para compatibilidad con algunos patrones)
// Creamos una función que delega a cacheImpl
const callableExport = function(fn) {
  return cacheImpl(fn);
};

// Copiar todas las propiedades del objeto al callable
Object.keys(moduleExports).forEach(key => {
  Object.defineProperty(callableExport, key, {
    value: moduleExports[key],
    writable: false,
    enumerable: key !== '__esModule',
    configurable: false
  });
});

// Agregar cache directamente al callable también
Object.defineProperty(callableExport, 'cache', {
  value: cacheImpl,
  writable: false,
  enumerable: true,
  configurable: false
});

Object.defineProperty(callableExport, 'default', {
  value: cacheImpl,
  writable: false,
  enumerable: true,
  configurable: false
});

Object.defineProperty(callableExport, '__esModule', {
  value: true,
  writable: false,
  enumerable: false,
  configurable: false
});

// Exportar como objeto (esto funciona mejor con webpack)
module.exports = callableExport;

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


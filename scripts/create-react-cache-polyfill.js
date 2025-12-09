const fs = require('fs');
const path = require('path');

// Crear polyfill para react/cache antes del build
const reactPath = path.join(process.cwd(), 'node_modules', 'react');
const cachePath = path.join(reactPath, 'cache.js');

// Verificar si react/cache ya existe
if (!fs.existsSync(cachePath)) {
  // Asegurar que el directorio existe
  if (!fs.existsSync(reactPath)) {
    fs.mkdirSync(reactPath, { recursive: true });
  }

  // Crear polyfill que exporta un objeto con cache como propiedad
  // Esto es necesario para import * as f from 'react/cache'; f.cache(...)
  // Usar formato compatible con ambos CommonJS y ES modules
  // Versión mejorada que asegura que cache sea accesible de todas las formas
  // IMPORTANTE: Debe funcionar con el patrón (0, r.cache) usado por webpack
  const polyfillContent = `'use strict';

// Polyfill para react/cache en React 18.3.1
// Next.js puede requerir esto pero no está disponible en React 18.3.1
// Este polyfill exporta un objeto con cache como propiedad para compatibilidad con namespace imports

function cacheImpl(fn) {
  if (typeof fn !== 'function') {
    throw new Error('cache requires a function');
  }
  return fn;
}

// Crear objeto de exportación con cache como propiedad (para import * as f from 'react/cache')
// IMPORTANTE: cache debe ser una función directamente accesible
// El patrón (0, r.cache) requiere que cache sea una propiedad enumerable del objeto exportado
const cacheObj = {
  cache: cacheImpl,
  default: cacheImpl
};

// Asegurar que cache es no-configurable y enumerable (importante para webpack)
Object.defineProperty(cacheObj, 'cache', {
  value: cacheImpl,
  writable: false,
  enumerable: true,
  configurable: false
});

Object.defineProperty(cacheObj, 'default', {
  value: cacheImpl,
  writable: false,
  enumerable: true,
  configurable: false
});

// También hacer que cacheImpl tenga cache como propiedad (para compatibilidad adicional)
cacheImpl.cache = cacheImpl;

// Exportar objeto (esto permite f.cache y d.cache y (0, r.cache))
module.exports = cacheObj;

// Asegurar que las propiedades están disponibles directamente en module.exports
// Esto es crítico para que webpack pueda resolver (0, r.cache) correctamente
if (!module.exports.cache) {
  Object.defineProperty(module.exports, 'cache', {
    value: cacheImpl,
    writable: false,
    enumerable: true,
    configurable: false
  });
}

if (!module.exports.default) {
  Object.defineProperty(module.exports, 'default', {
    value: cacheImpl,
    writable: false,
    enumerable: true,
    configurable: false
  });
}

// Soporte para ES modules
if (typeof exports !== 'undefined') {
  exports.cache = cacheImpl;
  exports.default = cacheImpl;
}
`;

  fs.writeFileSync(cachePath, polyfillContent, 'utf8');
  console.log('✅ Polyfill de react/cache creado en:', cachePath);
} else {
  console.log('ℹ️  react/cache ya existe, no se creó polyfill');
}


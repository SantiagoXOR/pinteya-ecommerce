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
  const polyfillContent = `'use strict';

// Polyfill para react/cache en React 18.3.1
// Next.js 16 requiere esto pero no está disponible en React 18.3.1
// Este polyfill exporta un objeto con cache como propiedad para compatibilidad con namespace imports

function cacheImpl(fn) {
  if (typeof fn !== 'function') {
    throw new Error('cache requires a function');
  }
  return fn;
}

// Crear objeto de exportación con cache como propiedad (para import * as f from 'react/cache')
const cacheObj = {
  cache: cacheImpl,
  default: cacheImpl
};

// También hacer que cacheImpl tenga cache como propiedad (para compatibilidad adicional)
cacheImpl.cache = cacheImpl;

// Exportar objeto (esto permite f.cache y d.cache)
module.exports = cacheObj;

// También exportar la función directamente como fallback
module.exports.cache = cacheImpl;
module.exports.default = cacheImpl;
`;

  fs.writeFileSync(cachePath, polyfillContent, 'utf8');
  console.log('✅ Polyfill de react/cache creado en:', cachePath);
} else {
  console.log('ℹ️  react/cache ya existe, no se creó polyfill');
}


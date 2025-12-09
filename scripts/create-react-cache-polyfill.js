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

  // Crear polyfill
  const polyfillContent = `'use strict';

// Polyfill para react/cache en React 18.3.1
// Next.js 16 requiere esto pero no está disponible en React 18.3.1

function cache(fn) {
  if (typeof fn !== 'function') {
    throw new Error('cache requires a function');
  }
  return fn;
}

// Exportar como función con cache como propiedad
cache.cache = cache;

// Exportar de todas las formas posibles
module.exports = cache;
module.exports.cache = cache;
module.exports.default = cache;

// Soporte para ES modules
if (typeof exports !== 'undefined') {
  exports.cache = cache;
  exports.default = cache;
}
`;

  fs.writeFileSync(cachePath, polyfillContent, 'utf8');
  console.log('✅ Polyfill de react/cache creado en:', cachePath);
} else {
  console.log('ℹ️  react/cache ya existe, no se creó polyfill');
}


'use strict';

// Polyfill para react/cache en React 18.3.1
// Next.js 16 requiere esto pero no está disponible en React 18.3.1
// Este polyfill debe funcionar con todos los patrones de importación incluyendo (0, _react.cache)

function cacheImpl(fn) {
  if (typeof fn !== 'function') {
    throw new Error('cache requires a function');
  }
  // En React 19, cache memoiza funciones, aquí simplemente devolvemos la función
  return fn;
}

// CRÍTICO: Exportar directamente como función para que funcione con (0, _react.cache)
// Webpack usa este patrón: (0, _react.cache)(fn)
// Necesitamos que cache sea una función directamente exportada
module.exports = cacheImpl;

// También exportar como propiedad para compatibilidad con otros patrones
module.exports.cache = cacheImpl;
module.exports.default = cacheImpl;
module.exports.__esModule = true;

// Soporte para ES modules
if (typeof exports !== 'undefined') {
  Object.defineProperty(exports, '__esModule', { value: true });
  exports.cache = cacheImpl;
  exports.default = cacheImpl;
}

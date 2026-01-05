'use strict';

// Polyfill para react/cache en React 18.3.1
// Next.js 15 puede requerir esto pero no está disponible en React 18.3.1
// Este polyfill debe funcionar con todos los patrones de importación

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

// Soporte para ES modules
if (typeof exports !== 'undefined') {
  Object.defineProperty(exports, '__esModule', { value: true });
  exports.cache = cacheImpl;
  exports.default = cacheImpl;
}

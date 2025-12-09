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
// También hacer que moduleExports sea callable (para compatibilidad con algunos patrones)
// Creamos una función que delega a cacheImpl
const callableExport = function(fn) {
  return cacheImpl(fn);
};

// Agregar cache directamente al callable (CRÍTICO para (0, n.cache))
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

// Exportar (CommonJS)
module.exports = callableExport;

// Soporte para ES modules
if (typeof exports !== 'undefined') {
  Object.defineProperty(exports, '__esModule', { value: true });
  exports.cache = cacheImpl;
  exports.default = cacheImpl;
}


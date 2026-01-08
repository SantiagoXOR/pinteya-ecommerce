'use strict';

// Wrapper para react que agrega la propiedad cache
// Next.js 16 intenta acceder a react.cache directamente
const react = require('react');
const cachePolyfill = require('./react-cache');

// Agregar cache como propiedad de react
Object.defineProperty(react, 'cache', {
  value: cachePolyfill,
  writable: false,
  enumerable: true,
  configurable: false
});

module.exports = react;

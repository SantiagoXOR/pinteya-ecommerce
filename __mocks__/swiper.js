/**
 * Mock para Swiper - Patrón 1: Imports faltantes
 * Resuelve problemas de ESM modules en Jest
 */

// Mock básico de Swiper
const Swiper = jest.fn().mockImplementation(() => ({
  init: jest.fn(),
  destroy: jest.fn(),
  update: jest.fn(),
  slideTo: jest.fn(),
  slideNext: jest.fn(),
  slidePrev: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  activeIndex: 0,
  slides: [],
  params: {},
  el: null,
  wrapperEl: null,
}));

// Mock de Navigation
Swiper.Navigation = {
  init: jest.fn(),
  destroy: jest.fn(),
  update: jest.fn(),
};

// Mock de Pagination
Swiper.Pagination = {
  init: jest.fn(),
  destroy: jest.fn(),
  update: jest.fn(),
};

// Mock de Autoplay
Swiper.Autoplay = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
};

module.exports = Swiper;
module.exports.default = Swiper;

/**
 * Mock para Swiper Modules
 * Resuelve problemas de ESM en testing
 */

// Mock de Navigation module
export const Navigation = {
  name: 'navigation',
  params: {
    navigation: {
      nextEl: null,
      prevEl: null,
      hideOnClick: false,
      disabledClass: 'swiper-button-disabled',
      hiddenClass: 'swiper-button-hidden',
      lockClass: 'swiper-button-lock',
    },
  },
  create() {},
  on: {},
}

// Mock de Pagination module
export const Pagination = {
  name: 'pagination',
  params: {
    pagination: {
      el: null,
      bulletElement: 'span',
      clickable: false,
      hideOnClick: false,
      renderBullet: null,
      renderFraction: null,
      renderProgressbar: null,
      renderCustom: null,
      progressbarOpposite: false,
      type: 'bullets',
      dynamicBullets: false,
      dynamicMainBullets: 1,
      formatFractionCurrent: number => number,
      formatFractionTotal: number => number,
      bulletClass: 'swiper-pagination-bullet',
      bulletActiveClass: 'swiper-pagination-bullet-active',
      modifierClass: 'swiper-pagination-',
      currentClass: 'swiper-pagination-current',
      totalClass: 'swiper-pagination-total',
      hiddenClass: 'swiper-pagination-hidden',
      progressbarFillClass: 'swiper-pagination-progressbar-fill',
      progressbarOppositeClass: 'swiper-pagination-progressbar-opposite',
      clickableClass: 'swiper-pagination-clickable',
      lockClass: 'swiper-pagination-lock',
    },
  },
  create() {},
  on: {},
}

// Mock de Autoplay module
export const Autoplay = {
  name: 'autoplay',
  params: {
    autoplay: {
      delay: 3000,
      stopOnLastSlide: false,
      disableOnInteraction: true,
      reverseDirection: false,
      waitForTransition: true,
    },
  },
  create() {},
  on: {},
}

// Mock de EffectFade module
export const EffectFade = {
  name: 'effect-fade',
  params: {
    fadeEffect: {
      crossFade: false,
    },
  },
  create() {},
  on: {},
}

// Mock de Thumbs module
export const Thumbs = {
  name: 'thumbs',
  params: {
    thumbs: {
      swiper: null,
      multipleActiveThumbs: true,
      autoScrollOffset: 0,
      slideThumbActiveClass: 'swiper-slide-thumb-active',
      thumbsContainerClass: 'swiper-thumbs',
    },
  },
  create() {},
  on: {},
}

// Mock de Virtual module
export const Virtual = {
  name: 'virtual',
  params: {
    virtual: {
      enabled: false,
      slides: [],
      cache: true,
      renderSlide: null,
      renderExternal: null,
      renderExternalUpdate: true,
      addSlidesBefore: 0,
      addSlidesAfter: 0,
    },
  },
  create() {},
  on: {},
}

// Export default para compatibilidad
export default {
  Navigation,
  Pagination,
  Autoplay,
  EffectFade,
  Thumbs,
  Virtual,
}

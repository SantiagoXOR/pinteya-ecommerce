/**
 * Mock para Swiper React - Patrón 1: Imports faltantes
 * Resuelve problemas de ESM modules en Jest
 */

import React from 'react'

// Mock del componente Swiper
export const Swiper = React.forwardRef(({ children, ...props }, ref) => {
  return React.createElement(
    'div',
    {
      'data-testid': 'swiper-container',
      ref,
      ...props,
    },
    children
  )
})

// Mock del componente SwiperSlide
export const SwiperSlide = ({ children, ...props }) => {
  return React.createElement(
    'div',
    {
      'data-testid': 'swiper-slide',
      ...props,
    },
    children
  )
}

// Mock de useSwiper hook
export const useSwiper = () => ({
  slideTo: jest.fn(),
  slideNext: jest.fn(),
  slidePrev: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  activeIndex: 0,
  slides: [],
})

// Mock de useSwiperSlide hook
export const useSwiperSlide = () => ({
  isActive: false,
  isVisible: true,
  isPrev: false,
  isNext: false,
})

// Exportación por defecto
export default {
  Swiper,
  SwiperSlide,
  useSwiper,
  useSwiperSlide,
}

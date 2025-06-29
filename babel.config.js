// Tree shaking configuration for Pinteya E-commerce
// Optimiza imports para reducir bundle size

// ✅ Imports optimizados para Lucide React
// En lugar de: import { ShoppingCart, Heart, Search } from 'lucide-react'
// Usar: import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart'

// Configuración de babel para tree shaking - solo en producción
module.exports = {
  presets: ['next/babel'],
  plugins: [
    // Tree shaking comentado temporalmente para evitar problemas de importación
    // ...(process.env.NODE_ENV === 'production' ? [
    //   // Tree shaking para Lucide icons
    //   [
    //     'babel-plugin-import',
    //     {
    //       libraryName: 'lucide-react',
    //       libraryDirectory: 'dist/esm/icons',
    //       camel2DashComponentName: false,
    //     },
    //     'lucide-react',
    //   ],
    //   // Tree shaking para Radix UI
    //   [
    //     'babel-plugin-import',
    //     {
    //       libraryName: '@radix-ui/react-icons',
    //       libraryDirectory: 'dist',
    //       camel2DashComponentName: false,
    //     },
    //     'radix-icons',
    //   ],
    // ] : [])
  ],
};

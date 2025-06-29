// Webpack configuration for bundle optimization
const path = require('path');

module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000,
      cacheGroups: {
        default: false,
        vendors: false,
        
        // Vendor libraries
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /[\\/]node_modules[\\/]/,
          priority: 20,
          reuseExistingChunk: true,
        },
        
        // UI components
        ui: {
          name: 'ui',
          chunks: 'all',
          test: /[\\/]components[\\/]ui[\\/]/,
          priority: 30,
          reuseExistingChunk: true,
        },
        
        // Radix UI components
        radix: {
          name: 'radix',
          chunks: 'all',
          test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
          priority: 25,
          reuseExistingChunk: true,
        },
        
        // Clerk authentication
        clerk: {
          name: 'clerk',
          chunks: 'all',
          test: /[\\/]node_modules[\\/]@clerk[\\/]/,
          priority: 25,
          reuseExistingChunk: true,
        },
        
        // Common shared code
        common: {
          name: 'common',
          chunks: 'all',
          minChunks: 2,
          priority: 10,
          reuseExistingChunk: true,
        },
      },
    },
    
    // Runtime chunk optimization
    runtimeChunk: {
      name: 'runtime',
    },
  },
  
  // Module resolution optimization
  resolve: {
    alias: {
      // Tree shaking aliases
      'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react/dist/esm/icons'),
    },
  },
};

/**
 * Mock Service Worker - Servidor para tests del Header
 */

import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Datos de prueba
const mockTrendingSearches = [
  { query: 'pintura blanca', count: 150, category: 'Pinturas' },
  { query: 'latex interior', count: 120, category: 'Pinturas' },
  { query: 'esmalte sintético', count: 100, category: 'Esmaltes' },
  { query: 'barniz marino', count: 80, category: 'Barnices' },
  { query: 'rodillo 23cm', count: 75, category: 'Accesorios' },
];

const mockSearchSuggestions = [
  { id: 1, name: 'Pintura Latex Blanca 20L Sherwin Williams', category: 'Pinturas', price: 15000 },
  { id: 2, name: 'Pintura Latex Interior Premium Petrilac', category: 'Pinturas', price: 12000 },
  { id: 3, name: 'Esmalte Sintético Blanco Sinteplast', category: 'Esmaltes', price: 8500 },
  { id: 4, name: 'Barniz Marino Transparente Plavicon', category: 'Barnices', price: 6500 },
  { id: 5, name: 'Rodillo Antigota 23cm Akapol', category: 'Accesorios', price: 2500 },
];

const mockProducts = [
  {
    id: 1,
    name: 'Pintura Latex Blanca 20L',
    description: 'Pintura latex interior de alta calidad',
    price: 15000,
    category: 'Pinturas',
    brand: 'Sherwin Williams',
    stock: 25,
    image_url: 'https://example.com/pintura-blanca.jpg',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Esmalte Sintético Azul',
    description: 'Esmalte sintético para exteriores',
    price: 8500,
    category: 'Esmaltes',
    brand: 'Sinteplast',
    stock: 15,
    image_url: 'https://example.com/esmalte-azul.jpg',
    created_at: '2024-01-02T00:00:00Z',
  },
];

const mockCategories = [
  { id: 1, name: 'Pinturas', slug: 'pinturas', description: 'Pinturas para interior y exterior' },
  { id: 2, name: 'Esmaltes', slug: 'esmaltes', description: 'Esmaltes sintéticos y al agua' },
  { id: 3, name: 'Barnices', slug: 'barnices', description: 'Barnices y protectores de madera' },
  { id: 4, name: 'Accesorios', slug: 'accesorios', description: 'Rodillos, pinceles y herramientas' },
];

const mockDeliveryZones = [
  {
    id: 'cordoba-capital',
    name: 'Córdoba Capital',
    coordinates: { lat: -31.4201, lng: -64.1888 },
    delivery_fee: 0,
    free_shipping_threshold: 15000,
  },
  {
    id: 'villa-carlos-paz',
    name: 'Villa Carlos Paz',
    coordinates: { lat: -31.4241, lng: -64.4978 },
    delivery_fee: 500,
    free_shipping_threshold: 20000,
  },
];

// Configuración del servidor MSW
export const server = setupServer(
  // API de búsquedas trending
  rest.get('/api/search/trending', (req, res, ctx) => {
    const limit = parseInt(req.url.searchParams.get('limit') || '10');
    const days = parseInt(req.url.searchParams.get('days') || '7');
    const category = req.url.searchParams.get('category');

    let filteredSearches = mockTrendingSearches;
    
    if (category) {
      filteredSearches = mockTrendingSearches.filter(
        search => search.category.toLowerCase() === category.toLowerCase()
      );
    }

    const limitedSearches = filteredSearches.slice(0, limit);

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: limitedSearches,
        count: limitedSearches.length,
        total: filteredSearches.length,
        params: { limit, days, category },
      })
    );
  }),

  // API de sugerencias de búsqueda
  rest.get('/api/search/suggestions', (req, res, ctx) => {
    const query = req.url.searchParams.get('q') || '';
    const limit = parseInt(req.url.searchParams.get('limit') || '5');

    if (!query || query.length < 2) {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: [],
          count: 0,
          message: 'Query too short',
        })
      );
    }

    const filteredSuggestions = mockSearchSuggestions.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    );

    const limitedSuggestions = filteredSuggestions.slice(0, limit);

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: limitedSuggestions,
        count: limitedSuggestions.length,
        query,
      })
    );
  }),

  // API de productos
  rest.get('/api/products', (req, res, ctx) => {
    const search = req.url.searchParams.get('search') || req.url.searchParams.get('q');
    const category = req.url.searchParams.get('category');
    const limit = parseInt(req.url.searchParams.get('limit') || '10');
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const sortBy = req.url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = req.url.searchParams.get('sortOrder') || 'desc';

    let filteredProducts = [...mockProducts];

    // Filtrar por búsqueda
    if (search) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase()) ||
        product.brand.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (category) {
      filteredProducts = filteredProducts.filter(product =>
        product.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Ordenar
    filteredProducts.sort((a, b) => {
      let aValue = a[sortBy as keyof typeof a];
      let bValue = b[sortBy as keyof typeof b];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : 1;
      } else {
        return aValue < bValue ? -1 : 1;
      }
    });

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: paginatedProducts,
        pagination: {
          total: filteredProducts.length,
          page,
          limit,
          totalPages: Math.ceil(filteredProducts.length / limit),
        },
        filters: { search, category, sortBy, sortOrder },
      })
    );
  }),

  // API de categorías
  rest.get('/api/categories', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockCategories,
        count: mockCategories.length,
      })
    );
  }),

  // API de zonas de entrega
  rest.get('/api/delivery/zones', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockDeliveryZones,
        count: mockDeliveryZones.length,
      })
    );
  }),

  // API de geolocalización reversa
  rest.post('/api/geolocation/reverse', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          zone: mockDeliveryZones[0], // Córdoba Capital por defecto
          address: 'Córdoba, Argentina',
        },
      })
    );
  }),

  // API de autenticación (mock)
  rest.post('/api/auth/signin', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          user: {
            id: 'user_test_123',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
          },
          token: 'mock_jwt_token',
        },
      })
    );
  }),

  // Manejo de errores - API no encontrada
  rest.get('*', (req, res, ctx) => {
    console.warn(`Unhandled GET request to ${req.url.pathname}`);
    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        error: 'API endpoint not found',
        path: req.url.pathname,
      })
    );
  }),

  rest.post('*', (req, res, ctx) => {
    console.warn(`Unhandled POST request to ${req.url.pathname}`);
    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        error: 'API endpoint not found',
        path: req.url.pathname,
      })
    );
  }),
);

// Handlers para casos de error específicos
export const errorHandlers = [
  // Error 500 en trending searches
  rest.get('/api/search/trending', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch trending searches',
      })
    );
  }),

  // Error 429 - Rate limit
  rest.get('/api/search/suggestions', (req, res, ctx) => {
    return res(
      ctx.status(429),
      ctx.json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests',
        retryAfter: 60,
      })
    );
  }),

  // Error de timeout
  rest.get('/api/products', (req, res, ctx) => {
    return res(
      ctx.delay('infinite')
    );
  }),
];

// Handlers para casos de éxito específicos
export const successHandlers = [
  // Respuesta vacía para trending searches
  rest.get('/api/search/trending', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [],
        count: 0,
        message: 'No trending searches found',
      })
    );
  }),

  // Respuesta con muchos resultados
  rest.get('/api/search/suggestions', (req, res, ctx) => {
    const manyResults = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Producto ${i + 1}`,
      category: 'Test Category',
      price: 1000 + i * 100,
    }));

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: manyResults,
        count: manyResults.length,
      })
    );
  }),
];

export { mockTrendingSearches, mockSearchSuggestions, mockProducts, mockCategories, mockDeliveryZones };

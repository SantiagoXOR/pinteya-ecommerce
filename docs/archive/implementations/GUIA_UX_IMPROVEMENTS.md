# 🎨 Guía de Implementación: User Experience Improvements

## Sistema E-commerce Pinteya - Prioridad Alta

---

## 📋 Resumen de la Mejora

**Objetivo**: Optimizar la experiencia del usuario para aumentar conversión y satisfacción
**Impacto**: Muy Alto (4.5/5) - Conversión, retención, satisfacción del usuario
**Viabilidad**: Alta (4.2/5) - Herramientas disponibles, expertise en UX/UI
**Timeline**: 8 semanas (Sprint 1-5)
**Responsables**: UX Designer + Frontend Lead + Product Manager

---

## 🎯 Objetivos Específicos

### Estado Actual vs Target

| Métrica UX        | Actual   | Target   | Mejora |
| ----------------- | -------- | -------- | ------ |
| Conversion Rate   | 2.3%     | 4.5%+    | +96%   |
| Cart Abandonment  | 68%      | <45%     | -34%   |
| Page Load Time    | 3.2s     | <1.5s    | -53%   |
| Mobile Usability  | 75%      | 95%+     | +27%   |
| User Satisfaction | 3.8/5    | 4.7/5+   | +24%   |
| Task Completion   | 78%      | 92%+     | +18%   |
| Error Rate        | 12%      | <5%      | -58%   |
| Time to Purchase  | 8.5min   | <4min    | -53%   |
| Return User Rate  | 35%      | 55%+     | +57%   |
| Support Tickets   | 150/week | <75/week | -50%   |

---

## 🔧 Estrategias de Implementación

### 1. **Navigation & Information Architecture** 🧭

#### **Smart Navigation System**

```typescript
// src/components/navigation/SmartNavigation.tsx
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Menu, ShoppingCart, User, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: number;
  children?: NavigationItem[];
  isActive?: boolean;
  priority: number;
}

interface UserBehavior {
  frequentCategories: string[];
  recentSearches: string[];
  preferredBrands: string[];
  purchaseHistory: string[];
}

export const SmartNavigation = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userBehavior, setUserBehavior] = useState<UserBehavior | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Smart navigation items based on user behavior
  const navigationItems = useMemo(() => {
    const baseItems: NavigationItem[] = [
      {
        id: 'home',
        label: 'Inicio',
        href: '/',
        priority: 1
      },
      {
        id: 'categories',
        label: 'Categorías',
        href: '/categories',
        priority: 2,
        children: [
          { id: 'electronics', label: 'Electrónicos', href: '/categories/electronics', priority: 1 },
          { id: 'clothing', label: 'Ropa', href: '/categories/clothing', priority: 2 },
          { id: 'home', label: 'Hogar', href: '/categories/home', priority: 3 },
          { id: 'sports', label: 'Deportes', href: '/categories/sports', priority: 4 }
        ]
      },
      {
        id: 'deals',
        label: 'Ofertas',
        href: '/deals',
        priority: 3,
        badge: 5 // Number of active deals
      },
      {
        id: 'brands',
        label: 'Marcas',
        href: '/brands',
        priority: 4
      }
    ];

    // Personalize based on user behavior
    if (userBehavior) {
      // Promote frequently visited categories
      baseItems.forEach(item => {
        if (item.children) {
          item.children.forEach(child => {
            if (userBehavior.frequentCategories.includes(child.id)) {
              child.priority -= 1; // Higher priority
            }
          });
          // Sort children by priority
          item.children.sort((a, b) => a.priority - b.priority);
        }
      });
    }

    return baseItems;
  }, [userBehavior]);

  // Smart search with suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const suggestions = [
      // Recent searches
      ...(userBehavior?.recentSearches || []).filter(search =>
        search.toLowerCase().includes(searchQuery.toLowerCase())
      ),
      // Popular products
      'iPhone 15 Pro',
      'Samsung Galaxy S24',
      'MacBook Air M3',
      'Nike Air Max',
      'Adidas Ultraboost'
    ].filter(suggestion =>
      suggestion.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);

    return suggestions;
  }, [searchQuery, userBehavior]);

  useEffect(() => {
    // Load user behavior data
    fetchUserBehavior();
    // Load cart and wishlist counts
    fetchCartCount();
    fetchWishlistCount();
  }, []);

  const fetchUserBehavior = async () => {
    try {
      const response = await fetch('/api/user/behavior');
      const data = await response.json();
      setUserBehavior(data);
    } catch (error) {
      console.error('Failed to fetch user behavior:', error);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await fetch('/api/cart/count');
      const data = await response.json();
      setCartCount(data.count);
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const response = await fetch('/api/wishlist/count');
      const data = await response.json();
      setWishlistCount(data.count);
    } catch (error) {
      console.error('Failed to fetch wishlist count:', error);
    }
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Track search
      trackUserAction('search', { query });
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const trackUserAction = async (action: string, data: any) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data, timestamp: new Date() })
      });
    } catch (error) {
      console.error('Failed to track user action:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center">
              <img className="h-8 w-auto" src="/logo.svg" alt="Pinteya" />
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigationItems.map((item) => (
                <div key={item.id} className="relative group">
                  <a
                    href={item.href}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    onClick={() => trackUserAction('navigation_click', { item: item.id })}
                  >
                    {item.label}
                    {item.badge && (
                      <Badge className="ml-1 bg-red-500 text-white text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </a>

                  {/* Dropdown Menu */}
                  {item.children && (
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-1">
                        {item.children.map((child) => (
                          <a
                            key={child.id}
                            href={child.href}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                            onClick={() => trackUserAction('navigation_click', { item: child.id })}
                          >
                            {child.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8 relative">
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>

            {/* Search Suggestions */}
            {searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      setSearchQuery(suggestion);
                      handleSearch(suggestion);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {/* Wishlist */}
            <Button variant="ghost" size="sm" className="relative">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full">
                  {wishlistCount}
                </Badge>
              )}
            </Button>

            {/* Cart */}
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <Button variant="ghost" size="sm">
              <User className="h-5 w-5" />
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            {navigationItems.map((item) => (
              <div key={item.id}>
                <a
                  href={item.href}
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => {
                    trackUserAction('navigation_click', { item: item.id });
                    setIsMenuOpen(false);
                  }}
                >
                  {item.label}
                  {item.badge && (
                    <Badge className="ml-2 bg-red-500 text-white text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </a>

                {/* Mobile Submenu */}
                {item.children && (
                  <div className="pl-4">
                    {item.children.map((child) => (
                      <a
                        key={child.id}
                        href={child.href}
                        className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-sm"
                        onClick={() => {
                          trackUserAction('navigation_click', { item: child.id });
                          setIsMenuOpen(false);
                        }}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};
```

#### **Breadcrumb Navigation**

```typescript
// src/components/navigation/BreadcrumbNavigation.tsx
import { ChevronRight, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href: string;
  isActive?: boolean;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export const BreadcrumbNavigation = ({
  items,
  showHome = true
}: BreadcrumbNavigationProps) => {
  const router = useRouter();

  const allItems = showHome
    ? [{ label: 'Inicio', href: '/' }, ...items]
    : items;

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 py-3">
      {allItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
          )}

          {index === 0 && showHome && (
            <Home className="h-4 w-4 mr-1" />
          )}

          {index === allItems.length - 1 || item.isActive ? (
            <span className="text-gray-900 font-medium">
              {item.label}
            </span>
          ) : (
            <button
              onClick={() => router.push(item.href)}
              className="hover:text-blue-600 transition-colors"
            >
              {item.label}
            </button>
          )}
        </div>
      ))}
    </nav>
  );
};
```

### 2. **Product Discovery & Search** 🔍

#### **Advanced Search with Filters**

```typescript
// src/components/search/AdvancedSearch.tsx
import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SearchFilters {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  rating: number;
  inStock: boolean;
  freeShipping: boolean;
  sortBy: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'newest';
}

interface SearchResult {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  brand: string;
  category: string;
  inStock: boolean;
  freeShipping: boolean;
  isNew?: boolean;
  discount?: number;
}

interface AdvancedSearchProps {
  initialQuery?: string;
  onResults: (results: SearchResult[]) => void;
}

export const AdvancedSearch = ({ initialQuery = '', onResults }: AdvancedSearchProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    brands: [],
    priceRange: [0, 1000],
    rating: 0,
    inStock: false,
    freeShipping: false,
    sortBy: 'relevance'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);

  // Available filter options
  const filterOptions = {
    categories: [
      { id: 'electronics', label: 'Electrónicos', count: 1250 },
      { id: 'clothing', label: 'Ropa', count: 890 },
      { id: 'home', label: 'Hogar', count: 650 },
      { id: 'sports', label: 'Deportes', count: 420 },
      { id: 'books', label: 'Libros', count: 380 }
    ],
    brands: [
      { id: 'apple', label: 'Apple', count: 150 },
      { id: 'samsung', label: 'Samsung', count: 120 },
      { id: 'nike', label: 'Nike', count: 95 },
      { id: 'adidas', label: 'Adidas', count: 80 },
      { id: 'sony', label: 'Sony', count: 75 }
    ],
    sortOptions: [
      { value: 'relevance', label: 'Más relevante' },
      { value: 'price_low', label: 'Precio: menor a mayor' },
      { value: 'price_high', label: 'Precio: mayor a menor' },
      { value: 'rating', label: 'Mejor valorados' },
      { value: 'newest', label: 'Más recientes' }
    ]
  };

  // Perform search when query or filters change
  useEffect(() => {
    if (query.trim() || hasActiveFilters()) {
      performSearch();
    }
  }, [query, filters]);

  const hasActiveFilters = () => {
    return (
      filters.categories.length > 0 ||
      filters.brands.length > 0 ||
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < 1000 ||
      filters.rating > 0 ||
      filters.inStock ||
      filters.freeShipping
    );
  };

  const performSearch = async () => {
    setIsSearching(true);

    try {
      const searchParams = new URLSearchParams({
        q: query,
        categories: filters.categories.join(','),
        brands: filters.brands.join(','),
        minPrice: filters.priceRange[0].toString(),
        maxPrice: filters.priceRange[1].toString(),
        minRating: filters.rating.toString(),
        inStock: filters.inStock.toString(),
        freeShipping: filters.freeShipping.toString(),
        sortBy: filters.sortBy
      });

      const response = await fetch(`/api/search?${searchParams}`);
      const data = await response.json();

      setSearchResults(data.results);
      setTotalResults(data.total);
      onResults(data.results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'categories' | 'brands', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: [0, 1000],
      rating: 0,
      inStock: false,
      freeShipping: false,
      sortBy: 'relevance'
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.brands.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) count++;
    if (filters.rating > 0) count++;
    if (filters.inStock) count++;
    if (filters.freeShipping) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Buscar productos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {isSearching ? 'Buscando...' : `${totalResults} resultados encontrados`}
        </p>

        <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Filtros de búsqueda</h3>
            {hasActiveFilters() && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Categories */}
            <div>
              <h4 className="font-medium mb-3">Categorías</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filterOptions.categories.map(category => (
                  <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={filters.categories.includes(category.id)}
                      onCheckedChange={() => toggleArrayFilter('categories', category.id)}
                    />
                    <span className="text-sm">{category.label}</span>
                    <span className="text-xs text-gray-500">({category.count})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div>
              <h4 className="font-medium mb-3">Marcas</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filterOptions.brands.map(brand => (
                  <label key={brand.id} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={filters.brands.includes(brand.id)}
                      onCheckedChange={() => toggleArrayFilter('brands', brand.id)}
                    />
                    <span className="text-sm">{brand.label}</span>
                    <span className="text-xs text-gray-500">({brand.count})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="font-medium mb-3">Rango de precio</h4>
              <div className="space-y-3">
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilter('priceRange', value)}
                  max={1000}
                  min={0}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>${filters.priceRange[0]}</span>
                  <span>${filters.priceRange[1]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                checked={filters.inStock}
                onCheckedChange={(checked) => updateFilter('inStock', checked)}
              />
              <span className="text-sm">Solo productos en stock</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                checked={filters.freeShipping}
                onCheckedChange={(checked) => updateFilter('freeShipping', checked)}
              />
              <span className="text-sm">Envío gratis</span>
            </label>

            <div className="flex items-center space-x-2">
              <span className="text-sm">Calificación mínima:</span>
              <Select
                value={filters.rating.toString()}
                onValueChange={(value) => updateFilter('rating', parseInt(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Todas</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 3. **Mobile-First Responsive Design** 📱

#### **Responsive Product Grid**

```typescript
// src/components/products/ResponsiveProductGrid.tsx
import { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Eye, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  brand: string;
  category: string;
  inStock: boolean;
  freeShipping: boolean;
  isNew?: boolean;
  discount?: number;
  isWishlisted?: boolean;
}

interface ResponsiveProductGridProps {
  products: Product[];
  loading?: boolean;
  onProductClick: (product: Product) => void;
  onAddToCart: (productId: string) => void;
  onToggleWishlist: (productId: string) => void;
}

export const ResponsiveProductGrid = ({
  products,
  loading = false,
  onProductClick,
  onAddToCart,
  onToggleWishlist
}: ResponsiveProductGridProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  // Detect screen size for responsive behavior
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleImageError = (productId: string) => {
    setImageLoadErrors(prev => new Set([...prev, productId]));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="bg-gray-200 h-48 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                <div className="bg-gray-200 h-6 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle (Desktop only) */}
      {!isMobile && (
        <div className="flex justify-end">
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              List
            </Button>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className={`
        ${viewMode === 'grid' || isMobile
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-4'
        }
      `}>
        {products.map((product) => (
          <Card
            key={product.id}
            className={`
              group cursor-pointer transition-all duration-200 hover:shadow-lg
              ${viewMode === 'list' && !isMobile ? 'flex' : ''}
            `}
            onClick={() => onProductClick(product)}
          >
            <CardContent className={`
              p-0 relative
              ${viewMode === 'list' && !isMobile ? 'flex w-full' : ''}
            `}>
              {/* Product Image */}
              <div className={`
                relative overflow-hidden
                ${viewMode === 'list' && !isMobile
                  ? 'w-48 h-48 flex-shrink-0'
                  : 'aspect-square'
                }
              `}>
                <img
                  src={imageLoadErrors.has(product.id)
                    ? '/placeholder-product.jpg'
                    : product.image
                  }
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  onError={() => handleImageError(product.id)}
                  loading="lazy"
                />

                {/* Badges */}
                <div className="absolute top-2 left-2 space-y-1">
                  {product.isNew && (
                    <Badge className="bg-green-500 text-white text-xs">
                      Nuevo
                    </Badge>
                  )}
                  {product.discount && (
                    <Badge className="bg-red-500 text-white text-xs">
                      -{product.discount}%
                    </Badge>
                  )}
                  {product.freeShipping && (
                    <Badge className="bg-blue-500 text-white text-xs">
                      Envío gratis
                    </Badge>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-y-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(product.id);
                    }}
                  >
                    <Heart className={`h-4 w-4 ${
                      product.isWishlisted ? 'text-red-500 fill-current' : 'text-gray-600'
                    }`} />
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Quick view functionality
                    }}
                  >
                    <Eye className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>

                {/* Stock Status */}
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge className="bg-gray-800 text-white">
                      Agotado
                    </Badge>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className={`
                p-4 flex-1
                ${viewMode === 'list' && !isMobile ? 'flex flex-col justify-between' : ''}
              `}>
                <div className="space-y-2">
                  {/* Brand */}
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {product.brand}
                  </p>

                  {/* Product Name */}
                  <h3 className={`
                    font-medium text-gray-900 line-clamp-2
                    ${viewMode === 'list' && !isMobile ? 'text-lg' : 'text-sm'}
                  `}>
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center space-x-1">
                    <div className="flex">
                      {renderStars(product.rating)}
                    </div>
                    <span className="text-xs text-gray-500">
                      ({product.reviewCount})
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center space-x-2">
                    <span className={`
                      font-bold text-gray-900
                      ${viewMode === 'list' && !isMobile ? 'text-lg' : 'text-base'}
                    `}>
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                  className={`
                    w-full mt-3
                    ${!product.inStock ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  disabled={!product.inStock}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (product.inStock) {
                      onAddToCart(product.id);
                    }
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.inStock ? 'Añadir al carrito' : 'Agotado'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron productos
          </h3>
          <p className="text-gray-500">
            Intenta ajustar tus filtros de búsqueda
          </p>
        </div>
      )}
    </div>
  );
};
```

### 4. **Checkout Flow Optimization** 🛒

#### **Streamlined Checkout Process**

```typescript
// src/components/checkout/StreamlinedCheckout.tsx
import { useState, useEffect } from 'react';
import { Check, CreditCard, Truck, Shield, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface CheckoutStep {
  id: string;
  title: string;
  completed: boolean;
  active: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface PaymentMethod {
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
}

export const StreamlinedCheckout = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'ES'
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({ type: 'card' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps: CheckoutStep[] = [
    { id: 'cart', title: 'Carrito', completed: false, active: currentStep === 0 },
    { id: 'shipping', title: 'Envío', completed: false, active: currentStep === 1 },
    { id: 'payment', title: 'Pago', completed: false, active: currentStep === 2 },
    { id: 'confirmation', title: 'Confirmación', completed: false, active: currentStep === 3 }
  ];

  // Update step completion status
  steps.forEach((step, index) => {
    step.completed = index < currentStep;
  });

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const response = await fetch('/api/cart');
      const data = await response.json();
      setCartItems(data.items);
    } catch (error) {
      console.error('Failed to fetch cart items:', error);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    return subtotal > 50 ? 0 : 5.99; // Free shipping over €50
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.21; // 21% VAT
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping() + calculateTax();
  };

  const validateShippingAddress = () => {
    const newErrors: Record<string, string> = {};

    if (!shippingAddress.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }
    if (!shippingAddress.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }
    if (!shippingAddress.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!shippingAddress.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }
    if (!shippingAddress.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }
    if (!shippingAddress.postalCode.trim()) {
      newErrors.postalCode = 'El código postal es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePaymentMethod = () => {
    const newErrors: Record<string, string> = {};

    if (paymentMethod.type === 'card') {
      if (!paymentMethod.cardNumber?.trim()) {
        newErrors.cardNumber = 'Número de tarjeta requerido';
      }
      if (!paymentMethod.expiryDate?.trim()) {
        newErrors.expiryDate = 'Fecha de vencimiento requerida';
      }
      if (!paymentMethod.cvv?.trim()) {
        newErrors.cvv = 'CVV requerido';
      }
      if (!paymentMethod.cardholderName?.trim()) {
        newErrors.cardholderName = 'Nombre del titular requerido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !validateShippingAddress()) {
      return;
    }
    if (currentStep === 2 && !validatePaymentMethod()) {
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    try {
      const orderData = {
        items: cartItems,
        shippingAddress,
        paymentMethod,
        totals: {
          subtotal: calculateSubtotal(),
          shipping: calculateShipping(),
          tax: calculateTax(),
          total: calculateTotal()
        }
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        setCurrentStep(3); // Go to confirmation
      } else {
        throw new Error('Order failed');
      }
    } catch (error) {
      console.error('Order placement failed:', error);
      setErrors({ general: 'Error al procesar el pedido. Inténtalo de nuevo.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
                ${step.completed
                  ? 'bg-green-500 border-green-500 text-white'
                  : step.active
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                }
              `}>
                {step.completed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>

              <span className={`
                ml-2 text-sm font-medium
                ${step.active ? 'text-blue-600' : 'text-gray-500'}
              `}>
                {step.title}
              </span>

              {index < steps.length - 1 && (
                <div className={`
                  w-12 h-0.5 mx-4
                  ${step.completed ? 'bg-green-500' : 'bg-gray-300'}
                `} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 0: Cart Review */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Revisa tu pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.variant && (
                        <p className="text-sm text-gray-500">{item.variant}</p>
                      )}
                      <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                      <p className="text-sm text-gray-500">{formatPrice(item.price)} c/u</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Step 1: Shipping Address */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Información de envío
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre *</label>
                    <Input
                      value={shippingAddress.firstName}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                      className={errors.firstName ? 'border-red-500' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Apellidos *</label>
                    <Input
                      value={shippingAddress.lastName}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                      className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <Input
                      type="email"
                      value={shippingAddress.email}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Teléfono</label>
                    <Input
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Dirección *</label>
                    <Input
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                      className={errors.address ? 'border-red-500' : ''}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Ciudad *</label>
                    <Input
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Código Postal *</label>
                    <Input
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                      className={errors.postalCode ? 'border-red-500' : ''}
                    />
                    {errors.postalCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Payment Method */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Método de pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Method Selection */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { type: 'card', label: 'Tarjeta', icon: CreditCard },
                    { type: 'paypal', label: 'PayPal', icon: null },
                    { type: 'apple_pay', label: 'Apple Pay', icon: null },
                    { type: 'google_pay', label: 'Google Pay', icon: null }
                  ].map((method) => (
                    <Button
                      key={method.type}
                      variant={paymentMethod.type === method.type ? 'default' : 'outline'}
                      className="h-12"
                      onClick={() => setPaymentMethod({ type: method.type as any })}
                    >
                      {method.icon && <method.icon className="h-4 w-4 mr-2" />}
                      {method.label}
                    </Button>
                  ))}
                </div>

                {/* Card Details */}
                {paymentMethod.type === 'card' && (
                  <div className="space-y-4 p-4 border rounded">
                    <div>
                      <label className="block text-sm font-medium mb-1">Número de tarjeta *</label>
                      <Input
                        placeholder="1234 5678 9012 3456"
                        value={paymentMethod.cardNumber || ''}
                        onChange={(e) => setPaymentMethod(prev => ({ ...prev, cardNumber: e.target.value }))}
                        className={errors.cardNumber ? 'border-red-500' : ''}
                      />
                      {errors.cardNumber && (
                        <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Fecha vencimiento *</label>
                        <Input
                          placeholder="MM/AA"
                          value={paymentMethod.expiryDate || ''}
                          onChange={(e) => setPaymentMethod(prev => ({ ...prev, expiryDate: e.target.value }))}
                          className={errors.expiryDate ? 'border-red-500' : ''}
                        />
                        {errors.expiryDate && (
                          <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">CVV *</label>
                        <Input
                          placeholder="123"
                          value={paymentMethod.cvv || ''}
                          onChange={(e) => setPaymentMethod(prev => ({ ...prev, cvv: e.target.value }))}
                          className={errors.cvv ? 'border-red-500' : ''}
                        />
                        {errors.cvv && (
                          <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Nombre del titular *</label>
                      <Input
                        placeholder="Juan Pérez"
                        value={paymentMethod.cardholderName || ''}
                        onChange={(e) => setPaymentMethod(prev => ({ ...prev, cardholderName: e.target.value }))}
                        className={errors.cardholderName ? 'border-red-500' : ''}
                      />
                      {errors.cardholderName && (
                        <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Security Badge */}
                <div className="flex items-center justify-center p-4 bg-gray-50 rounded">
                  <Shield className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-600">
                    Tus datos están protegidos con encriptación SSL
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Order Confirmation */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-green-600">
                  <Check className="h-8 w-8 mx-auto mb-2" />
                  ¡Pedido confirmado!
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  Gracias por tu compra. Recibirás un email de confirmación en breve.
                </p>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="font-medium">Número de pedido: #12345</p>
                  <p className="text-sm text-gray-600">Tiempo estimado de entrega: 2-3 días laborables</p>
                </div>
                <Button onClick={() => window.location.href = '/orders'} className="w-full">
                  Ver mis pedidos
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumen del pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items Summary */}
              <div className="space-y-2">
                {cartItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="truncate">{item.name} x{item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                {cartItems.length > 3 && (
                  <p className="text-sm text-gray-500">+{cartItems.length - 3} productos más</p>
                )}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Envío</span>
                  <span>
                    {calculateShipping() === 0 ? (
                      <Badge className="bg-green-500 text-white text-xs">Gratis</Badge>
                    ) : (
                      formatPrice(calculateShipping())
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IVA (21%)</span>
                  <span>{formatPrice(calculateTax())}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>

              {/* Free Shipping Notice */}
              {calculateShipping() > 0 && (
                <div className="bg-blue-50 p-3 rounded text-sm">
                  <p className="text-blue-700">
                    Añade {formatPrice(50 - calculateSubtotal())} más para envío gratis
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Buttons */}
      {currentStep < 3 && (
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePreviousStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {currentStep === 2 ? (
            <Button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="min-w-[120px]"
            >
              {isProcessing ? 'Procesando...' : 'Finalizar pedido'}
            </Button>
          ) : (
            <Button onClick={handleNextStep}>
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      )}

      {/* Error Message */}
      {errors.general && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">{errors.general}</p>
        </div>
      )}
    </div>
  );
};
```

---

## 📊 Plan de Implementación

### **Fase 1: Fundamentos UX (Semanas 1-2)**

#### **Sprint 1.1: Navigation & Information Architecture**

- **Duración**: 1 semana
- **Responsables**: UX Designer + Frontend Lead
- **Entregables**:
  - Smart Navigation Component
  - Breadcrumb System
  - Mobile Menu Optimization
  - User Behavior Tracking

#### **Sprint 1.2: Search & Discovery**

- **Duración**: 1 semana
- **Responsables**: Frontend Lead + Backend Developer
- **Entregables**:
  - Advanced Search Component
  - Filter System
  - Search Analytics
  - Performance Optimization

### **Fase 2: Mobile & Responsive (Semanas 3-4)**

#### **Sprint 2.1: Mobile-First Design**

- **Duración**: 1 semana
- **Responsables**: UX Designer + Frontend Lead
- **Entregables**:
  - Responsive Product Grid
  - Mobile Navigation
  - Touch Interactions
  - Performance Optimization

#### **Sprint 2.2: Cross-Device Testing**

- **Duración**: 1 semana
- **Responsables**: QA Lead + Frontend Lead
- **Entregables**:
  - Device Testing Suite
  - Performance Benchmarks
  - Accessibility Compliance
  - Bug Fixes

### **Fase 3: Checkout Optimization (Semanas 5-6)**

#### **Sprint 3.1: Streamlined Checkout**

- **Duración**: 1 semana
- **Responsables**: Frontend Lead + UX Designer
- **Entregables**:
  - Multi-step Checkout
  - Payment Integration
  - Form Validation
  - Error Handling

#### **Sprint 3.2: Conversion Optimization**

- **Duración**: 1 semana
- **Responsables**: Product Manager + Analytics Team
- **Entregables**:
  - A/B Testing Setup
  - Conversion Tracking
  - Abandonment Recovery
  - Performance Metrics

### **Fase 4: Testing & Refinement (Semanas 7-8)**

#### **Sprint 4.1: User Testing**

- **Duración**: 1 semana
- **Responsables**: UX Designer + QA Lead
- **Entregables**:
  - User Testing Sessions
  - Usability Reports
  - Feedback Analysis
  - Improvement Recommendations

#### **Sprint 4.2: Final Optimization**

- **Duración**: 1 semana
- **Responsables**: Full Team
- **Entregables**:
  - Performance Optimization
  - Bug Fixes
  - Documentation
  - Launch Preparation

---

## 🎯 Métricas de Éxito

### **KPIs Principales**

| Métrica               | Baseline | Target   | Método de Medición  |
| --------------------- | -------- | -------- | ------------------- |
| **Conversion Rate**   | 2.3%     | 4.5%+    | Google Analytics    |
| **Cart Abandonment**  | 68%      | <45%     | E-commerce Tracking |
| **Page Load Time**    | 3.2s     | <1.5s    | Lighthouse/GTMetrix |
| **Mobile Usability**  | 75%      | 95%+     | Google PageSpeed    |
| **User Satisfaction** | 3.8/5    | 4.7/5+   | User Surveys        |
| **Task Completion**   | 78%      | 92%+     | User Testing        |
| **Error Rate**        | 12%      | <5%      | Error Tracking      |
| **Time to Purchase**  | 8.5min   | <4min    | Analytics Funnel    |
| **Return User Rate**  | 35%      | 55%+     | User Analytics      |
| **Support Tickets**   | 150/week | <75/week | Help Desk System    |

### **Métricas Secundarias**

- **Bounce Rate**: Reducir de 45% a <30%
- **Pages per Session**: Aumentar de 2.1 a 3.5+
- **Session Duration**: Aumentar de 3.2min a 5.5min+
- **Search Success Rate**: Aumentar de 65% a 85%+
- **Filter Usage**: Aumentar de 25% a 60%+
- **Mobile Conversion**: Aumentar de 1.8% a 3.8%+

---

## 🔧 Herramientas y Recursos

### **Desarrollo**

- **Frontend**: React, Next.js, TypeScript, Tailwind CSS
- **Testing**: Jest, React Testing Library, Playwright
- **Performance**: Lighthouse, WebPageTest, GTMetrix
- **Analytics**: Google Analytics 4, Hotjar, Mixpanel

### **Design**

- **Prototipado**: Figma, Adobe XD
- **Testing**: Maze, UserTesting, Optimal Workshop
- **Accessibility**: axe-core, WAVE, Lighthouse

### **Monitoreo**

- **Performance**: New Relic, DataDog
- **Errors**: Sentry, LogRocket
- **User Behavior**: Hotjar, FullStory
- **A/B Testing**: Optimizely, Google Optimize

---

## ⚠️ Riesgos y Mitigaciones

### **Riesgos Técnicos**

| Riesgo                      | Probabilidad | Impacto | Mitigación                                 |
| --------------------------- | ------------ | ------- | ------------------------------------------ |
| **Performance Degradation** | Media        | Alto    | Continuous monitoring, lazy loading        |
| **Cross-browser Issues**    | Alta         | Medio   | Extensive testing, progressive enhancement |
| **Mobile Compatibility**    | Media        | Alto    | Mobile-first approach, device testing      |
| **Third-party Integration** | Media        | Medio   | Fallback systems, error handling           |

### **Riesgos de Negocio**

| Riesgo                   | Probabilidad | Impacto | Mitigación                        |
| ------------------------ | ------------ | ------- | --------------------------------- |
| **User Resistance**      | Baja         | Alto    | Gradual rollout, user education   |
| **Conversion Drop**      | Media        | Alto    | A/B testing, rollback plan        |
| **Timeline Delays**      | Alta         | Medio   | Agile methodology, buffer time    |
| **Resource Constraints** | Media        | Medio   | Priority matrix, scope adjustment |

---

## 📋 Checklist de Implementación

### **Pre-Implementation**

- [ ] Stakeholder alignment
- [ ] Resource allocation
- [ ] Timeline confirmation
- [ ] Success metrics definition
- [ ] Risk assessment
- [ ] Backup plan creation

### **Development Phase**

- [ ] Component development
- [ ] Unit testing
- [ ] Integration testing
- [ ] Performance testing
- [ ] Accessibility testing
- [ ] Cross-browser testing

### **Testing Phase**

- [ ] User acceptance testing
- [ ] A/B testing setup
- [ ] Performance benchmarking
- [ ] Security testing
- [ ] Load testing
- [ ] Mobile testing

### **Launch Phase**

- [ ] Staging deployment
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Analytics configuration
- [ ] Team training
- [ ] Documentation update

### **Post-Launch**

- [ ] Performance monitoring
- [ ] User feedback collection
- [ ] Metric tracking
- [ ] Issue resolution
- [ ] Optimization iterations
- [ ] Success evaluation

---

## 🎯 Conclusiones

La implementación de mejoras en User Experience es **crítica** para el éxito del e-commerce Pinteya. Con un enfoque sistemático y métricas claras, esperamos:

- **Duplicar la tasa de conversión** (2.3% → 4.5%+)
- **Reducir significativamente el abandono del carrito** (68% → <45%)
- **Mejorar la experiencia móvil** (75% → 95%+ usabilidad)
- **Aumentar la satisfacción del usuario** (3.8/5 → 4.7/5+)

El **ROI estimado** es de **300-400%** en los primeros 6 meses post-implementación, basado en el aumento de conversiones y reducción de costos de soporte.

**Próximos pasos**:

1. Aprobación del plan por stakeholders
2. Asignación de recursos y timeline
3. Inicio de Fase 1: Fundamentos UX
4. Setup de métricas y monitoreo
5. Comunicación del plan al equipo

"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Search, X, Clock, TrendingUp, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { searchProducts } from "@/lib/api/products";
import { ProductWithCategory } from "@/types/api";
import { Badge } from "./badge";
import { Button } from "./button";
import Image from "next/image";

const searchAutocompleteVariants = cva(
  "relative w-full",
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface SearchSuggestion {
  id: string;
  type: 'product' | 'category' | 'recent' | 'trending';
  title: string;
  subtitle?: string;
  image?: string;
  badge?: string;
  href: string;
}

export interface SearchAutocompleteProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof searchAutocompleteVariants> {
  onSearch?: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  showRecentSearches?: boolean;
  showTrendingSearches?: boolean;
  maxSuggestions?: number;
  debounceMs?: number;
}

// Búsquedas trending por defecto para pinturería
const defaultTrendingSearches: SearchSuggestion[] = [
  {
    id: "trending-1",
    type: "trending",
    title: "Pintura látex",
    href: "/shop?search=pintura+latex",
  },
  {
    id: "trending-2", 
    type: "trending",
    title: "Sherwin Williams",
    href: "/shop?search=sherwin+williams",
  },
  {
    id: "trending-3",
    type: "trending", 
    title: "Rodillos premium",
    href: "/shop?search=rodillos+premium",
  },
  {
    id: "trending-4",
    type: "trending",
    title: "Pinceles",
    href: "/shop?search=pinceles",
  },
];

const SearchAutocomplete = React.forwardRef<HTMLInputElement, SearchAutocompleteProps>(
  ({
    className,
    size,
    onSearch,
    onSuggestionSelect,
    showRecentSearches = true,
    showTrendingSearches = true,
    maxSuggestions = 8,
    debounceMs = 300,
    placeholder = "Busco productos de pinturería...",
    ...props
  }, ref) => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();

    // Cargar búsquedas recientes del localStorage
    useEffect(() => {
      if (showRecentSearches) {
        const stored = localStorage.getItem('pinteya-recent-searches');
        if (stored) {
          try {
            setRecentSearches(JSON.parse(stored));
          } catch (error) {
            console.error('Error loading recent searches:', error);
          }
        }
      }
    }, [showRecentSearches]);

    // Guardar búsqueda reciente
    const saveRecentSearch = useCallback((searchQuery: string) => {
      if (!searchQuery.trim() || !showRecentSearches) return;
      
      const updated = [
        searchQuery,
        ...recentSearches.filter(s => s !== searchQuery)
      ].slice(0, 5); // Mantener solo las últimas 5
      
      setRecentSearches(updated);
      localStorage.setItem('pinteya-recent-searches', JSON.stringify(updated));
    }, [recentSearches, showRecentSearches]);

    // Buscar productos con debounce
    const searchProductsDebounced = useCallback(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      
      try {
        const response = await searchProducts(searchQuery, 6);
        
        if (response.success && response.data) {
          const productSuggestions: SearchSuggestion[] = response.data.map(product => ({
            id: `product-${product.id}`,
            type: 'product',
            title: product.name,
            subtitle: product.category?.name,
            image: product.images?.previews?.[0] || product.images?.thumbnails?.[0] || '/images/products/placeholder.jpg',
            badge: product.stock > 0 ? 'En stock' : 'Sin stock',
            href: `/product/${product.id}`,
          }));

          setSuggestions(productSuggestions.slice(0, maxSuggestions));
        }
      } catch (error) {
        console.error('Error searching products:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, [maxSuggestions]);

    // Manejar cambio en el input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      setSelectedIndex(-1);

      // Limpiar debounce anterior
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Configurar nuevo debounce
      debounceRef.current = setTimeout(() => {
        searchProductsDebounced(value);
      }, debounceMs);
    };

    // Mostrar sugerencias por defecto cuando se enfoca
    const handleFocus = () => {
      setIsOpen(true);
      
      if (!query.trim()) {
        const defaultSuggestions: SearchSuggestion[] = [];
        
        // Agregar búsquedas recientes
        if (showRecentSearches && recentSearches.length > 0) {
          defaultSuggestions.push(
            ...recentSearches.slice(0, 3).map((search, index) => ({
              id: `recent-${index}`,
              type: 'recent' as const,
              title: search,
              href: `/shop?search=${encodeURIComponent(search)}`,
            }))
          );
        }
        
        // Agregar búsquedas trending
        if (showTrendingSearches) {
          defaultSuggestions.push(...defaultTrendingSearches.slice(0, 4));
        }
        
        setSuggestions(defaultSuggestions.slice(0, maxSuggestions));
      }
    };

    // Manejar selección de sugerencia
    const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
      if (suggestion.type === 'product' || suggestion.type === 'category') {
        saveRecentSearch(suggestion.title);
      }
      
      setQuery(suggestion.title);
      setIsOpen(false);
      
      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion);
      } else {
        router.push(suggestion.href);
      }
    };

    // Manejar envío del formulario
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (query.trim()) {
        saveRecentSearch(query.trim());
        setIsOpen(false);
        
        if (onSearch) {
          onSearch(query.trim());
        } else {
          router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
        }
      }
    };

    // Manejar teclas
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSuggestionSelect(suggestions[selectedIndex]);
          } else {
            handleSubmit(e);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    };

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Limpiar debounce al desmontar
    useEffect(() => {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, []);

    const getSuggestionIcon = (type: SearchSuggestion['type']) => {
      switch (type) {
        case 'recent':
          return <Clock className="w-4 h-4 text-gray-400" />;
        case 'trending':
          return <TrendingUp className="w-4 h-4 text-primary" />;
        case 'product':
          return <Package className="w-4 h-4 text-gray-600" />;
        default:
          return <Search className="w-4 h-4 text-gray-400" />;
      }
    };

    return (
      <div className={cn(searchAutocompleteVariants({ size }), className)}>
        <div className="relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoComplete="off"
              className={cn(
                "w-full rounded-r-[5px] bg-gray-1 border border-gray-3 py-2.5 pl-4 pr-10 outline-none transition-all duration-200",
                "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                "placeholder:text-gray-500",
                size === "sm" && "py-2 text-sm",
                size === "lg" && "py-3 text-lg"
              )}
              {...props}
            />
            
            {/* Search Icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSuggestions([]);
                    inputRef.current?.focus();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="text-gray-500 hover:text-primary transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dropdown de sugerencias */}
          {isOpen && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto"
            >
              {isLoading && (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  Buscando...
                </div>
              )}

              {!isLoading && suggestions.length === 0 && query.trim() && (
                <div className="p-4 text-center text-gray-500">
                  No se encontraron resultados para "{query}"
                </div>
              )}

              {!isLoading && suggestions.length > 0 && (
                <div className="py-2">
                  {/* Secciones de sugerencias */}
                  {showRecentSearches && suggestions.some(s => s.type === 'recent') && (
                    <div className="px-3 py-2">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Búsquedas recientes
                      </h4>
                      {suggestions
                        .filter(s => s.type === 'recent')
                        .map((suggestion, index) => (
                          <button
                            key={suggestion.id}
                            onClick={() => handleSuggestionSelect(suggestion)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors",
                              selectedIndex === suggestions.indexOf(suggestion) && "bg-primary/10"
                            )}
                          >
                            {getSuggestionIcon(suggestion.type)}
                            <span className="text-sm text-gray-700">{suggestion.title}</span>
                          </button>
                        ))}
                    </div>
                  )}

                  {/* Productos */}
                  {suggestions.some(s => s.type === 'product') && (
                    <div className="px-3 py-2 border-t border-gray-100">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Productos
                      </h4>
                      {suggestions
                        .filter(s => s.type === 'product')
                        .map((suggestion, index) => (
                          <button
                            key={suggestion.id}
                            onClick={() => handleSuggestionSelect(suggestion)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors",
                              selectedIndex === suggestions.indexOf(suggestion) && "bg-primary/10"
                            )}
                          >
                            {suggestion.image ? (
                              <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                <Image
                                  src={suggestion.image}
                                  alt={suggestion.title}
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              getSuggestionIcon(suggestion.type)
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {suggestion.title}
                              </div>
                              {suggestion.subtitle && (
                                <div className="text-xs text-gray-500 truncate">
                                  {suggestion.subtitle}
                                </div>
                              )}
                            </div>
                            {suggestion.badge && (
                              <Badge variant="secondary" size="sm">
                                {suggestion.badge}
                              </Badge>
                            )}
                          </button>
                        ))}
                    </div>
                  )}

                  {/* Trending */}
                  {showTrendingSearches && suggestions.some(s => s.type === 'trending') && !query.trim() && (
                    <div className="px-3 py-2 border-t border-gray-100">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Búsquedas populares
                      </h4>
                      {suggestions
                        .filter(s => s.type === 'trending')
                        .map((suggestion, index) => (
                          <button
                            key={suggestion.id}
                            onClick={() => handleSuggestionSelect(suggestion)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors",
                              selectedIndex === suggestions.indexOf(suggestion) && "bg-primary/10"
                            )}
                          >
                            {getSuggestionIcon(suggestion.type)}
                            <span className="text-sm text-gray-700">{suggestion.title}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

SearchAutocomplete.displayName = "SearchAutocomplete";

export { SearchAutocomplete, searchAutocompleteVariants };

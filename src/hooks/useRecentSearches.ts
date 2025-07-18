// ===================================
// HOOK: useRecentSearches - Gestión de búsquedas recientes con localStorage
// ===================================

import { useState, useEffect, useCallback } from 'react';

export interface RecentSearchesOptions {
  /** Número máximo de búsquedas recientes a mantener */
  maxSearches?: number;
  /** Clave de localStorage para persistir las búsquedas */
  storageKey?: string;
  /** Habilitar/deshabilitar persistencia en localStorage */
  enablePersistence?: boolean;
  /** Filtrar búsquedas duplicadas */
  filterDuplicates?: boolean;
  /** Tiempo de expiración en días (0 = sin expiración) */
  expirationDays?: number;
}

export interface RecentSearchesReturn {
  /** Array de búsquedas recientes */
  recentSearches: string[];
  /** Agregar una nueva búsqueda */
  addSearch: (search: string) => void;
  /** Remover una búsqueda específica */
  removeSearch: (search: string) => void;
  /** Limpiar todas las búsquedas */
  clearSearches: () => void;
  /** Verificar si una búsqueda existe */
  hasSearch: (search: string) => boolean;
  /** Obtener las N búsquedas más recientes */
  getRecentSearches: (limit?: number) => string[];
  /** Reordenar búsquedas (mover al principio) */
  moveToTop: (search: string) => void;
}

interface PersistedSearchData {
  searches: string[];
  timestamp: number;
  version: string;
}

const DEFAULT_OPTIONS: Required<RecentSearchesOptions> = {
  maxSearches: 5,
  storageKey: 'pinteya-recent-searches',
  enablePersistence: true,
  filterDuplicates: true,
  expirationDays: 30, // 30 días de expiración
};

/**
 * Hook para gestionar búsquedas recientes con persistencia en localStorage
 * 
 * Características:
 * - Persistencia automática en localStorage
 * - Límite configurable de búsquedas
 * - Filtrado de duplicados
 * - Expiración automática
 * - Manejo de errores robusto
 */
export function useRecentSearches(options: RecentSearchesOptions = {}): RecentSearchesReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Función para validar y limpiar una búsqueda
  const sanitizeSearch = useCallback((search: string): string => {
    return search.trim().toLowerCase();
  }, []);

  // Función para verificar si los datos han expirado
  const isExpired = useCallback((timestamp: number): boolean => {
    if (config.expirationDays === 0) return false;
    const maxAge = config.expirationDays * 24 * 60 * 60 * 1000;
    return Date.now() - timestamp > maxAge;
  }, [config.expirationDays]);

  // Cargar búsquedas desde localStorage
  const loadFromStorage = useCallback((): string[] => {
    if (!config.enablePersistence || typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(config.storageKey);
      if (!stored) return [];

      // Intentar cargar formato nuevo (con metadata)
      try {
        const parsed: PersistedSearchData = JSON.parse(stored);
        
        // Verificar estructura y expiración
        if (parsed.searches && Array.isArray(parsed.searches)) {
          if (parsed.timestamp && isExpired(parsed.timestamp)) {
            localStorage.removeItem(config.storageKey);
            return [];
          }
          return parsed.searches.slice(0, config.maxSearches);
        }
      } catch {
        // Fallback: intentar cargar formato antiguo (array simple)
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, config.maxSearches);
        }
      }

      return [];
    } catch (error) {
      console.warn('Error loading recent searches from localStorage:', error);
      // Limpiar localStorage corrupto
      try {
        localStorage.removeItem(config.storageKey);
      } catch (cleanupError) {
        console.warn('Error cleaning up corrupted localStorage:', cleanupError);
      }
      return [];
    }
  }, [config.enablePersistence, config.storageKey, config.maxSearches, isExpired]);

  // Guardar búsquedas en localStorage
  const saveToStorage = useCallback((searches: string[]): void => {
    if (!config.enablePersistence || typeof window === 'undefined') {
      return;
    }

    try {
      if (searches.length === 0) {
        localStorage.removeItem(config.storageKey);
        return;
      }

      const dataToStore: PersistedSearchData = {
        searches: searches.slice(0, config.maxSearches),
        timestamp: Date.now(),
        version: '1.0.0'
      };

      localStorage.setItem(config.storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.warn('Error saving recent searches to localStorage:', error);
    }
  }, [config.enablePersistence, config.storageKey, config.maxSearches]);

  // Cargar búsquedas al inicializar
  useEffect(() => {
    const loaded = loadFromStorage();
    setRecentSearches(loaded);
  }, [loadFromStorage]);

  // Agregar una nueva búsqueda
  const addSearch = useCallback((search: string): void => {
    const sanitized = sanitizeSearch(search);
    if (!sanitized || sanitized.length < 2) return;

    setRecentSearches(prev => {
      let updated = [...prev];

      // Remover duplicados si está habilitado
      if (config.filterDuplicates) {
        updated = updated.filter(s => sanitizeSearch(s) !== sanitized);
      }

      // Agregar al principio
      updated.unshift(search.trim());

      // Limitar al máximo configurado
      updated = updated.slice(0, config.maxSearches);

      // Guardar en localStorage
      saveToStorage(updated);

      return updated;
    });
  }, [sanitizeSearch, config.filterDuplicates, config.maxSearches, saveToStorage]);

  // Remover una búsqueda específica
  const removeSearch = useCallback((search: string): void => {
    const sanitized = sanitizeSearch(search);
    
    setRecentSearches(prev => {
      const updated = prev.filter(s => sanitizeSearch(s) !== sanitized);
      saveToStorage(updated);
      return updated;
    });
  }, [sanitizeSearch, saveToStorage]);

  // Limpiar todas las búsquedas
  const clearSearches = useCallback((): void => {
    setRecentSearches([]);
    saveToStorage([]);
  }, [saveToStorage]);

  // Verificar si una búsqueda existe
  const hasSearch = useCallback((search: string): boolean => {
    const sanitized = sanitizeSearch(search);
    return recentSearches.some(s => sanitizeSearch(s) === sanitized);
  }, [recentSearches, sanitizeSearch]);

  // Obtener las N búsquedas más recientes
  const getRecentSearches = useCallback((limit?: number): string[] => {
    const actualLimit = limit ?? config.maxSearches;
    return recentSearches.slice(0, actualLimit);
  }, [recentSearches, config.maxSearches]);

  // Mover una búsqueda al principio (reordenar)
  const moveToTop = useCallback((search: string): void => {
    const sanitized = sanitizeSearch(search);
    
    setRecentSearches(prev => {
      const filtered = prev.filter(s => sanitizeSearch(s) !== sanitized);
      const existing = prev.find(s => sanitizeSearch(s) === sanitized);
      
      if (!existing) return prev;
      
      const updated = [existing, ...filtered];
      saveToStorage(updated);
      return updated;
    });
  }, [sanitizeSearch, saveToStorage]);

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearSearches,
    hasSearch,
    getRecentSearches,
    moveToTop,
  };
}

/**
 * Hook simplificado para solo obtener búsquedas recientes
 */
export function useRecentSearchesSimple(limit: number = 5): string[] {
  const { getRecentSearches } = useRecentSearches({ maxSearches: limit });
  return getRecentSearches();
}

export default useRecentSearches;

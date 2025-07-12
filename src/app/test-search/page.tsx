"use client";

import React, { useEffect } from 'react';
import { SearchAutocompleteIntegrated } from '@/components/ui/SearchAutocompleteIntegrated';
import { testSearchAPI } from '@/utils/test-search-api';
import SimpleSearch from '@/components/debug/SimpleSearch';

export default function TestSearchPage() {
  const handleSearch = (query: string) => {
    console.log('🔍 Búsqueda realizada:', query);
  };

  const handleSuggestionSelect = (suggestion: any) => {
    console.log('✅ Sugerencia seleccionada:', suggestion);
  };

  const runAPITest = async () => {
    console.log('🧪 Ejecutando prueba de API...');
    await testSearchAPI();
  };

  useEffect(() => {
    // Hacer disponible la función de prueba globalmente
    (window as any).testSearchAPI = testSearchAPI;
    console.log('🔧 Función testSearchAPI disponible globalmente. Ejecuta testSearchAPI() en la consola.');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Test de Búsqueda Instantánea
        </h1>
        
        {/* Componente de búsqueda simple para debug */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <SimpleSearch />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Prueba el SearchAutocomplete
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Búsqueda con debounce de 150ms:
              </label>
              <SearchAutocompleteIntegrated
                placeholder="Busca productos de pinturería..."
                onSearch={handleSearch}
                onSuggestionSelect={handleSuggestionSelect}
                debounceMs={150}
                maxSuggestions={8}
                showRecentSearches={true}
                showTrendingSearches={true}
                className="w-full"
                data-testid="test-search-input"
              />
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-2">Instrucciones:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Escribe "pintura" para ver productos relacionados</li>
                <li>Escribe "lija" para ver productos de lijado</li>
                <li>Escribe "bandeja" para ver accesorios</li>
                <li>Abre la consola del navegador para ver los logs</li>
              </ul>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">Estado esperado:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Debounce de 150ms funcionando</li>
                <li>✅ Productos aparecen con imágenes</li>
                <li>✅ Categorías mostradas como subtítulo</li>
                <li>✅ Badge de stock visible</li>
                <li>✅ Navegación por teclado funcional</li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-md">
              <h4 className="font-medium text-green-900 mb-2">Prueba de API:</h4>
              <button
                onClick={runAPITest}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Ejecutar Prueba de API
              </button>
              <p className="text-sm text-green-800 mt-2">
                También puedes ejecutar <code>testSearchAPI()</code> en la consola del navegador.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

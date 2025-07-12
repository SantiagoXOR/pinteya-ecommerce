"use client";

import React, { useState, useEffect } from 'react';
import { searchProducts } from '@/lib/api/products';

export default function SimpleSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchDebounced = setTimeout(async () => {
      if (query.trim()) {
        console.log('🔍 Buscando:', query);
        setIsLoading(true);
        setError(null);
        
        try {
          const response = await searchProducts(query, 5);
          console.log('📦 Respuesta:', response);
          
          if (response.success && response.data) {
            setResults(response.data);
          } else {
            setResults([]);
            setError('No se encontraron resultados');
          }
        } catch (err) {
          console.error('❌ Error:', err);
          setError('Error en la búsqueda');
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 150);

    return () => clearTimeout(searchDebounced);
  }, [query]);

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Búsqueda Simple (Debug)</h2>
      
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-2 border border-gray-200 rounded-md bg-white shadow-lg">
          <div className="p-2 bg-gray-50 border-b">
            <span className="text-sm font-medium text-gray-700">
              {results.length} productos encontrados
            </span>
          </div>
          
          {results.map((product) => (
            <div key={product.id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                {product.images?.main && (
                  <img
                    src={product.images.main}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.category?.name}</div>
                  <div className="text-sm text-green-600">
                    Stock: {product.stock} | ${product.price}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-100 rounded-md">
        <h3 className="font-medium mb-2">Estado Debug:</h3>
        <ul className="text-sm space-y-1">
          <li>Query: "{query}"</li>
          <li>Loading: {isLoading ? 'Sí' : 'No'}</li>
          <li>Resultados: {results.length}</li>
          <li>Error: {error || 'Ninguno'}</li>
        </ul>
      </div>
    </div>
  );
}

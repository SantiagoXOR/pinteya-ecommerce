"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSearchOptimized } from '@/hooks/useSearchOptimized';
import { searchProducts } from '@/lib/api/products';

interface TestResult {
  test: string;
  success: boolean;
  data?: any;
  error?: string;
  timing: number;
}

export function SearchTester() {
  const [searchTerm, setSearchTerm] = useState('pintura');
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Hook de búsqueda optimizado para testing
  const {
    query,
    results: hookResults,
    suggestions,
    isLoading: hookLoading,
    error: hookError,
    searchWithDebounce,
    executeSearch,
    clearSearch,
  } = useSearchOptimized({
    debounceMs: 100,
    maxSuggestions: 5,
  });

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Running test: ${testName}`);
      const result = await testFn();
      const timing = Date.now() - startTime;
      
      return {
        test: testName,
        success: true,
        data: result,
        timing,
      };
    } catch (error: any) {
      const timing = Date.now() - startTime;
      console.error(`❌ Test failed: ${testName}`, error);
      
      return {
        test: testName,
        success: false,
        error: error.message,
        timing,
      };
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setResults([]);

    const tests = [
      {
        name: 'API directa - searchProducts()',
        fn: () => searchProducts(searchTerm, 5)
      },
      {
        name: 'Fetch directo - /api/products',
        fn: async () => {
          const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}&limit=5`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        }
      },
      {
        name: 'API Trending Searches',
        fn: async () => {
          const response = await fetch('/api/search/trending?limit=4');
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        }
      },
      {
        name: 'Hook useSearchOptimized',
        fn: async () => {
          // Simular uso del hook
          searchWithDebounce(searchTerm);
          
          // Esperar un poco para que el hook procese
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          return {
            query,
            results: hookResults,
            suggestions,
            isLoading: hookLoading,
            error: hookError,
          };
        }
      },
    ];

    const testResults: TestResult[] = [];

    for (const test of tests) {
      const result = await runTest(test.name, test.fn);
      testResults.push(result);
      setResults([...testResults]);
      
      // Pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsLoading(false);
  };

  const testHookDirectly = () => {
    console.log('🔍 Testing hook directly with:', searchTerm);
    searchWithDebounce(searchTerm);
  };

  const testExecuteSearch = async () => {
    console.log('🚀 Testing executeSearch with:', searchTerm);
    try {
      await executeSearch(searchTerm);
    } catch (error) {
      console.error('❌ executeSearch failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Tester de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Término de búsqueda:</label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ingresa un término..."
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={runAllTests} 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? '🔄 Ejecutando...' : '🧪 Ejecutar Todos los Tests'}
              </Button>
              
              <Button 
                onClick={testHookDirectly}
                variant="outline"
              >
                🎯 Test Hook Directo
              </Button>
              
              <Button 
                onClick={testExecuteSearch}
                variant="outline"
              >
                🚀 Test Execute Search
              </Button>
              
              <Button 
                onClick={clearSearch}
                variant="outline"
              >
                🧹 Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado actual del hook */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Estado del Hook useSearchOptimized</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Query:</strong> "{query}"</div>
            <div><strong>Loading:</strong> {hookLoading ? '✅ Sí' : '❌ No'}</div>
            <div><strong>Results:</strong> {hookResults?.length || 0} productos</div>
            <div><strong>Suggestions:</strong> {suggestions?.length || 0} sugerencias</div>
            <div><strong>Error:</strong> {hookError || 'Ninguno'}</div>
          </div>
          
          {hookResults && hookResults.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-blue-600">Ver resultados del hook</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(hookResults, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Resultados de tests */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Resultados de Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{result.test}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className={result.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                        {result.success ? '✅ OK' : '❌ Error'}
                      </Badge>
                      <span className="text-sm text-gray-500">{result.timing}ms</span>
                    </div>
                  </div>
                  
                  {result.error && (
                    <div className="text-red-600 text-sm mb-2">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                  
                  {result.data && (
                    <details>
                      <summary className="cursor-pointer text-blue-600 text-sm">Ver datos</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

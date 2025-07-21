"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchTester } from '@/components/debug/SearchTester';

interface DebugResult {
  endpoint: string;
  status: number;
  success: boolean;
  data?: any;
  error?: string;
  timing: number;
}

export default function DebugSearchPage() {
  const [searchTerm, setSearchTerm] = useState('pintura');
  const [results, setResults] = useState<DebugResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [envInfo, setEnvInfo] = useState<any>({});

  useEffect(() => {
    // Obtener información del entorno
    setEnvInfo({
      nodeEnv: process.env.NODE_ENV,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      location: typeof window !== 'undefined' ? window.location.href : 'SSR'
    });
  }, []);

  const testEndpoint = async (endpoint: string, options: RequestInit = {}): Promise<DebugResult> => {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Testing endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const timing = Date.now() - startTime;
      const data = await response.json();

      console.log(`✅ Response from ${endpoint}:`, { status: response.status, data });

      return {
        endpoint,
        status: response.status,
        success: response.ok,
        data,
        timing,
      };
    } catch (error: any) {
      const timing = Date.now() - startTime;
      console.error(`❌ Error testing ${endpoint}:`, error);

      return {
        endpoint,
        status: 0,
        success: false,
        error: error.message,
        timing,
      };
    }
  };

  const runDiagnostics = async () => {
    setIsLoading(true);
    setResults([]);

    const tests: Array<{ name: string; url: string; options?: RequestInit }> = [
      {
        name: 'Products API (Basic)',
        url: '/api/products?limit=5',
      },
      {
        name: 'Products API (Search)',
        url: `/api/products?search=${encodeURIComponent(searchTerm)}&limit=5`,
      },
      {
        name: 'Trending Searches API',
        url: '/api/search/trending?limit=4',
      },
      {
        name: 'Supabase Health Check',
        url: '/api/products?limit=1',
      },
    ];

    const testResults: DebugResult[] = [];

    for (const test of tests) {
      console.log(`🧪 Running test: ${test.name}`);
      const result = await testEndpoint(test.url, test.options);
      result.endpoint = test.name;
      testResults.push(result);
      setResults([...testResults]);
      
      // Pequeña pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsLoading(false);
  };

  const getStatusColor = (result: DebugResult) => {
    if (result.success) return 'bg-green-500';
    if (result.status === 0) return 'bg-red-500';
    if (result.status >= 400) return 'bg-orange-500';
    return 'bg-gray-500';
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🔍 Debug de Búsqueda - Pinteya E-commerce</h1>
        <p className="text-gray-600">
          Herramienta de diagnóstico para identificar problemas en la funcionalidad de búsqueda
        </p>
      </div>

      {/* Información del entorno */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>📊 Información del Entorno</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>NODE_ENV:</strong> {envInfo.nodeEnv}</div>
            <div><strong>App URL:</strong> {envInfo.appUrl}</div>
            <div><strong>Supabase URL:</strong> {envInfo.supabaseUrl}</div>
            <div><strong>Supabase Key:</strong> {envInfo.hasSupabaseKey ? '✅ Configurada' : '❌ Faltante'}</div>
            <div className="col-span-2"><strong>Location:</strong> {envInfo.location}</div>
          </div>
        </CardContent>
      </Card>

      {/* Controles de testing */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🧪 Ejecutar Diagnósticos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Término de búsqueda:</label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ingresa un término de búsqueda..."
              />
            </div>
            <Button 
              onClick={runDiagnostics} 
              disabled={isLoading}
              className="bg-blaze-orange-600 hover:bg-blaze-orange-700"
            >
              {isLoading ? '🔄 Ejecutando...' : '🚀 Ejecutar Tests'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Resultados de Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{result.endpoint}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(result)} text-white`}>
                        {result.success ? '✅ OK' : '❌ Error'}
                      </Badge>
                      <span className="text-sm text-gray-500">{result.timing}ms</span>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <div><strong>Status:</strong> {result.status}</div>
                    {result.error && (
                      <div className="text-red-600"><strong>Error:</strong> {result.error}</div>
                    )}
                    {result.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600">Ver respuesta completa</summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tester de búsqueda integrado */}
      <div className="mt-6">
        <SearchTester />
      </div>

      {/* Instrucciones */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📝 Instrucciones de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>1.</strong> Ingresa un término de búsqueda (ej: "pintura", "sherwin", "latex")</p>
            <p><strong>2.</strong> Haz clic en "Ejecutar Tests" para probar todas las APIs</p>
            <p><strong>3.</strong> Revisa los resultados para identificar qué está fallando</p>
            <p><strong>4.</strong> Los badges verdes indican éxito, rojos indican error</p>
            <p><strong>5.</strong> Haz clic en "Ver respuesta completa" para ver los datos devueltos</p>
            <p><strong>6.</strong> Usa el "Tester de Búsqueda" para probar los hooks directamente</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

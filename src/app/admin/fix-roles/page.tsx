'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export default function FixRolesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const fixSantiagoRole = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Llamar a la API de Clerk directamente desde el cliente
      const response = await fetch('/api/admin/fix-santiago-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fix_role',
          email: 'santiago@xor.com.ar'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Rol corregido exitosamente',
          details: data
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Error al corregir el rol',
          details: data
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Corrección de Roles</h1>
        <p className="text-gray-600 mt-2">
          Herramienta para sincronizar roles entre Supabase y Clerk
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Problema Detectado
          </CardTitle>
          <CardDescription>
            El usuario santiago@xor.com.ar tiene rol admin en Supabase pero no en Clerk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Síntomas:</h3>
              <ul className="text-red-700 space-y-1">
                <li>• ✅ Puede acceder a páginas admin (/admin/products)</li>
                <li>• ❌ No puede acceder a APIs enterprise (403 Forbidden)</li>
                <li>• ❌ Middleware reporta "rol: undefined"</li>
                <li>• ❌ Dashboard enterprise no funciona completamente</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Causa:</h3>
              <p className="text-blue-700">
                Hay dos sistemas de roles diferentes: Supabase (✅ admin) y Clerk (❌ undefined).
                El middleware de APIs enterprise verifica Clerk, mientras que las páginas admin 
                verifican Supabase.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Solución:</h3>
              <p className="text-green-700">
                Sincronizar el rol admin desde Supabase hacia Clerk metadata para que ambos 
                sistemas estén alineados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Corrección Automática</CardTitle>
          <CardDescription>
            Hacer clic en el botón para sincronizar el rol admin de santiago@xor.com.ar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={fixSantiagoRole}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Corrigiendo rol...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Corregir Rol de Santiago Admin
                </>
              )}
            </Button>

            {result && (
              <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                      <div className="font-semibold mb-1">
                        {result.success ? '✅ Éxito' : '❌ Error'}
                      </div>
                      <div>{result.message}</div>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm opacity-75">
                            Ver detalles
                          </summary>
                          <pre className="mt-2 text-xs bg-white/50 p-2 rounded border overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}

            {result?.success && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Próximos pasos:</h3>
                <ol className="text-yellow-700 space-y-1 list-decimal list-inside">
                  <li>Cerrar sesión en Clerk</li>
                  <li>Volver a iniciar sesión</li>
                  <li>Probar acceso a APIs enterprise</li>
                  <li>Verificar dashboard enterprise completo</li>
                </ol>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información Técnica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Usuario:</strong> santiago@xor.com.ar
            </div>
            <div>
              <strong>Rol esperado:</strong> admin
            </div>
            <div>
              <strong>Permisos requeridos:</strong> admin_access, monitoring_access, system_admin
            </div>
            <div>
              <strong>APIs afectadas:</strong> /api/admin/monitoring/*, /api/admin/system/*
            </div>
            <div>
              <strong>Middleware:</strong> src/middleware.ts línea 95-96
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

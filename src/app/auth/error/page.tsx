"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return {
          title: "Error de Configuración",
          description: "Hay un problema con la configuración de autenticación. Por favor, contacta al administrador.",
          suggestion: "Intenta nuevamente en unos minutos o contacta soporte."
        };
      case "AccessDenied":
        return {
          title: "Acceso Denegado",
          description: "No tienes permisos para acceder a este recurso.",
          suggestion: "Verifica que tengas los permisos necesarios."
        };
      case "Verification":
        return {
          title: "Error de Verificación",
          description: "No se pudo verificar tu identidad.",
          suggestion: "Intenta iniciar sesión nuevamente."
        };
      default:
        return {
          title: "Error de Autenticación",
          description: "Ocurrió un error durante el proceso de autenticación.",
          suggestion: "Intenta iniciar sesión nuevamente."
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blaze-orange-50 to-blaze-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-gray-600 mb-4">
            {errorInfo.description}
          </p>
          <p className="text-sm text-gray-500">
            {errorInfo.suggestion}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">
              Código de error: <span className="font-mono">{error}</span>
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/api/auth/signin"
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-blaze-orange-600 text-white rounded-lg hover:bg-blaze-orange-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Intentar Nuevamente
          </Link>
          
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Volver al Inicio
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Si el problema persiste, contacta a{" "}
            <a href="mailto:soporte@pinteya.com" className="text-blaze-orange-600 hover:underline">
              soporte@pinteya.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

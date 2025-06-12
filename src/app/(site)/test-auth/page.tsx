"use client";

// import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import Breadcrumb from "@/components/Common/Breadcrumb";
import Link from "next/link";

const TestAuthPage = () => {
  // Clerk temporalmente desactivado
  // const { user, isLoaded } = useUser();

  return (
    <>
      <Breadcrumb title="Estado de Autenticación" pages={["Estado de Autenticación"]} />

      <section className="py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="max-w-[800px] w-full mx-auto rounded-xl bg-white shadow-1 p-8">

            <div>
              <h2 className="text-2xl font-bold text-dark mb-6">
                ⚠️ Estado de Autenticación - Clerk Temporalmente Desactivado
              </h2>

              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Problema Identificado:</h3>
                  <div className="space-y-1 text-sm text-yellow-700">
                    <p>• Clerk tiene problemas de compatibilidad complejos con el stack actual</p>
                    <p>• Se producen errores de &quot;Invalid hook call&quot; y conflictos de versiones</p>
                    <p>• Múltiples intentos de solución no han sido exitosos</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Configuración Actual:</h3>
                  <div className="space-y-1 text-sm text-blue-700">
                    <p>✅ Variables de entorno de Clerk configuradas</p>
                    <p>✅ Credenciales válidas disponibles</p>
                    <p>⚠️ ClerkProvider desactivado temporalmente</p>
                    <p>⚠️ Middleware de Clerk desactivado</p>
                    <p>⚠️ Componentes de autenticación comentados</p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Decisión Tomada:</h3>
                  <div className="space-y-1 text-sm text-green-700">
                    <p>✅ <strong>Continuar desarrollo sin autenticación</strong></p>
                    <p>✅ Implementar todas las funcionalidades core del e-commerce</p>
                    <p>✅ Configurar MercadoPago para pagos</p>
                    <p>✅ Preparar para producción sin bloqueos</p>
                    <p>✅ Reactivar Clerk en el futuro cuando sea estable</p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Próximos Pasos:</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>• Configurar MercadoPago con credenciales reales</p>
                    <p>• Implementar checkout sin autenticación</p>
                    <p>• Optimizar experiencia de usuario</p>
                    <p>• Preparar para lanzamiento</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Link
                    href="/shop"
                    className="bg-blue hover:bg-blue-dark text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Continuar con la Tienda
                  </Link>
                  <Link
                    href="/"
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Volver al Inicio
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default TestAuthPage;

/**
 * Página de Inicio de Sesión - NextAuth.js
 * Diseño moderno y responsive para Pinteya E-commerce
 */

import { Suspense } from "react"
import { SignInForm } from "@/components/Auth/SignInForm"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Panel izquierdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blaze-orange-600 via-blaze-orange-700 to-blaze-orange-800 relative overflow-hidden">
        {/* Patrón de fondo */}
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="max-w-md">
            <img
              className="h-16 w-auto mb-8"
              src="/images/logo/LOGO NEGATIVO.svg"
              alt="Pinteya"
            />
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Tu Pinturería Online de Confianza
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Accede a tu cuenta para gestionar productos, órdenes y brindar la mejor experiencia a tus clientes.
            </p>

            {/* Características destacadas */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-white/90">Gestión completa de inventario</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-white/90">Seguimiento de órdenes en tiempo real</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-white/90">Analytics y reportes detallados</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="flex-1 flex flex-col justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        {/* Header móvil */}
        <div className="lg:hidden text-center mb-8">
          <img
            className="h-12 w-auto mx-auto mb-4"
            src="/images/logo/LOGO POSITIVO.svg"
            alt="Pinteya"
          />
          <h2 className="text-2xl font-bold text-gray-900">
            Iniciar Sesión
          </h2>
        </div>

        {/* Formulario */}
        <div className="w-full max-w-md mx-auto">
          <Suspense fallback={
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blaze-orange-600" />
            </div>
          }>
            <SignInForm />
          </Suspense>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-blaze-orange-600 transition-colors"
          >
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  )
}










/**
 * Página de Inicio de Sesión - NextAuth.js
 * Diseño personalizado para Pinteya E-commerce
 */

import { Suspense } from "react"
import { SignInForm } from "@/components/auth/SignInForm"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto flex justify-center">
            <img
              className="h-12 w-auto"
              src="/images/logo/LOGO NEGATIVO.svg"
              alt="Pinteya"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Accede a tu cuenta de administrador
          </p>
        </div>
        
        <Suspense fallback={
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        }>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  )
}

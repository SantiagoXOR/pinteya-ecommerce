/**
 * Formulario de Inicio de Sesión - NextAuth.js
 * Componente personalizado para Pinteya E-commerce
 */

"use client"

import { signIn, getProviders } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { FaGoogle } from "react-icons/fa"

interface Provider {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

export function SignInForm() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/admin"
  const error = searchParams.get("error")

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  const handleSignIn = async (providerId: string) => {
    setIsLoading(true)
    try {
      await signIn(providerId, { callbackUrl })
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!providers) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blaze-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 border border-blaze-orange-200">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            {error === "OAuthSignin" && "Error al conectar con el proveedor de autenticación."}
            {error === "OAuthCallback" && "Error en el callback de autenticación."}
            {error === "OAuthCreateAccount" && "Error al crear la cuenta."}
            {error === "EmailCreateAccount" && "Error al crear la cuenta con email."}
            {error === "Callback" && "Error en el callback de autenticación."}
            {error === "OAuthAccountNotLinked" && "Esta cuenta ya está vinculada a otro usuario."}
            {error === "EmailSignin" && "Error al enviar el email de verificación."}
            {error === "CredentialsSignin" && "Credenciales incorrectas."}
            {error === "SessionRequired" && "Debes iniciar sesión para acceder."}
            {!["OAuthSignin", "OAuthCallback", "OAuthCreateAccount", "EmailCreateAccount", "Callback", "OAuthAccountNotLinked", "EmailSignin", "CredentialsSignin", "SessionRequired"].includes(error) && "Error de autenticación."}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {Object.values(providers).map((provider) => (
          <div key={provider.name}>
            <button
              onClick={() => handleSignIn(provider.id)}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blaze-orange-600 hover:bg-blaze-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blaze-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {provider.id === "google" && <FaGoogle className="h-5 w-5 text-white" />}
              </span>
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                `Continuar con ${provider.name}`
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Acceso exclusivo para administradores
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad.
        </p>
      </div>
    </div>
  )
}

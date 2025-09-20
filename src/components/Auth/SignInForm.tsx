/**
 * Formulario de Inicio de Sesión - NextAuth.js v5
 * Componente personalizado para Pinteya E-commerce
 * Diseño moderno y responsive
 */

"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, ArrowRight, CheckCircle } from "lucide-react"

import { signIn } from "next-auth/react"

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const error = searchParams.get("error")

  // Proveedores configurados manualmente para NextAuth v5
  const providers = {
    google: {
      id: "google",
      name: "Google",
      type: "oauth"
    }
  }

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

  const getErrorMessage = (errorCode: string) => {
    const errorMessages: Record<string, string> = {
      OAuthSignin: "Error al conectar con Google. Intenta nuevamente.",
      OAuthCallback: "Error en la autenticación. Verifica tu conexión.",
      OAuthCreateAccount: "No se pudo crear tu cuenta. Contacta soporte.",
      EmailCreateAccount: "Error al crear la cuenta con email.",
      Callback: "Error en el proceso de autenticación.",
      OAuthAccountNotLinked: "Esta cuenta ya está vinculada a otro usuario.",
      EmailSignin: "Error al enviar el email de verificación.",
      CredentialsSignin: "Credenciales incorrectas.",
      SessionRequired: "Debes iniciar sesión para acceder.",
      AccessDenied: "Acceso denegado. Verifica tus permisos.",
      Verification: "Error en la verificación. Intenta nuevamente."
    }
    return errorMessages[errorCode] || "Error de autenticación. Intenta nuevamente."
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center pb-4">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Bienvenido a Pinteya
        </CardTitle>
        <CardDescription className="text-gray-600">
          Inicia sesión para acceder a tu cuenta
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              {getErrorMessage(error)}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {Object.values(providers).map((provider) => (
            <Button
              key={provider.name}
              onClick={() => handleSignIn(provider.id)}
              disabled={isLoading}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-gray-300 shadow-sm transition-all duration-200 group"
              variant="outline"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {provider.id === "google" && (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  <span className="font-medium">Continuar con {provider.name}</span>
                  <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          ))}
        </div>

        {/* Características de seguridad */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Autenticación segura con Google</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Protección de datos garantizada</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Acceso rápido y confiable</span>
          </div>
        </div>

        <div className="text-center pt-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Al iniciar sesión, aceptas nuestros{" "}
            <a href="/terms" className="text-blaze-orange-600 hover:underline">
              términos de servicio
            </a>{" "}
            y{" "}
            <a href="/privacy" className="text-blaze-orange-600 hover:underline">
              política de privacidad
            </a>
            .
          </p>
        </div>
      </CardContent>
    </Card>
  )
}










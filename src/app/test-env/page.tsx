"use client";

import Link from 'next/link';

export default function TestEnvPage() {
  // Variables de entorno públicas (solo estas son accesibles en el cliente)
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const mercadopagoPublicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔍 Diagnóstico de Variables de Entorno</h1>
      
      <div className="space-y-6">
        {/* Clerk Configuration */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">🔐 Clerk Authentication</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                clerkPublishableKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {clerkPublishableKey ? '✅ Configurado' : '❌ No configurado'}
              </span>
            </div>
            {clerkPublishableKey && (
              <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                {clerkPublishableKey.substring(0, 20)}...
              </div>
            )}
          </div>
        </div>

        {/* Supabase Configuration */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4 text-green-600">🗄️ Supabase Database</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                supabaseUrl ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {supabaseUrl ? '✅ Configurado' : '❌ No configurado'}
              </span>
            </div>
            {supabaseUrl && (
              <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                {supabaseUrl}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                supabaseAnonKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {supabaseAnonKey ? '✅ Configurado' : '❌ No configurado'}
              </span>
            </div>
            {supabaseAnonKey && (
              <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                {supabaseAnonKey.substring(0, 20)}...
              </div>
            )}
          </div>
        </div>

        {/* MercadoPago Configuration */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4 text-yellow-600">💳 MercadoPago Payments</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                mercadopagoPublicKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {mercadopagoPublicKey ? '✅ Configurado' : '❌ No configurado'}
              </span>
            </div>
            {mercadopagoPublicKey && (
              <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                {mercadopagoPublicKey.substring(0, 20)}...
              </div>
            )}
          </div>
        </div>

        {/* App Configuration */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4 text-purple-600">🌐 App Configuration</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">NEXT_PUBLIC_APP_URL:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                appUrl ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {appUrl ? '✅ Configurado' : '❌ No configurado'}
              </span>
            </div>
            {appUrl && (
              <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                {appUrl}
              </div>
            )}
          </div>
        </div>

        {/* Environment Info */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4 text-gray-600">ℹ️ Environment Info</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">NODE_ENV:</span>
              <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                {process.env.NODE_ENV || 'development'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Timestamp:</span>
              <span className="text-sm text-gray-600">
                {new Date().toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">📊 Status Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl mb-2 ${clerkPublishableKey ? 'text-green-500' : 'text-red-500'}`}>
                {clerkPublishableKey ? '✅' : '❌'}
              </div>
              <div className="text-sm font-medium">Clerk</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl mb-2 ${supabaseUrl && supabaseAnonKey ? 'text-green-500' : 'text-red-500'}`}>
                {supabaseUrl && supabaseAnonKey ? '✅' : '❌'}
              </div>
              <div className="text-sm font-medium">Supabase</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl mb-2 ${mercadopagoPublicKey ? 'text-green-500' : 'text-red-500'}`}>
                {mercadopagoPublicKey ? '✅' : '❌'}
              </div>
              <div className="text-sm font-medium">MercadoPago</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl mb-2 ${appUrl ? 'text-green-500' : 'text-red-500'}`}>
                {appUrl ? '✅' : '❌'}
              </div>
              <div className="text-sm font-medium">App URL</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">🔧 Actions</h2>
          <div className="space-x-4">
            <Link
              href="/test-clerk"
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Test Clerk
            </Link>
            <Link
              href="/shop"
              className="inline-block bg-tahiti-gold-500 text-white px-4 py-2 rounded hover:bg-tahiti-gold-600 transition-colors"
            >
              Go to Shop
            </Link>
            <Link
              href="/signin"
              className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

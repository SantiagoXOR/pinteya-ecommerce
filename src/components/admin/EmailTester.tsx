'use client'

// ===================================
// PINTEYA E-COMMERCE - COMPONENTE TEST EMAIL
// ===================================

import React, { useState, useEffect } from 'react'
import { useEmail, useEmailConfig } from '../../hooks/useEmail'

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export default function EmailTester() {
  const [email, setEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [selectedType, setSelectedType] = useState<'welcome' | 'order' | 'reset'>('welcome')
  const [result, setResult] = useState<any>(null)

  const { loading, error, sendTestEmail } = useEmail()
  const { config, loadConfig } = useEmailConfig()

  useEffect(() => {
    loadConfig()
  }, [])

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !userName) {
      alert('Por favor completa todos los campos')
      return
    }

    try {
      const response = await sendTestEmail({
        type: selectedType,
        email,
        userName,
      })

      setResult(response)
    } catch (err) {
      console.error('Error enviando email:', err)
    }
  }

  return (
    <div className='max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg'>
      <h2 className='text-2xl font-bold text-gray-900 mb-6'>🧪 Test de Emails Personalizados</h2>

      {/* Configuración del Servicio */}
      <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
        <h3 className='text-lg font-semibold mb-3'>📧 Configuración del Servicio</h3>
        {config ? (
          <div className='space-y-2 text-sm'>
            <div className='flex items-center'>
              <span
                className={`w-3 h-3 rounded-full mr-2 ${config.isReady ? 'bg-green-500' : 'bg-red-500'}`}
              ></span>
              <span>Estado: {config.isReady ? 'Configurado ✅' : 'No configurado ❌'}</span>
            </div>
            <div>Proveedor: {config.provider}</div>
            <div>Email origen: {config.fromEmail}</div>
            <div>Email soporte: {config.supportEmail}</div>
            <div>API Key: {config.hasApiKey ? 'Configurada ✅' : 'No configurada ❌'}</div>
          </div>
        ) : (
          <div className='text-gray-500'>Cargando configuración...</div>
        )}
      </div>

      {/* Formulario de Test */}
      <form onSubmit={handleSendTest} className='space-y-4'>
        <div>
          <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-1'>
            Email Destinatario
          </label>
          <input
            type='email'
            id='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blaze-orange-500'
            placeholder='tu@email.com'
            required
          />
        </div>

        <div>
          <label htmlFor='userName' className='block text-sm font-medium text-gray-700 mb-1'>
            Nombre del Usuario
          </label>
          <input
            type='text'
            id='userName'
            value={userName}
            onChange={e => setUserName(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blaze-orange-500'
            placeholder='Juan Pérez'
            required
          />
        </div>

        <div>
          <label htmlFor='type' className='block text-sm font-medium text-gray-700 mb-1'>
            Tipo de Email
          </label>
          <select
            id='type'
            value={selectedType}
            onChange={e => setSelectedType(e.target.value as 'welcome' | 'order' | 'reset')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blaze-orange-500'
          >
            <option value='welcome'>🎉 Email de Bienvenida</option>
            <option value='order'>📦 Confirmación de Pedido</option>
            <option value='reset'>🔒 Recuperación de Contraseña</option>
          </select>
        </div>

        <button
          type='submit'
          disabled={loading || !config?.isReady}
          className='w-full bg-blaze-orange-600 text-white py-2 px-4 rounded-md hover:bg-blaze-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          {loading ? 'Enviando...' : 'Enviar Email de Prueba'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-md'>
          <div className='text-red-800'>
            <strong>Error:</strong>{' '}
            {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
          </div>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div
          className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
        >
          <div className={result.success ? 'text-green-800' : 'text-red-800'}>
            <strong>{result.success ? '✅ Email Enviado' : '❌ Error'}</strong>
            <div className='mt-2 text-sm'>
              {result.success ? (
                <>
                  <div>Tipo: {result.type}</div>
                  <div>Enviado a: {result.sentTo}</div>
                  {result.messageId && <div>ID: {result.messageId}</div>}
                </>
              ) : (
                <div>Error: {result.error}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instrucciones */}
      <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md'>
        <h4 className='font-semibold text-blue-900 mb-2'>📋 Instrucciones</h4>
        <div className='text-blue-800 text-sm space-y-1'>
          <div>1. Configura RESEND_API_KEY en las variables de entorno</div>
          <div>2. Verifica que el dominio @pinteya.com esté configurado en Resend</div>
          <div>3. Usa un email real para recibir el test</div>
          <div>4. Revisa la carpeta de spam si no recibes el email</div>
        </div>
      </div>
    </div>
  )
}

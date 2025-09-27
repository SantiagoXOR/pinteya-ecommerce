export default function ClerkStatusPage() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const secretKey = process.env.CLERK_SECRET_KEY

  return (
    <div className='min-h-screen bg-gray-50 py-12 px-4'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8'>🔧 Estado de Clerk (Server-Side)</h1>

        <div className='grid gap-6'>
          <div className='bg-white rounded-lg shadow p-6'>
            <h2 className='text-xl font-semibold mb-4'>Variables de Entorno</h2>
            <div className='space-y-2'>
              <p>
                <strong>Publishable Key:</strong>{' '}
                {publishableKey
                  ? `${publishableKey.substring(0, 20)}... (${publishableKey.length} chars)`
                  : '❌ NO CONFIGURADA'}
              </p>
              <p>
                <strong>Tipo:</strong>{' '}
                {publishableKey?.startsWith('pk_live_')
                  ? '🔴 PRODUCCIÓN'
                  : publishableKey?.startsWith('[STRIPE_PUBLIC_KEY_REMOVED]')
                    ? '🟢 DESARROLLO'
                    : '❓ DESCONOCIDO'}
              </p>
              <p>
                <strong>Secret Key:</strong>{' '}
                {secretKey
                  ? `${secretKey.substring(0, 20)}... (${secretKey.length} chars)`
                  : '❌ NO CONFIGURADA'}
              </p>
            </div>
          </div>

          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-6'>
            <h2 className='text-xl font-semibold mb-4 text-yellow-800'>📋 Diagnóstico</h2>
            <div className='space-y-2 text-yellow-700'>
              {publishableKey?.startsWith('pk_live_') && (
                <div>
                  <p className='font-semibold'>🔴 Usando claves de PRODUCCIÓN</p>
                  <p>
                    El dominio pinteya-ecommerce.vercel.app debe estar autorizado en Clerk Dashboard
                  </p>
                  <p>
                    Ve a:{' '}
                    <a href='https://dashboard.clerk.com/' className='underline' target='_blank'>
                      https://dashboard.clerk.com/
                    </a>
                  </p>
                  <p>Agrega el dominio en la sección "Domains"</p>
                </div>
              )}
              {publishableKey?.startsWith('[STRIPE_PUBLIC_KEY_REMOVED]') && (
                <div>
                  <p className='font-semibold'>🟢 Usando claves de DESARROLLO</p>
                  <p>Las claves de desarrollo funcionan en cualquier dominio</p>
                </div>
              )}
              {!publishableKey && (
                <div>
                  <p className='font-semibold'>❌ No hay claves configuradas</p>
                  <p>Configura las variables de entorno en Vercel</p>
                </div>
              )}
            </div>
          </div>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
            <h2 className='text-xl font-semibold mb-4 text-blue-800'>🔗 Enlaces útiles</h2>
            <div className='space-y-2 text-blue-700'>
              <p>
                <a href='https://dashboard.clerk.com/' className='underline' target='_blank'>
                  Clerk Dashboard
                </a>
              </p>
              <p>
                <a
                  href='https://vercel.com/santiagoxor/pinteya-ecommerce/settings/environment-variables'
                  className='underline'
                  target='_blank'
                >
                  Variables de Entorno en Vercel
                </a>
              </p>
              <p>
                <a href='/debug-clerk' className='underline'>
                  Página de Debug de Clerk
                </a>
              </p>
              <p>
                <a href='/signin' className='underline'>
                  Página de Sign In
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

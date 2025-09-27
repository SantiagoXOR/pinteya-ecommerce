export const dynamic = 'force-dynamic'

export default function DebugSimplePage() {
  return (
    <div className='p-8 max-w-4xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Debug Simple - Variables de Entorno</h1>

      <div className='space-y-6'>
        <div className='bg-gray-100 p-4 rounded'>
          <h2 className='text-lg font-semibold mb-2'>Variables de Entorno Públicas</h2>
          <ul className='space-y-1 text-sm'>
            <li>
              NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:{' '}
              {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Configurada' : 'No configurada'}
            </li>
            <li>
              NEXT_PUBLIC_SUPABASE_URL:{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurada' : 'No configurada'}
            </li>
            <li>NEXT_PUBLIC_APP_URL: {process.env.NEXT_PUBLIC_APP_URL || 'No configurada'}</li>
            <li>NODE_ENV: {process.env.NODE_ENV || 'No configurada'}</li>
            <li>VERCEL_ENV: {process.env.VERCEL_ENV || 'No configurada'}</li>
          </ul>
        </div>

        <div className='bg-blue-100 p-4 rounded'>
          <h2 className='text-lg font-semibold mb-2'>Estado del Sistema</h2>
          <ul className='space-y-1 text-sm'>
            <li>Timestamp: {new Date().toISOString()}</li>
            <li>User Agent: {typeof window !== 'undefined' ? 'Cliente' : 'Servidor'}</li>
          </ul>
        </div>

        <div className='bg-green-100 p-4 rounded'>
          <h2 className='text-lg font-semibold mb-2'>Enlaces de Prueba</h2>
          <div className='space-y-2'>
            <a href='/admin' className='block text-blue-600 hover:underline'>
              Probar acceso a /admin
            </a>
            <a href='/debug-user' className='block text-blue-600 hover:underline'>
              Probar debug-user (con Clerk)
            </a>
            <a href='/' className='block text-blue-600 hover:underline'>
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

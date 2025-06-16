import Link from 'next/link';

export default function AdminPage() {
  const adminSections = [
    {
      title: 'Diagnósticos',
      description: 'Herramientas de debugging y verificación del sistema',
      href: '/admin/diagnostics',
      icon: '🔍',
      color: 'bg-blue-500'
    },
    {
      title: 'Logs del Sistema',
      description: 'Visualizar logs y eventos del sistema',
      href: '/admin/logs',
      icon: '📋',
      color: 'bg-green-500',
      disabled: true
    },
    {
      title: 'Configuración',
      description: 'Configurar parámetros del sistema',
      href: '/admin/config',
      icon: '⚙️',
      color: 'bg-purple-500',
      disabled: true
    },
    {
      title: 'Base de Datos',
      description: 'Herramientas de gestión de base de datos',
      href: '/admin/database',
      icon: '🗄️',
      color: 'bg-yellow-500',
      disabled: true
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🔧 Panel de Administración
        </h1>
        <p className="text-gray-600">
          Bienvenido al panel de administración de Pinteya E-commerce. 
          Aquí puedes acceder a herramientas de diagnóstico, configuración y mantenimiento del sistema.
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <div className="flex items-center">
          <div className="text-yellow-600 mr-3">⚠️</div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Área Restringida</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Esta área está destinada únicamente para administradores y desarrollo. 
              El acceso no autorizado está prohibido.
            </p>
          </div>
        </div>
      </div>

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {adminSections.map((section) => (
          <div
            key={section.title}
            className={`bg-white rounded-lg shadow-md border p-6 ${
              section.disabled ? 'opacity-50' : 'hover:shadow-lg transition-shadow'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${section.color} rounded-lg flex items-center justify-center text-white text-2xl`}>
                {section.icon}
              </div>
              {section.disabled && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                  Próximamente
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {section.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {section.description}
            </p>
            
            {section.disabled ? (
              <button
                disabled
                className="w-full bg-gray-200 text-gray-500 py-2 px-4 rounded cursor-not-allowed"
              >
                No Disponible
              </button>
            ) : (
              <Link
                href={section.href}
                className="block w-full bg-tahiti-gold-500 text-white py-2 px-4 rounded text-center hover:bg-tahiti-gold-600 transition-colors"
              >
                Acceder
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-md border p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Estado del Sistema</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">✅</div>
            <div className="text-sm text-gray-600">Build Status</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">🟢</div>
            <div className="text-sm text-gray-600">Database</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">🔐</div>
            <div className="text-sm text-gray-600">Auth</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">💳</div>
            <div className="text-sm text-gray-600">Payments</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Acciones Rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/diagnostics"
            className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 transition-colors"
          >
            🔍 Diagnósticos
          </Link>
          <Link
            href="/test-env"
            className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 transition-colors"
          >
            🌐 Variables Entorno
          </Link>
          <Link
            href="/debug-clerk"
            className="bg-purple-500 text-white px-4 py-2 rounded text-sm hover:bg-purple-600 transition-colors"
          >
            🔐 Debug Clerk
          </Link>
          <Link
            href="/"
            className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition-colors"
          >
            🏠 Volver al Sitio
          </Link>
        </div>
      </div>
    </div>
  );
}

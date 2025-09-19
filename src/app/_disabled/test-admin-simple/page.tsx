export default function TestAdminSimple() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          🎉 ¡ACCESO EXITOSO!
        </h1>
        <p className="text-gray-700 mb-4">
          Si puedes ver esta página, significa que el middleware está funcionando correctamente.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-semibold text-blue-800 mb-2">Información de la prueba:</h2>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• URL: /test-admin-simple</li>
            <li>• Middleware: Activo</li>
            <li>• Protección admin: Deshabilitada temporalmente</li>
            <li>• Estado: Funcionando ✅</li>
          </ul>
        </div>
        <div className="mt-6">
          <a 
            href="/admin" 
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
          >
            Ir al Admin Panel →
          </a>
        </div>
      </div>
    </div>
  );
}










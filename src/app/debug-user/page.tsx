import { auth, currentUser } from '@clerk/nextjs/server'

export default async function DebugUserPage() {
  const { userId, sessionClaims } = await auth()
  const user = await currentUser()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug User Information</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Auth() Information</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({ userId, sessionClaims }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">CurrentUser() Information</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-blue-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Role Detection</h2>
          <ul className="space-y-1 text-sm">
            <li>sessionClaims?.role: {sessionClaims?.role || 'undefined'}</li>
            <li>sessionClaims?.metadata?.role: {sessionClaims?.metadata?.role || 'undefined'}</li>
            <li>sessionClaims?.publicMetadata?.role: {sessionClaims?.publicMetadata?.role || 'undefined'}</li>
            <li>user?.publicMetadata?.role: {user?.publicMetadata?.role || 'undefined'}</li>
            <li>user?.privateMetadata?.role: {user?.privateMetadata?.role || 'undefined'}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

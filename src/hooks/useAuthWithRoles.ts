'use client'

import { useAuth, useUser } from '@clerk/nextjs'

export function useAuthWithRoles() {
  const { userId, has, isLoaded: authLoaded } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  
  const isLoaded = authLoaded && userLoaded
  
  // Verificaciones automáticas con Clerk
  const isAdmin = has({ role: 'admin' })
  const isModerator = has({ role: 'moderator' })
  const isCustomer = has({ role: 'customer' })
  
  // Permisos específicos
  const canManageProducts = has({ permission: 'products:manage' })
  const canManageOrders = has({ permission: 'orders:manage' })
  const canViewAnalytics = has({ permission: 'analytics:view' })
  const canAccessAdminPanel = isAdmin || isModerator
  
  return {
    userId,
    user,
    isLoaded,
    isAdmin,
    isModerator,
    isCustomer,
    canManageProducts,
    canManageOrders,
    canViewAnalytics,
    canAccessAdminPanel,
    hasRole: (role: string) => has({ role }),
    hasPermission: (permission: string) => has({ permission }),
  }
}

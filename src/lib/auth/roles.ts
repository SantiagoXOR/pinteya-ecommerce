'use client'

export type Permission =
  | 'products:read'
  | 'products:write'
  | 'products:delete'
  | 'orders:read'
  | 'orders:write'
  | 'orders:delete'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'analytics:read'
  | 'settings:read'
  | 'settings:write'
  | 'inventory:read'
  | 'inventory:write'
  | 'reports:read'
  | 'reports:generate'
  | 'notifications:send'
  | 'admin:access'

export type Role = 'super_admin' | 'admin' | 'manager' | 'employee' | 'customer'

export interface UserRole {
  id: string
  name: Role
  displayName: string
  description: string
  permissions: Permission[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserWithRole {
  id: string
  email: string
  name: string
  role: Role
  permissions: Permission[]
  isActive: boolean
}

// Definición de roles y sus permisos
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    'products:read',
    'products:write',
    'products:delete',
    'orders:read',
    'orders:write',
    'orders:delete',
    'users:read',
    'users:write',
    'users:delete',
    'analytics:read',
    'settings:read',
    'settings:write',
    'inventory:read',
    'inventory:write',
    'reports:read',
    'reports:generate',
    'notifications:send',
    'admin:access',
  ],
  admin: [
    'products:read',
    'products:write',
    'products:delete',
    'orders:read',
    'orders:write',
    'users:read',
    'users:write',
    'analytics:read',
    'settings:read',
    'settings:write',
    'inventory:read',
    'inventory:write',
    'reports:read',
    'reports:generate',
    'notifications:send',
    'admin:access',
  ],
  manager: [
    'products:read',
    'products:write',
    'orders:read',
    'orders:write',
    'users:read',
    'analytics:read',
    'inventory:read',
    'inventory:write',
    'reports:read',
    'admin:access',
  ],
  employee: ['products:read', 'orders:read', 'orders:write', 'inventory:read', 'admin:access'],
  customer: [],
}

export const ROLE_DEFINITIONS: Record<Role, Omit<UserRole, 'id' | 'createdAt' | 'updatedAt'>> = {
  super_admin: {
    name: 'super_admin',
    displayName: 'Super Administrador',
    description: 'Acceso completo a todas las funcionalidades del sistema',
    permissions: ROLE_PERMISSIONS.super_admin,
    isActive: true,
  },
  admin: {
    name: 'admin',
    displayName: 'Administrador',
    description: 'Acceso administrativo con la mayoría de permisos',
    permissions: ROLE_PERMISSIONS.admin,
    isActive: true,
  },
  manager: {
    name: 'manager',
    displayName: 'Gerente',
    description: 'Gestión de productos, órdenes e inventario',
    permissions: ROLE_PERMISSIONS.manager,
    isActive: true,
  },
  employee: {
    name: 'employee',
    displayName: 'Empleado',
    description: 'Acceso básico para gestión de órdenes',
    permissions: ROLE_PERMISSIONS.employee,
    isActive: true,
  },
  customer: {
    name: 'customer',
    displayName: 'Cliente',
    description: 'Usuario cliente con acceso a la tienda',
    permissions: ROLE_PERMISSIONS.customer,
    isActive: true,
  },
}

export class RoleManager {
  private static instance: RoleManager

  static getInstance(): RoleManager {
    if (!RoleManager.instance) {
      RoleManager.instance = new RoleManager()
    }
    return RoleManager.instance
  }

  /**
   * Verifica si un usuario tiene un permiso específico
   */
  hasPermission(userRole: Role, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole]
    return rolePermissions.includes(permission)
  }

  /**
   * Verifica si un usuario tiene múltiples permisos
   */
  hasPermissions(userRole: Role, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission))
  }

  /**
   * Verifica si un usuario tiene al menos uno de los permisos especificados
   */
  hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission))
  }

  /**
   * Obtiene todos los permisos de un rol
   */
  getRolePermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || []
  }

  /**
   * Verifica si un rol puede acceder al panel de administración
   */
  canAccessAdmin(role: Role): boolean {
    return this.hasPermission(role, 'admin:access')
  }

  /**
   * Verifica si un rol es superior a otro
   */
  isRoleHigher(role1: Role, role2: Role): boolean {
    const hierarchy: Record<Role, number> = {
      customer: 0,
      employee: 1,
      manager: 2,
      admin: 3,
      super_admin: 4,
    }
    return hierarchy[role1] > hierarchy[role2]
  }

  /**
   * Obtiene los roles que un usuario puede asignar
   */
  getAssignableRoles(currentUserRole: Role): Role[] {
    const allRoles: Role[] = ['customer', 'employee', 'manager', 'admin', 'super_admin']

    // Solo super_admin puede asignar cualquier rol
    if (currentUserRole === 'super_admin') {
      return allRoles
    }

    // Admin puede asignar roles inferiores
    if (currentUserRole === 'admin') {
      return ['customer', 'employee', 'manager']
    }

    // Manager puede asignar solo customer y employee
    if (currentUserRole === 'manager') {
      return ['customer', 'employee']
    }

    // Otros roles no pueden asignar roles
    return []
  }

  /**
   * Valida si una asignación de rol es válida
   */
  canAssignRole(assignerRole: Role, targetRole: Role): boolean {
    const assignableRoles = this.getAssignableRoles(assignerRole)
    return assignableRoles.includes(targetRole)
  }

  /**
   * Obtiene la definición completa de un rol
   */
  getRoleDefinition(role: Role): Omit<UserRole, 'id' | 'createdAt' | 'updatedAt'> | null {
    return ROLE_DEFINITIONS[role] || null
  }

  /**
   * Obtiene todos los roles disponibles
   */
  getAllRoles(): Role[] {
    return Object.keys(ROLE_DEFINITIONS) as Role[]
  }

  /**
   * Filtra recursos basado en permisos
   */
  filterByPermissions<T extends { requiredPermissions?: Permission[] }>(
    items: T[],
    userRole: Role
  ): T[] {
    return items.filter(item => {
      if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
        return true
      }
      return this.hasPermissions(userRole, item.requiredPermissions)
    })
  }
}

// Instancia singleton
export const roleManager = RoleManager.getInstance()

// Funciones de conveniencia
export const hasPermission = (userRole: Role, permission: Permission) =>
  roleManager.hasPermission(userRole, permission)

export const hasPermissions = (userRole: Role, permissions: Permission[]) =>
  roleManager.hasPermissions(userRole, permissions)

export const hasAnyPermission = (userRole: Role, permissions: Permission[]) =>
  roleManager.hasAnyPermission(userRole, permissions)

export const canAccessAdmin = (role: Role) => roleManager.canAccessAdmin(role)

export const canAssignRole = (assignerRole: Role, targetRole: Role) =>
  roleManager.canAssignRole(assignerRole, targetRole)

// Hook para usar en componentes React
export function useRolePermissions(userRole: Role) {
  return {
    hasPermission: (permission: Permission) => hasPermission(userRole, permission),
    hasPermissions: (permissions: Permission[]) => hasPermissions(userRole, permissions),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
    canAccessAdmin: () => canAccessAdmin(userRole),
    rolePermissions: roleManager.getRolePermissions(userRole),
    roleDefinition: roleManager.getRoleDefinition(userRole),
  }
}

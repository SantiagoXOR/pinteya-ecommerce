/**
 * Componente de Gestión de Usuarios y Roles
 * Dashboard para administrar usuarios, asignar roles y gestionar permisos
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useUserRole } from '@/hooks/useUserRole'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Users, Shield, Settings, Search, Plus, Edit, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Interfaces
interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  last_login_at: string | null
  user_roles: {
    id: number
    role_name: string
    display_name: string
  }
}

interface Role {
  id: number
  role_name: string
  display_name: string
  description: string
  permissions: Record<string, any>
  is_active: boolean
}

export default function UserManagement() {
  const { canManageUsers, isAdmin, isLoading: userLoading } = useUserRole()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Verificar permisos
  if (userLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blaze-orange-600 mx-auto'></div>
          <p className='mt-2 text-gray-600'>Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!canManageUsers && !isAdmin) {
    return (
      <Alert>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          No tienes permisos para gestionar usuarios. Contacta a un administrador.
        </AlertDescription>
      </Alert>
    )
  }

  // Cargar datos
  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')

      if (!response.ok) {
        throw new Error('Error al cargar usuarios')
      }

      const data = await response.json()
      setUsers(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles')

      if (!response.ok) {
        throw new Error('Error al cargar roles')
      }

      const data = await response.json()
      setRoles(data.data || [])
    } catch (err) {
      console.error('Error loading roles:', err)
    }
  }

  const handleRoleChange = async (userId: string, newRoleId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role_id: newRoleId }),
      })

      if (!response.ok) {
        throw new Error('Error al cambiar rol')
      }

      // Recargar usuarios
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar rol')
    }
  }

  const handleUserStatusChange = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      })

      if (!response.ok) {
        throw new Error('Error al cambiar estado')
      }

      // Recargar usuarios
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado')
    }
  }

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = selectedRole === 'all' || user.user_roles?.role_name === selectedRole

    return matchesSearch && matchesRole
  })

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'moderator':
        return 'bg-yellow-100 text-yellow-800'
      case 'customer':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blaze-orange-600 mx-auto'></div>
          <p className='mt-2 text-gray-600'>Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Gestión de Usuarios</h1>
          <p className='text-gray-600'>Administra usuarios, roles y permisos del sistema</p>
        </div>
        <Button>
          <Plus className='h-4 w-4 mr-2' />
          Nuevo Usuario
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Usuarios</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Administradores</CardTitle>
            <Shield className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {users.filter(u => u.user_roles?.role_name === 'admin').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Usuarios Activos</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{users.filter(u => u.is_active).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Roles Disponibles</CardTitle>
            <Settings className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{roles.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <Label htmlFor='search'>Buscar usuarios</Label>
              <div className='relative'>
                <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                <Input
                  id='search'
                  placeholder='Buscar por email o nombre...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <div className='sm:w-48'>
              <Label htmlFor='role-filter'>Filtrar por rol</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder='Todos los roles' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos los roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.role_name}>
                      {role.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>{filteredUsers.length} usuario(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className='font-medium'>{user.email}</div>
                      <div className='text-sm text-gray-500'>
                        {user.first_name} {user.last_name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.user_roles?.role_name || 'customer')}>
                      {user.user_roles?.display_name || 'Cliente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString()
                      : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setSelectedUser(user)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleUserStatusChange(user.id, !user.is_active)}
                      >
                        {user.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifica la información y permisos del usuario</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className='space-y-4'>
              <div>
                <Label htmlFor='user-email'>Email</Label>
                <Input id='user-email' value={selectedUser.email} disabled />
              </div>
              <div>
                <Label htmlFor='user-role'>Rol</Label>
                <Select
                  value={selectedUser.user_roles?.id.toString()}
                  onValueChange={value => handleRoleChange(selectedUser.id, parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex justify-end gap-2'>
                <Button variant='outline' onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsEditDialogOpen(false)}>Guardar Cambios</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

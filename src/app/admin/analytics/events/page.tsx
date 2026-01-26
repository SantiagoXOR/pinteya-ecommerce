/**
 * Página de Analytics Events para administradores
 * Dashboard completo con eventos raw, journeys y análisis de carritos abandonados
 */

'use client'

import React, { useState } from 'react'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { AdminContentWrapper } from '@/components/admin/layout/AdminContentWrapper'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnalyticsEventsViewer } from '@/components/admin/analytics/AnalyticsEventsViewer'
import { UserJourneyViewer } from '@/components/admin/analytics/UserJourneyViewer'
import { AbandonedCartsAnalysis } from '@/components/admin/analytics/AbandonedCartsAnalysis'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar, Filter } from '@/lib/optimized-imports'
import { useUserRole } from '@/hooks/useUserRole'
import { useRouter } from 'next/navigation'

const AnalyticsEventsPage: React.FC = () => {
  const { isAdmin } = useUserRole()
  const router = useRouter()
  const [globalFilters, setGlobalFilters] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  // Verificar permisos de admin
  if (!isAdmin) {
    router.push('/admin')
    return null
  }

  return (
    <AdminLayout
      title="Analytics Events"
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Analytics', href: '/admin/analytics' },
        { label: 'Events', href: '/admin/analytics/events' },
      ]}
    >
      <AdminContentWrapper>
        <div className="space-y-6">
          {/* Filtros Globales */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle>Filtros Globales</CardTitle>
              </div>
              <CardDescription>
                Aplica estos filtros a todas las vistas de analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Fecha Inicio</label>
                  <Input
                    type="date"
                    value={globalFilters.startDate}
                    onChange={(e) =>
                      setGlobalFilters((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Fecha Fin</label>
                  <Input
                    type="date"
                    value={globalFilters.endDate}
                    onChange={(e) =>
                      setGlobalFilters((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      // Los componentes se actualizarán automáticamente cuando cambien las props
                      window.location.reload()
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Aplicar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen General */}
          <AnalyticsSummary />

          {/* Tabs con las tres vistas */}
          <Tabs defaultValue="events" className="space-y-4">
            <TabsList>
              <TabsTrigger value="events">Eventos Raw</TabsTrigger>
              <TabsTrigger value="journeys">User Journeys</TabsTrigger>
              <TabsTrigger value="abandoned">Carritos Abandonados</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-4">
              <AnalyticsEventsViewer
                startDate={globalFilters.startDate}
                endDate={globalFilters.endDate}
              />
            </TabsContent>

            <TabsContent value="journeys" className="space-y-4">
              <UserJourneyViewer
                startDate={globalFilters.startDate}
                endDate={globalFilters.endDate}
              />
            </TabsContent>

            <TabsContent value="abandoned" className="space-y-4">
              <AbandonedCartsAnalysis
                startDate={globalFilters.startDate}
                endDate={globalFilters.endDate}
              />
            </TabsContent>
          </Tabs>
        </div>
      </AdminContentWrapper>
    </AdminLayout>
  )
}

export default AnalyticsEventsPage

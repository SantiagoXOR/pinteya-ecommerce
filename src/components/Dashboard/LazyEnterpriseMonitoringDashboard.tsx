// ===================================
// PINTEYA E-COMMERCE - LAZY ENTERPRISE MONITORING DASHBOARD
// Wrapper con lazy loading para EnterpriseMonitoringDashboard (28.65KB)
// ===================================

'use client'

import React, { lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity,
  Shield,
  Zap,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Server,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Settings,
  Eye,
  Lock,
  Cpu,
  HardDrive,
  Network,
  BarChart3,
} from '@/lib/optimized-imports'

// Lazy loading del componente principal
const EnterpriseMonitoringDashboard = lazy(() => import('./EnterpriseMonitoringDashboard'))

// ===================================
// SKELETON COMPONENTS
// ===================================

const MetricCardSkeleton = ({ icon }: { icon: React.ReactNode }) => (
  <Card>
    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
      <CardTitle className='text-sm font-medium'>
        <Skeleton className='h-4 w-24' />
      </CardTitle>
      <div className='text-muted-foreground'>{icon}</div>
    </CardHeader>
    <CardContent>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-16' />
        <div className='flex items-center space-x-2'>
          <Skeleton className='h-4 w-4' />
          <Skeleton className='h-4 w-12' />
        </div>
        <Skeleton className='h-3 w-20' />
      </div>
    </CardContent>
  </Card>
)

const SystemHealthSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center gap-2'>
        <Server className='w-5 h-5' />
        <Skeleton className='h-6 w-32' />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className='space-y-4'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='flex items-center justify-between p-3 border rounded-lg'>
            <div className='flex items-center space-x-3'>
              <Skeleton className='w-3 h-3 rounded-full' />
              <div className='space-y-1'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-3 w-16' />
              </div>
            </div>
            <div className='text-right space-y-1'>
              <Skeleton className='h-4 w-12' />
              <Skeleton className='h-3 w-16' />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const ChartSkeleton = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center gap-2'>
        {icon}
        <Skeleton className='h-6 w-32' />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className='space-y-4'>
        {/* Chart area */}
        <div className='h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center'>
          <BarChart3 className='w-12 h-12 text-gray-300' />
        </div>

        {/* Legend */}
        <div className='flex justify-center space-x-4'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='flex items-center space-x-2'>
              <Skeleton className='w-3 h-3 rounded-full' />
              <Skeleton className='h-4 w-16' />
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
)

const SecurityMetricsSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center gap-2'>
        <Shield className='w-5 h-5' />
        <Skeleton className='h-6 w-40' />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {[
          { icon: <Lock className='w-4 h-4' />, title: 'Rate Limiting' },
          { icon: <Eye className='w-4 h-4' />, title: 'Auditing' },
          { icon: <AlertTriangle className='w-4 h-4' />, title: 'Validation' },
        ].map((item, i) => (
          <div key={i} className='space-y-3'>
            <div className='flex items-center space-x-2'>
              {item.icon}
              <Skeleton className='h-5 w-24' />
            </div>
            <div className='space-y-2'>
              {[...Array(3)].map((_, j) => (
                <div key={j} className='flex justify-between'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-12' />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const EnterpriseMonitoringDashboardSkeleton = () => (
  <div className='min-h-screen bg-gray-50 p-6'>
    <div className='max-w-7xl mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-64' />
          <Skeleton className='h-4 w-48' />
        </div>
        <div className='flex space-x-2'>
          <Button disabled variant='outline' size='sm'>
            <RefreshCw className='w-4 h-4 mr-2' />
            <Skeleton className='h-4 w-16' />
          </Button>
          <Button disabled variant='outline' size='sm'>
            <Download className='w-4 h-4 mr-2' />
            <Skeleton className='h-4 w-16' />
          </Button>
          <Button disabled variant='outline' size='sm'>
            <Settings className='w-4 h-4 mr-2' />
            <Skeleton className='h-4 w-16' />
          </Button>
        </div>
      </div>

      {/* Main metrics grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <MetricCardSkeleton icon={<Activity className='w-4 h-4' />} />
        <MetricCardSkeleton icon={<Shield className='w-4 h-4' />} />
        <MetricCardSkeleton icon={<Zap className='w-4 h-4' />} />
        <MetricCardSkeleton icon={<Database className='w-4 h-4' />} />
      </div>

      {/* Tabs skeleton */}
      <Tabs defaultValue='overview' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-5'>
          {['Overview', 'Security', 'Performance', 'Cache', 'Logs'].map((tab, i) => (
            <TabsTrigger key={i} value={tab.toLowerCase()} disabled>
              <Skeleton className='h-4 w-16' />
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <SystemHealthSkeleton />
            <ChartSkeleton title='Performance Trends' icon={<TrendingUp className='w-5 h-5' />} />
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <ChartSkeleton title='Resource Usage' icon={<Cpu className='w-5 h-5' />} />
            <ChartSkeleton title='Network Activity' icon={<Network className='w-5 h-5' />} />
          </div>
        </TabsContent>

        <TabsContent value='security' className='space-y-6'>
          <SecurityMetricsSkeleton />

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <ChartSkeleton title='Threat Detection' icon={<AlertTriangle className='w-5 h-5' />} />
            <ChartSkeleton title='Access Patterns' icon={<Users className='w-5 h-5' />} />
          </div>
        </TabsContent>

        <TabsContent value='performance' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <MetricCardSkeleton icon={<Clock className='w-4 h-4' />} />
            <MetricCardSkeleton icon={<TrendingUp className='w-4 h-4' />} />
            <MetricCardSkeleton icon={<TrendingDown className='w-4 h-4' />} />
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <ChartSkeleton title='Response Times' icon={<Clock className='w-5 h-5' />} />
            <ChartSkeleton title='Throughput' icon={<Activity className='w-5 h-5' />} />
          </div>
        </TabsContent>

        <TabsContent value='cache' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <MetricCardSkeleton icon={<Database className='w-4 h-4' />} />
            <MetricCardSkeleton icon={<Zap className='w-4 h-4' />} />
            <MetricCardSkeleton icon={<HardDrive className='w-4 h-4' />} />
            <MetricCardSkeleton icon={<RefreshCw className='w-4 h-4' />} />
          </div>

          <ChartSkeleton title='Cache Performance' icon={<Database className='w-5 h-5' />} />
        </TabsContent>

        <TabsContent value='logs' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Eye className='w-5 h-5' />
                <Skeleton className='h-6 w-32' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className='flex items-center space-x-3 p-3 border rounded'>
                    <Skeleton className='w-3 h-3 rounded-full' />
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='h-4 flex-1' />
                    <Skeleton className='h-4 w-16' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status footer */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <CheckCircle className='w-4 h-4 text-green-500' />
              <Skeleton className='h-4 w-32' />
            </div>
            <Skeleton className='h-4 w-24' />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)

// ===================================
// LAZY COMPONENT
// ===================================

const LazyEnterpriseMonitoringDashboard = (props: any) => {
  return (
    <Suspense fallback={<EnterpriseMonitoringDashboardSkeleton />}>
      <EnterpriseMonitoringDashboard {...props} />
    </Suspense>
  )
}

export default LazyEnterpriseMonitoringDashboard
export { EnterpriseMonitoringDashboardSkeleton }

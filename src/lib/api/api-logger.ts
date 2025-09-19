// 🔧 Enterprise API Logger

import { NextRequest, NextResponse } from 'next/server';

interface ApiLogEntry {
  timestamp: string;
  method: string;
  path: string;
  user_id?: string;
  status_code: number;
  response_time_ms: number;
  error?: string;
  metadata?: any;
}

export function withApiLogging(handler: Function) {
  return async function (request: NextRequest, context: any) {
    const startTime = Date.now();
    const logEntry: Partial<ApiLogEntry> = {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: new URL(request.url).pathname,
      user_id: (request as any).user?.id
    };

    try {
      const response = await handler(request, context);
      
      logEntry.status_code = response.status;
      logEntry.response_time_ms = Date.now() - startTime;
      
      // Log exitoso
      console.log('API Success:', logEntry);
      
      return response;
    } catch (error) {
      logEntry.status_code = (error as any).statusCode || 500;
      logEntry.response_time_ms = Date.now() - startTime;
      logEntry.error = (error as Error).message;
      
      // Log de error
      console.error('API Error:', logEntry);
      
      throw error;
    }
  };
}

export function logAdminAction(
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  oldData?: any,
  newData?: any
) {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    user_id: userId,
    action,
    resource,
    resource_id: resourceId,
    old_data: oldData,
    new_data: newData,
    ip_address: 'unknown', // TODO: Extract from request
    user_agent: 'unknown'  // TODO: Extract from request
  };

  console.log('Admin Action:', auditEntry);
  
  // TODO: Store in audit table
  return auditEntry;
}










'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight } from '@/lib/optimized-imports'
import type { AIChatLogEntry } from '@/lib/ai-chat/ai-chat-logs'
import { useAIChatSend } from '@/hooks/useAIChatSend'
import { AIChatConversationUI } from '@/components/Common/AIChatConversation/AIChatConversationUI'

const INITIAL_BOT_MESSAGE =
  'Hola, soy el asistente (modo debug). ¿Qué vas a pintar hoy? Elegí una opción o escribime.'

export function AIChatDebugPanel() {
  const [models, setModels] = useState<{ name: string; displayName?: string }[]>([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [modelsOpen, setModelsOpen] = useState(false)

  const [logs, setLogs] = useState<AIChatLogEntry[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsError, setLogsError] = useState<string | null>(null)

  const {
    displayMessages,
    inputValue,
    setInputValue,
    isLoading,
    handleSend,
    handleApplicationClick,
    applications,
    lastResponseDebug,
  } = useAIChatSend({
    initialBotMessage: INITIAL_BOT_MESSAGE,
    adminDebug: true,
  })

  const fetchModels = useCallback(async () => {
    setModelsLoading(true)
    setModelsError(null)
    try {
      const res = await fetch('/api/ai-chat/models')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Error al listar modelos')
      setModels(data.models ?? [])
    } catch (e) {
      setModelsError(e instanceof Error ? e.message : String(e))
      setModels([])
    } finally {
      setModelsLoading(false)
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    setLogsError(null)
    try {
      const res = await fetch('/api/admin/ai-chat/logs?limit=50')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Error al cargar logs')
      setLogs(data.logs ?? [])
    } catch (e) {
      setLogsError(e instanceof Error ? e.message : String(e))
      setLogs([])
    } finally {
      setLogsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  useEffect(() => {
    fetchLogs()
    const t = setInterval(fetchLogs, 10000)
    return () => clearInterval(t)
  }, [fetchLogs])

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const debugStrip = lastResponseDebug && (
    <div className="p-3 rounded-lg bg-muted/60 text-sm space-y-1.5 border">
      <div className="font-medium text-muted-foreground">Debug última respuesta</div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {lastResponseDebug.durationMs != null && (
          <span>{lastResponseDebug.durationMs} ms</span>
        )}
        {lastResponseDebug.modelUsed != null && (
          <span>Modelo: {lastResponseDebug.modelUsed || '—'}</span>
        )}
        {lastResponseDebug.suggestedSearch != null && (
          <span>suggestedSearch: {lastResponseDebug.suggestedSearch || '—'}</span>
        )}
        {lastResponseDebug.suggestedCategory != null && (
          <span>suggestedCategory: {lastResponseDebug.suggestedCategory || '—'}</span>
        )}
      </div>
      {lastResponseDebug.contextProvided && (
        <div className="pt-1 border-t mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          <span>
            Knowledge-base: {lastResponseDebug.contextProvided.knowledgeBase ? 'Sí' : 'No'}
          </span>
          <span>
            Catálogo XML: {lastResponseDebug.contextProvided.catalogIncluded ? 'Sí' : 'No'}
            {lastResponseDebug.contextProvided.catalogProductCount != null &&
              ` (${lastResponseDebug.contextProvided.catalogProductCount} productos)`}
          </span>
        </div>
      )}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Chat: misma implementación que el storefront */}
      <Card>
        <CardHeader>
          <CardTitle>Chat (misma implementación)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Misma UI que el chat de la tienda: mensajes, product cards, chips. Con instrumentación de debug abajo.
          </p>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden" style={{ minHeight: 400, maxHeight: 500 }}>
            <AIChatConversationUI
              displayMessages={displayMessages}
              inputValue={inputValue}
              setInputValue={setInputValue}
              isLoading={isLoading}
              handleSend={handleSend}
              handleApplicationClick={handleApplicationClick}
              applications={applications}
              debugSlot={debugStrip}
              className="h-full p-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Modelos Gemini: lista colapsable */}
      <Card>
        <Collapsible open={modelsOpen} onOpenChange={setModelsOpen}>
          <CardHeader className="pb-2">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between text-left hover:opacity-80"
              >
                <CardTitle className="text-base">
                  Modelos Gemini ({modelsLoading ? '…' : models.length})
                </CardTitle>
                {modelsOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <p className="text-sm text-muted-foreground">
              Modelos disponibles con la clave configurada (se prueban en orden en respond).
            </p>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {modelsLoading ? (
                <p className="text-muted-foreground text-sm">Cargando modelos…</p>
              ) : modelsError ? (
                <p className="text-destructive text-sm">{modelsError}</p>
              ) : models.length === 0 ? (
                <p className="text-muted-foreground text-sm">No se encontraron modelos.</p>
              ) : (
                <ul className="list-disc list-inside text-sm space-y-1 max-h-48 overflow-y-auto">
                  {models.map((m) => (
                    <li key={m.name}>
                      <code className="bg-muted px-1 rounded">{m.name}</code>
                      {m.displayName && (
                        <span className="text-muted-foreground ml-2">{m.displayName}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Logs recientes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Logs recientes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Últimas solicitudes al AI Chat (se actualiza cada 10 s).
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={logsLoading}>
            {logsLoading ? 'Cargando…' : 'Actualizar'}
          </Button>
        </CardHeader>
        <CardContent>
          {logsError ? (
            <p className="text-destructive">{logsError}</p>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground">No hay logs aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">Hora</th>
                    <th className="text-left py-2 px-2 font-medium">Mensaje</th>
                    <th className="text-left py-2 px-2 font-medium">reply</th>
                    <th className="text-left py-2 px-2 font-medium">suggestedSearch</th>
                    <th className="text-left py-2 px-2 font-medium">suggestedCategory</th>
                    <th className="text-left py-2 px-2 font-medium">Estado</th>
                    <th className="text-left py-2 px-2 font-medium">ms</th>
                    <th className="text-left py-2 px-2 font-medium">Modelo</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">
                        {formatTime(log.timestamp)}
                      </td>
                      <td className="py-2 px-2 max-w-[180px] truncate" title={log.lastUserMessage}>
                        {log.lastUserMessage || '—'}
                      </td>
                      <td className="py-2 px-2 max-w-[200px] truncate" title={log.reply}>
                        {log.reply || '—'}
                      </td>
                      <td className="py-2 px-2">{log.suggestedSearch ?? '—'}</td>
                      <td className="py-2 px-2">{log.suggestedCategory ?? '—'}</td>
                      <td className="py-2 px-2">
                        <Badge variant={log.success ? 'default' : 'destructive'}>
                          {log.success ? 'OK' : 'Error'}
                        </Badge>
                        {log.error && (
                          <span
                            className="ml-1 text-destructive truncate max-w-[120px] inline-block"
                            title={log.error}
                          >
                            {log.error}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">{log.durationMs}</td>
                      <td className="py-2 px-2 text-muted-foreground text-xs">
                        {log.modelUsed ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

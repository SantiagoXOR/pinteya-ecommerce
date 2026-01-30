'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { AIChatLogEntry } from '@/lib/ai-chat/ai-chat-logs'

export function AIChatDebugPanel() {
  const [testMessage, setTestMessage] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{
    reply?: string
    suggestedSearch?: string | null
    suggestedCategory?: string | null
    durationMs?: number
    success?: boolean
    error?: string
  } | null>(null)

  const [models, setModels] = useState<{ name: string; displayName?: string }[]>([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [modelsError, setModelsError] = useState<string | null>(null)

  const [logs, setLogs] = useState<AIChatLogEntry[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsError, setLogsError] = useState<string | null>(null)

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

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    const msg = testMessage.trim()
    if (!msg || testLoading) return
    setTestLoading(true)
    setTestResult(null)
    const start = Date.now()
    try {
      const res = await fetch('/api/ai-chat/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user' as const, content: msg }],
        }),
      })
      const data = await res.json()
      const durationMs = Date.now() - start
      if (!res.ok) {
        setTestResult({
          success: false,
          error: data?.error ?? 'Error en la respuesta',
          durationMs,
        })
        return
      }
      setTestResult({
        reply: data.reply,
        suggestedSearch: data.suggestedSearch ?? null,
        suggestedCategory: data.suggestedCategory ?? null,
        success: data.success !== false,
        durationMs,
      })
      fetchLogs()
    } catch (e) {
      setTestResult({
        success: false,
        error: e instanceof Error ? e.message : String(e),
        durationMs: Date.now() - start,
      })
    } finally {
      setTestLoading(false)
    }
  }

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

  return (
    <div className="p-6 space-y-6">
      {/* Test de envío */}
      <Card>
        <CardHeader>
          <CardTitle>Test de envío</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enviá un mensaje al AI Chat y revisá reply, suggestedSearch y suggestedCategory.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTest} className="flex gap-2">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Ej: necesito pintar una pared exterior con revoque"
              className="max-w-md"
              disabled={testLoading}
            />
            <Button type="submit" disabled={testLoading || !testMessage.trim()}>
              {testLoading ? 'Enviando…' : 'Enviar'}
            </Button>
          </form>
          {testResult && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 text-sm space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={testResult.success ? 'default' : 'destructive'}>
                  {testResult.success ? 'OK' : 'Error'}
                </Badge>
                {testResult.durationMs != null && (
                  <span className="text-muted-foreground">{testResult.durationMs} ms</span>
                )}
              </div>
              {testResult.error && (
                <p className="text-destructive">{testResult.error}</p>
              )}
              {testResult.reply && (
                <p><strong>reply:</strong> {testResult.reply}</p>
              )}
              {testResult.suggestedSearch != null && (
                <p><strong>suggestedSearch:</strong> {testResult.suggestedSearch || '—'}</p>
              )}
              {testResult.suggestedCategory != null && (
                <p><strong>suggestedCategory:</strong> {testResult.suggestedCategory || '—'}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modelos Gemini */}
      <Card>
        <CardHeader>
          <CardTitle>Modelos Gemini</CardTitle>
          <p className="text-sm text-muted-foreground">
            Modelos disponibles con la clave configurada (se prueban en orden en respond).
          </p>
        </CardHeader>
        <CardContent>
          {modelsLoading ? (
            <p className="text-muted-foreground">Cargando modelos…</p>
          ) : modelsError ? (
            <p className="text-destructive">{modelsError}</p>
          ) : models.length === 0 ? (
            <p className="text-muted-foreground">No se encontraron modelos.</p>
          ) : (
            <ul className="list-disc list-inside text-sm space-y-1">
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
                          <span className="ml-1 text-destructive truncate max-w-[120px] inline-block" title={log.error}>
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

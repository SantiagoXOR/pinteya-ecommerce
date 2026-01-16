/**
 * Supabase Edge Function para archivar eventos antiguos de analytics
 * Ejecutar mensualmente (primer día de cada mes)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Obtener parámetros de la query string
    const url = new URL(req.url)
    const daysOld = parseInt(url.searchParams.get('daysOld') || '90')
    const batchSize = parseInt(url.searchParams.get('batchSize') || '10000')

    // Ejecutar función de archivado
    const { data, error } = await supabase.rpc('archive_old_analytics_events', {
      p_days_old: daysOld,
      p_batch_size: batchSize,
    })

    if (error) {
      console.error('Error archivando eventos:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Error archivando eventos antiguos', 
          details: error.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Eventos archivados correctamente',
        archived: data,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error en función:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

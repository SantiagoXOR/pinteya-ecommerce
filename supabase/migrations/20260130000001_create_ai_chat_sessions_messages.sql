-- ============================================================================
-- AI Chat: sesiones y mensajes (persistencia por usuario o visitante)
-- ============================================================================
-- Tablas para guardar conversaciones del asistente de IA por sesión
-- (usuario logueado o visitante con visitor_id).
-- ============================================================================

-- Sesiones de chat (una por conversación / ventana)
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NULL,
  visitor_id TEXT NULL,
  session_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_chat_sessions_owner CHECK (
    user_id IS NOT NULL OR visitor_id IS NOT NULL OR session_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_tenant_id ON public.ai_chat_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON public.ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_visitor_id ON public.ai_chat_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_created_at ON public.ai_chat_sessions(created_at);

COMMENT ON TABLE public.ai_chat_sessions IS 'Sesiones de conversación del AI Chat (una por chat, usuario o visitante)';

-- Mensajes de cada sesión
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  suggested_search TEXT NULL,
  suggested_category TEXT NULL,
  model_used TEXT NULL,
  duration_ms INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_id ON public.ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created_at ON public.ai_chat_messages(created_at);

COMMENT ON TABLE public.ai_chat_messages IS 'Mensajes del AI Chat por sesión';

-- RLS: solo backend/service role escribe; lectura por tenant (admin)
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas: inserción desde API (service role o anon con tenant en contexto);
-- lectura solo para mismo tenant (vía get_current_tenant_id() si existe).
-- Por defecto denegamos SELECT/INSERT/UPDATE/DELETE para roles normales;
-- la API usará service role o una política que permita insert cuando tenant_id coincida.

DROP POLICY IF EXISTS "ai_chat_sessions_tenant_select" ON public.ai_chat_sessions;
CREATE POLICY "ai_chat_sessions_tenant_select"
  ON public.ai_chat_sessions
  FOR SELECT
  USING (
    tenant_id = COALESCE(
      current_setting('app.current_tenant_id', true)::UUID,
      tenant_id
    )
  );

DROP POLICY IF EXISTS "ai_chat_sessions_tenant_insert" ON public.ai_chat_sessions;
CREATE POLICY "ai_chat_sessions_tenant_insert"
  ON public.ai_chat_sessions
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "ai_chat_messages_session_select" ON public.ai_chat_messages;
CREATE POLICY "ai_chat_messages_session_select"
  ON public.ai_chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_chat_sessions s
      WHERE s.id = ai_chat_messages.session_id
      AND s.tenant_id = COALESCE(
        current_setting('app.current_tenant_id', true)::UUID,
        s.tenant_id
      )
    )
  );

DROP POLICY IF EXISTS "ai_chat_messages_session_insert" ON public.ai_chat_messages;
CREATE POLICY "ai_chat_messages_session_insert"
  ON public.ai_chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_chat_sessions s
      WHERE s.id = ai_chat_messages.session_id
    )
  );

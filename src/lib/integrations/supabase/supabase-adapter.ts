import { createClient } from '@supabase/supabase-js'
import type {
  Adapter,
  AdapterUser,
  AdapterAccount,
  AdapterSession,
  VerificationToken,
} from '@auth/core/adapters'

export interface SupabaseAdapterClientOptions {
  url: string
  secret: string
}

export function SupabaseAdapter(options: SupabaseAdapterClientOptions): Adapter {
  const { url, secret } = options
  const supabase = createClient(url, secret, {
    db: { schema: 'public' },
    auth: { persistSession: false },
  })

  return {
    async createUser(user) {
      console.log('[CUSTOM_ADAPTER] createUser:', user)
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(),
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified?.toISOString(),
          image: user.image,
        })
        .select()
        .single()

      if (error) {
        console.error('[CUSTOM_ADAPTER] createUser error:', error)
        throw new Error(`Error creating user: ${error.message}`)
      }

      console.log('[CUSTOM_ADAPTER] createUser success:', data)
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        emailVerified: data.emailVerified ? new Date(data.emailVerified) : null,
        image: data.image,
      }
    },

    async getUser(id) {
      console.log('[CUSTOM_ADAPTER] getUser:', id)
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single()

      if (error) {
        console.error('[CUSTOM_ADAPTER] getUser error:', error)
        return null
      }

      console.log('[CUSTOM_ADAPTER] getUser success:', data)
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        emailVerified: data.emailVerified ? new Date(data.emailVerified) : null,
        image: data.image,
      }
    },

    async getUserByEmail(email) {
      console.log('[CUSTOM_ADAPTER] getUserByEmail:', email)
      const { data, error } = await supabase.from('users').select('*').eq('email', email).single()

      if (error) {
        console.error('[CUSTOM_ADAPTER] getUserByEmail error:', error)
        return null
      }

      console.log('[CUSTOM_ADAPTER] getUserByEmail success:', data)
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        emailVerified: data.emailVerified ? new Date(data.emailVerified) : null,
        image: data.image,
      }
    },

    async getUserByAccount({ providerAccountId, provider }) {
      console.log('[CUSTOM_ADAPTER] getUserByAccount:', { providerAccountId, provider })

      const { data, error } = await supabase
        .from('accounts')
        .select(
          `
          users (
            id,
            name,
            email,
            emailVerified,
            image
          )
        `
        )
        .eq('providerAccountId', providerAccountId)
        .eq('provider', provider)
        .single()

      if (error) {
        console.error('[CUSTOM_ADAPTER] getUserByAccount error:', error)
        return null
      }

      if (!data?.users) {
        console.log('[CUSTOM_ADAPTER] getUserByAccount: no user found')
        return null
      }

      const user = Array.isArray(data.users) ? data.users[0] : data.users
      console.log('[CUSTOM_ADAPTER] getUserByAccount success:', user)

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
        image: user.image,
      }
    },

    async updateUser(user) {
      console.log('[CUSTOM_ADAPTER] updateUser:', user)
      const { data, error } = await supabase
        .from('users')
        .update({
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified?.toISOString(),
          image: user.image,
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('[CUSTOM_ADAPTER] updateUser error:', error)
        throw new Error(`Error updating user: ${error.message}`)
      }

      console.log('[CUSTOM_ADAPTER] updateUser success:', data)
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        emailVerified: data.emailVerified ? new Date(data.emailVerified) : null,
        image: data.image,
      }
    },

    async deleteUser(userId) {
      console.log('[CUSTOM_ADAPTER] deleteUser:', userId)
      const { error } = await supabase.from('users').delete().eq('id', userId)

      if (error) {
        console.error('[CUSTOM_ADAPTER] deleteUser error:', error)
        throw new Error(`Error deleting user: ${error.message}`)
      }

      console.log('[CUSTOM_ADAPTER] deleteUser success')
    },

    async linkAccount(account) {
      console.log('[CUSTOM_ADAPTER] linkAccount:', account)
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          id: crypto.randomUUID(),
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        })
        .select()
        .single()

      if (error) {
        console.error('[CUSTOM_ADAPTER] linkAccount error:', error)
        throw new Error(`Error linking account: ${error.message}`)
      }

      console.log('[CUSTOM_ADAPTER] linkAccount success:', data)
      return {
        id: data.id,
        userId: data.userId,
        type: data.type,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        refresh_token: data.refresh_token,
        access_token: data.access_token,
        expires_at: data.expires_at,
        token_type: data.token_type,
        scope: data.scope,
        id_token: data.id_token,
        session_state: data.session_state,
      }
    },

    async unlinkAccount({ providerAccountId, provider }) {
      console.log('[CUSTOM_ADAPTER] unlinkAccount:', { providerAccountId, provider })
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('providerAccountId', providerAccountId)
        .eq('provider', provider)

      if (error) {
        console.error('[CUSTOM_ADAPTER] unlinkAccount error:', error)
        throw new Error(`Error unlinking account: ${error.message}`)
      }

      console.log('[CUSTOM_ADAPTER] unlinkAccount success')
    },

    async createSession({ sessionToken, userId, expires }) {
      console.log('[CUSTOM_ADAPTER] createSession:', { sessionToken, userId, expires })
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          id: crypto.randomUUID(),
          sessionToken,
          userId,
          expires: expires.toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('[CUSTOM_ADAPTER] createSession error:', error)
        throw new Error(`Error creating session: ${error.message}`)
      }

      console.log('[CUSTOM_ADAPTER] createSession success:', data)
      return {
        id: data.id,
        sessionToken: data.sessionToken,
        userId: data.userId,
        expires: new Date(data.expires),
      }
    },

    async getSessionAndUser(sessionToken) {
      console.log('[CUSTOM_ADAPTER] getSessionAndUser:', sessionToken)
      const { data, error } = await supabase
        .from('sessions')
        .select(
          `
          *,
          users (
            id,
            name,
            email,
            emailVerified,
            image
          )
        `
        )
        .eq('sessionToken', sessionToken)
        .single()

      if (error) {
        console.error('[CUSTOM_ADAPTER] getSessionAndUser error:', error)
        return null
      }

      if (!data?.users) {
        console.log('[CUSTOM_ADAPTER] getSessionAndUser: no user found')
        return null
      }

      const user = Array.isArray(data.users) ? data.users[0] : data.users
      console.log('[CUSTOM_ADAPTER] getSessionAndUser success:', { session: data, user })

      return {
        session: {
          id: data.id,
          sessionToken: data.sessionToken,
          userId: data.userId,
          expires: new Date(data.expires),
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
          image: user.image,
        },
      }
    },

    async updateSession({ sessionToken, ...session }) {
      console.log('[CUSTOM_ADAPTER] updateSession:', { sessionToken, session })
      const { data, error } = await supabase
        .from('sessions')
        .update({
          expires: session.expires?.toISOString(),
        })
        .eq('sessionToken', sessionToken)
        .select()
        .single()

      if (error) {
        console.error('[CUSTOM_ADAPTER] updateSession error:', error)
        throw new Error(`Error updating session: ${error.message}`)
      }

      console.log('[CUSTOM_ADAPTER] updateSession success:', data)
      return {
        id: data.id,
        sessionToken: data.sessionToken,
        userId: data.userId,
        expires: new Date(data.expires),
      }
    },

    async deleteSession(sessionToken) {
      console.log('[CUSTOM_ADAPTER] deleteSession:', sessionToken)
      const { error } = await supabase.from('sessions').delete().eq('sessionToken', sessionToken)

      if (error) {
        console.error('[CUSTOM_ADAPTER] deleteSession error:', error)
        throw new Error(`Error deleting session: ${error.message}`)
      }

      console.log('[CUSTOM_ADAPTER] deleteSession success')
    },

    async createVerificationToken({ identifier, expires, token }) {
      console.log('[CUSTOM_ADAPTER] createVerificationToken:', { identifier, expires, token })
      const { data, error } = await supabase
        .from('verification_tokens')
        .insert({
          identifier,
          token,
          expires: expires.toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('[CUSTOM_ADAPTER] createVerificationToken error:', error)
        throw new Error(`Error creating verification token: ${error.message}`)
      }

      console.log('[CUSTOM_ADAPTER] createVerificationToken success:', data)
      return {
        identifier: data.identifier,
        token: data.token,
        expires: new Date(data.expires),
      }
    },

    async useVerificationToken({ identifier, token }) {
      console.log('[CUSTOM_ADAPTER] useVerificationToken:', { identifier, token })
      const { data, error } = await supabase
        .from('verification_tokens')
        .delete()
        .eq('identifier', identifier)
        .eq('token', token)
        .select()
        .single()

      if (error) {
        console.error('[CUSTOM_ADAPTER] useVerificationToken error:', error)
        return null
      }

      console.log('[CUSTOM_ADAPTER] useVerificationToken success:', data)
      return {
        identifier: data.identifier,
        token: data.token,
        expires: new Date(data.expires),
      }
    },
  }
}

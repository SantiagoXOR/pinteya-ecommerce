// =====================================================
// CUSTOM NEXTAUTH.JS ADAPTER FOR SUPABASE
// Descripción: Adaptador personalizado para NextAuth.js con Supabase
// Basado en: NextAuth.js Adapter interface y documentación oficial
// =====================================================

import type { Adapter } from 'next-auth/adapters'
import { createAdminClient } from '@/lib/integrations/supabase/server'

export function CustomSupabaseAdapter(): Adapter {
  const supabase = createAdminClient()

  return {
    async createUser(user) {
      try {
        console.log('[ADAPTER] Creating user:', user)

        const userId = user.id || crypto.randomUUID()
        const { data, error } = await supabase
          .from('users')
          .insert({
            id: userId,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
          })
          .select()
          .single()

        if (error) {
          console.error('[ADAPTER] Error creating user:', error)
          throw error
        }

        console.log('[ADAPTER] User created successfully:', data)
        return data
      } catch (error) {
        console.error('[ADAPTER] Exception in createUser:', error)
        throw error
      }
    },

    async getUser(id) {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single()

      if (error) return null
      return data
    },

    async getUserByEmail(email) {
      try {
        console.log('[ADAPTER] Getting user by email:', email)
        const { data, error } = await supabase.from('users').select('*').eq('email', email).single()

        if (error) {
          console.log('[ADAPTER] No user found by email:', error.message)
          return null
        }
        console.log('[ADAPTER] User found by email:', data)
        return data
      } catch (error) {
        console.error('[ADAPTER] Exception in getUserByEmail:', error)
        return null
      }
    },

    async getUserByAccount({ providerAccountId, provider }) {
      try {
        console.log('[ADAPTER] Getting user by account:', { providerAccountId, provider })

        // Buscar la cuenta primero
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('userId')
          .eq('provider', provider)
          .eq('providerAccountId', providerAccountId)
          .single()

        if (accountError || !account) {
          console.log('[ADAPTER] No account found:', accountError?.message)
          return null
        }

        // Luego buscar el usuario
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', account.userId)
          .single()

        if (userError) {
          console.log('[ADAPTER] No user found for account:', userError.message)
          return null
        }

        console.log('[ADAPTER] User found by account:', user)
        return user
      } catch (error) {
        console.error('[ADAPTER] Exception in getUserByAccount:', error)
        return null
      }
    },

    async updateUser(user) {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async deleteUser(userId) {
      const { error } = await supabase.from('users').delete().eq('id', userId)

      if (error) throw error
    },

    async linkAccount(account) {
      try {
        console.log('[ADAPTER] Linking account:', account)
        const { data, error } = await supabase
          .from('accounts')
          .insert({
            id: crypto.randomUUID(),
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
            oauth_token_secret: account.oauth_token_secret,
            oauth_token: account.oauth_token,
            userId: account.userId,
          })
          .select()
          .single()

        if (error) {
          console.error('[ADAPTER] Error linking account:', error)
          throw error
        }

        console.log('[ADAPTER] Account linked successfully:', data)
        return data
      } catch (error) {
        console.error('[ADAPTER] Exception in linkAccount:', error)
        throw error
      }
    },

    async unlinkAccount({ providerAccountId, provider }) {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('provider', provider)
        .eq('providerAccountId', providerAccountId)

      if (error) throw error
    },

    async createSession({ sessionToken, userId, expires }) {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          id: crypto.randomUUID(),
          sessionToken,
          userId,
          expires,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },

    async getSessionAndUser(sessionToken) {
      const { data, error } = await supabase
        .from('sessions')
        .select(
          `
          *,
          user:userId (*)
        `
        )
        .eq('sessionToken', sessionToken)
        .single()

      if (error) return null
      if (!data?.user) return null

      return {
        session: {
          sessionToken: data.sessionToken,
          userId: data.userId,
          expires: data.expires,
        },
        user: data.user,
      }
    },

    async updateSession({ sessionToken, ...session }) {
      const { data, error } = await supabase
        .from('sessions')
        .update(session)
        .eq('sessionToken', sessionToken)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async deleteSession(sessionToken) {
      const { error } = await supabase.from('sessions').delete().eq('sessionToken', sessionToken)

      if (error) throw error
    },

    async createVerificationToken({ identifier, expires, token }) {
      const { data, error } = await supabase
        .from('verification_tokens')
        .insert({
          identifier,
          expires,
          token,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },

    async useVerificationToken({ identifier, token }) {
      const { data, error } = await supabase
        .from('verification_tokens')
        .delete()
        .eq('identifier', identifier)
        .eq('token', token)
        .select()
        .single()

      if (error) return null
      return data
    },
  }
}

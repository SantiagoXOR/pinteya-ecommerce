// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - API DE AVATAR DE USUARIO
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { auth } from '@/lib/auth/config'
import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase Storage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseStorage = createClient(supabaseUrl, supabaseServiceKey)

// Configuración de archivos
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const AVATAR_BUCKET = 'avatars'

// ===================================
// POST - Subir avatar
// ===================================
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Usuario no autenticado' }, { status: 401 })
    }

    const userId = session.user.id

    // Obtener archivo del FormData
    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG y WebP.',
        },
        { status: 400 }
      )
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'El archivo es demasiado grande. El tamaño máximo es 5MB.',
        },
        { status: 400 }
      )
    }

    // Generar nombre único para el archivo
    const fileExtension = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExtension}`
    const filePath = `avatars/${fileName}`

    // Convertir archivo a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Eliminar avatar anterior si existe
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('avatar_url')
      .eq('clerk_id', userId)
      .single()

    if (userData?.avatar_url) {
      // Extraer el path del avatar anterior
      const oldPath = userData.avatar_url.split('/').slice(-2).join('/')
      await supabaseStorage.storage.from(AVATAR_BUCKET).remove([oldPath])
    }

    // Subir nuevo archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseStorage.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Error al subir archivo:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Error al subir el archivo' },
        { status: 500 }
      )
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabaseStorage.storage.from(AVATAR_BUCKET).getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl

    // Actualizar URL del avatar en la base de datos
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error al actualizar usuario:', updateError)
      // Intentar eliminar el archivo subido si falla la actualización
      await supabaseStorage.storage.from(AVATAR_BUCKET).remove([filePath])

      return NextResponse.json(
        { success: false, error: 'Error al actualizar el perfil' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      avatar_url: avatarUrl,
      user: updatedUser,
      message: 'Avatar subido correctamente',
    })
  } catch (error) {
    console.error('Error en POST /api/user/avatar:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// ===================================
// DELETE - Eliminar avatar
// ===================================
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Usuario no autenticado' }, { status: 401 })
    }

    const userId = session.user.id

    // Obtener datos del usuario
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('avatar_url')
      .eq('clerk_id', userId)
      .single()

    if (userError) {
      console.error('Error al obtener usuario:', userError)
      return NextResponse.json(
        { success: false, error: 'Error al obtener datos del usuario' },
        { status: 500 }
      )
    }

    if (!userData?.avatar_url) {
      return NextResponse.json(
        { success: false, error: 'No hay avatar para eliminar' },
        { status: 400 }
      )
    }

    // Extraer el path del archivo del avatar
    const avatarPath = userData.avatar_url.split('/').slice(-2).join('/')

    // Eliminar archivo de Supabase Storage
    const { error: deleteError } = await supabaseStorage.storage
      .from(AVATAR_BUCKET)
      .remove([avatarPath])

    if (deleteError) {
      console.error('Error al eliminar archivo:', deleteError)
      // Continuar con la actualización de la base de datos aunque falle la eliminación del archivo
    }

    // Actualizar base de datos para remover la URL del avatar
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error al actualizar usuario:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el perfil' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Avatar eliminado correctamente',
    })
  } catch (error) {
    console.error('Error en DELETE /api/user/avatar:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

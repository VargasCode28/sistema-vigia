import type { H3Event } from 'h3'
import { useSession } from 'h3'

export function useAuthSession(event: H3Event) {
  const config = useRuntimeConfig()
  const password = config.sessionPassword ?? process.env.NUXT_SESSION_PASSWORD
  const normalizedPassword = typeof password === 'string' ? password.trim() : ''

  if (!normalizedPassword) {
    throw new Error('La variable de entorno NUXT_SESSION_PASSWORD no está definida o está vacía. Es necesaria para encriptar las sesiones.')
  }

  if (normalizedPassword.length < 32) {
    throw new Error('NUXT_SESSION_PASSWORD debe tener al menos 32 caracteres para proteger las sesiones correctamente.')
  }

  return useSession(event, {
    password,
    name: 'vigia_session',
    maxAge: 60 * 60 * 8, // 8 horas
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  })
}
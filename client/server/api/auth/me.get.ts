import { useAuthSession } from "~~/server/utils/session"

export default defineEventHandler(async (event) => {
  try {
    console.log('📌 me.get.ts — request received')
    const session = await useAuthSession(event)
    console.log('📌 me.get.ts — session data:', JSON.stringify(session?.data))

    if (!session.data?.userId) {
      console.warn('⚠️ me.get.ts — no session userId')
      throw createError({ statusCode: 401, statusMessage: 'No hay sesión activa.' })
    }

    return {
      id: session.data.userId,
      email: session.data.email,
      name: session.data.name,
      role: session.data.role
    }
  } catch (err: any) {
    console.error('❌ me.get.ts — error:', err?.message || err, err?.stack)
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Error interno en /api/auth/me' })
  }
})
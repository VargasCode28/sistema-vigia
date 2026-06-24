// server/api/usuarios/eliminar.ts
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL || '')

export default defineEventHandler(async (event) => {
  try {
    // 1. Validamos que sea una petición DELETE o POST
    const body = await readBody(event)
    const { id } = body

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Falta el ID del usuario' })
    }

    // 2. Ejecutamos el DELETE real en tu tabla
    // NOTA: Asegúrate de que tu columna se llame "id"
    await sql`
      DELETE FROM usuarios 
      WHERE id = ${id}
    `

    return { success: true, message: 'Usuario eliminado permanentemente de PostgreSQL' }

  } catch (error) {
    console.error('Error al eliminar en Postgres:', error)
    throw createError({ statusCode: 500, statusMessage: 'No se pudo eliminar el usuario' })
  }
})
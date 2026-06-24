// server/api/usuarios/editar.ts
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL || '')

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { id, nombre, email, rol } = body

    if (!id || !nombre || !email || !rol) {
      throw createError({ statusCode: 400, statusMessage: 'Faltan campos requeridos para la edición' })
    }

    // El UPDATE real en PostgreSQL
    await sql`
      UPDATE usuarios 
      SET nombre = ${nombre}, email = ${email}, rol = ${rol}
      WHERE id = ${id}
    `

    return { success: true, message: 'Usuario actualizado con éxito' }

  } catch (error) {
    console.error('Error al editar en Postgres:', error)
    throw createError({ statusCode: 500, statusMessage: 'No se pudo actualizar el usuario' })
  }
})
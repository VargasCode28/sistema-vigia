import { pool } from '~~/server/utils/db/pg'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { nombreCompleto, email, rol, activo, password } = body

  // Verificar email duplicado
  const { rows: existe } = await pool.query(
    'SELECT id FROM usuarios WHERE email = $1',
    [email]
  )
  if (existe.length > 0) {
    throw createError({ statusCode: 409, statusMessage: 'Ya existe un usuario con ese email.' })
  }

  // Obtener rol_id desde la tabla roles
  const { rows: roles } = await pool.query(
    'SELECT id FROM roles WHERE nombre = $1',
    [rol]
  )
  if (roles.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Rol no válido.' })
  }
  const rolId = roles[0].id

  // Insertar usuario
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre_completo, email, password, rol_id, activo)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, nombre_completo, email, activo`,
    [nombreCompleto, email, password, rolId, activo]
  )

  return {
    success: true,
    user: {
      id:             rows[0].id,
      nombreCompleto: rows[0].nombre_completo,
      email:          rows[0].email,
      rol,
      activo:         rows[0].activo,
    }
  }
})
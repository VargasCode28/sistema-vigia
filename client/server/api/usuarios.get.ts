import { pool } from '~~/server/utils/db/pg'

export default defineEventHandler(async () => {
  const { rows } = await pool.query(`
    SELECT u.id, u.nombre_completo, u.email, r.nombre AS rol, u.activo
    FROM usuarios u
    INNER JOIN roles r ON u.rol_id = r.id
    ORDER BY u.id
  `)
  return rows
})

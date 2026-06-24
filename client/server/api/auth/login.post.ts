

// import { pool } from "~~/server/utils/db/pg"

// export default defineEventHandler(async (event) => {

//   try {
//     const body = await readBody(event)
//     const { email, password } = body

//     console.log('📌 PASO 1 — Body recibido:', { email, password })

//     const ping = await pool.query('SELECT 1 AS ok')
//     console.log('📌 PASO 2 — Pool responde:', ping.rows[0])

//     const { rows } = await pool.query(
//       `SELECT u.id, u.nombre_completo, u.email, r.nombre as rol_nombre, u.activo 
//       FROM usuarios u
//       INNER JOIN roles r ON u.rol_id = r.id
//       WHERE u.email = $1 AND u.password = $2`,
//       [email, password]
//     )
//     console.log('📌 PASO 3 — Filas encontradas:', rows.length)

//     if (rows.length === 0) {
//       throw createError({ statusCode: 401, statusMessage: 'El correo o la contraseña son incorrectos.' })
//     }

//     const usuarioEncontrado = rows[0]
//     console.log('📌 PASO 4 — Usuario:', usuarioEncontrado)

//     if (usuarioEncontrado.activo === false) {
//       throw createError({ statusCode: 403, statusMessage: 'Acceso Denegado. Este usuario está inactivo.' })
//     }

//     const { rows: tablaExiste } = await pool.query(`
//       SELECT EXISTS (
//         SELECT FROM information_schema.tables 
//         WHERE table_name = 'historial_accesos'
//       ) AS existe
//     `)
//     console.log('📌 PASO 5 — historial_accesos existe:', tablaExiste[0].existe)

//     if (tablaExiste[0].existe) {
//       await pool.query(
//         'INSERT INTO historial_accesos (usuario_id) VALUES ($1)',
//         [usuarioEncontrado.id]
//       )
//       console.log('📌 PASO 6 — Historial insertado')
//     }

//     console.log('📌 PASO 7 — Retornando respuesta exitosa')
//     return {
//       success: true,
//       user: {
//         email: usuarioEncontrado.email,
//         role:  usuarioEncontrado.rol_nombre,
//         name:  usuarioEncontrado.nombre_completo
        
//       }
//     }

//   } catch (err: any) {
//     if (err.statusCode) throw err
//     console.error('❌ Error inesperado:', err.message, err.stack)
//     throw createError({ statusCode: 500, statusMessage: 'Error al conectar con la base de datos.' })
//   }
// })






























import { pool } from "~~/server/utils/db/pg"
import { useAuthSession } from "~~/server/utils/session"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password } = body

    const { rows: ping } = await pool.query('SELECT 1 AS ok')
    console.log('📌 login.post.ts — Ping DB:', ping[0])

    const { rows } = await pool.query(
      `SELECT u.id, u.nombre_completo, u.email, r.nombre as rol_nombre, u.activo 
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.email = $1 AND u.password = $2`,
      [email, password]
    )

    if (rows.length === 0) {
      throw createError({ statusCode: 401, statusMessage: 'El correo o la contraseña son incorrectos.' })
    }

    const usuarioEncontrado = rows[0]

    if (usuarioEncontrado.activo === false) {
      throw createError({ statusCode: 403, statusMessage: 'Acceso Denegado. Este usuario está inactivo.' })
    }

    const { rows: tablaExiste } = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'historial_accesos'
      ) AS existe
    `)

    if (tablaExiste[0].existe) {
      await pool.query(
        'INSERT INTO historial_accesos (usuario_id) VALUES ($1)',
        [usuarioEncontrado.id]
      )
    }

    const session = await useAuthSession(event)
    console.log('📌 login.post.ts — session before update:', JSON.stringify(session?.data))
    await session.update({
      userId: usuarioEncontrado.id,
      email: usuarioEncontrado.email,
      name: usuarioEncontrado.nombre_completo,
      role: usuarioEncontrado.rol_nombre
    })
    console.log('📌 login.post.ts — session updated')

    return {
      success: true,
      user: {
        email: usuarioEncontrado.email,
        role: usuarioEncontrado.rol_nombre,
        name: usuarioEncontrado.nombre_completo
      }
    }

  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('❌ Error inesperado en login.post.ts:', err.message, err.stack)
    const sessionError = err.message?.includes('NUXT_SESSION_PASSWORD') || err.message?.includes('Password string too short') || err.message?.includes('Empty password')
    if (sessionError) {
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
    throw createError({ statusCode: 500, statusMessage: 'Error al conectar con la base de datos.' })
  }
})

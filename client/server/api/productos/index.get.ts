export default defineEventHandler(async () => {
  const productos = await db.collection('productos')
    .find({ activo: true }).toArray()
  return productos
})


// import { MongoClient } from 'mongodb'
// const client = new MongoClient(process.env.MONGODB_URI!)




// export const db = client.db('vigia_db')



import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error('Por favor, define la variable MONGODB_URI en tu archivo .env')
}

const client = new MongoClient(uri)

let conexionPromesa: Promise<MongoClient> | null = null

export async function conectarDB() {
  if (!conexionPromesa) {
    conexionPromesa = client.connect()
  }

  
  
  const clienteConectado = await conexionPromesa
  

  

  
  // Retornamos la base de datos ya lista para usar
  return clienteConectado.db('vigia_db')
}
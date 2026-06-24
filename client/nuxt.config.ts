
export default defineNuxtConfig({
  runtimeConfig: {
    sessionPassword: process.env.NUXT_SESSION_PASSWORD
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },




//Forzamos al servidor de desarrollo del backend a usar el puerto 3001
//Falta conectar la coleccion de mongodb compac  al sensor 32ESMP

devServer: {
  port: 3001
},
})

// nitro: {
//   srcDir: '.'
// },


// routeRules: {
//   '/api/**': { cors: true}  
  

  
  //Nuxt maneja los CORS  correctamente

  

// }


// })



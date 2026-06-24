
<script setup lang="ts">
import { ref, reactive } from 'vue'

interface LoginResponse {
  success: boolean
  user?: {
    email: string
    role: 'admin' | 'recepcion' | 'housekeeping' | 'superadmin'
    name: string
  }
}

const credentials = reactive({
  
  email: '',
  password: ''
})

const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      body: {
        email: credentials.email,
        password: credentials.password
      }
    })

    console.log('[Frontend VIGÍA] Respuesta completa del servidor Nitro:', response)

    if (response && response.success && response.user) {
      const role = response.user.role
      console.log(`[Frontend VIGÍA] Login exitoso. Rol detectado: ${role}`)

      if (role === 'admin') {
        await navigateTo('/admin')
      } else if (role === 'recepcion') {
        await navigateTo('/recepcion')
      } else if (role === 'housekeeping') {
        await navigateTo('/housekeeping')
      } else if (role === 'superadmin') {
        await navigateTo('/superadmin')
      } else {
        errorMessage.value = `Rol no reconocido: ${role}`
      }
    } else {
      errorMessage.value = 'Estructura de respuesta inválida del servidor.'
    }

  } catch (error: any) {
    console.error('[Frontend VIGÍA] Error detectado en la petición:', error)
    errorMessage.value = error.data?.statusMessage || 'Error de conexión con el servidor.'
  } finally {
    isLoading.value = false
  }
}
</script>



<template>
  <div class="root">

    <!-- Columna izquierda -->
    <div class="left">
      <div class="left-inner">


                            <!--AQUI VA EL LOGO NUEVO -->
                            
        <div class="wordmark">
        <img src="/logo_VIGIA.jpeg" alt="VIGIA" class="wordmark-logo"/> 

        </div>



        <div class="left-body">


          <h1>Sistema de gestión<br>hotelera operativa</h1>
          <p>Control unificado de habitaciones, sensores IoT, minibar automatizado y personal en tiempo real.</p>

        
        </div>

      


    
        <p class="left-footer">© 2026 VIGÍA · Acceso restringido al personal autorizado</p>
      </div>
    </div> 

    <div class="right">
      <div class="form-wrap">

        <div class="form-head">
          <h2>Acceso al panel</h2>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        <form @submit.prevent="handleLogin">

          <div class="field">
            <label for="email">Correo electrónico</label>
            <div class="input-box">
              <svg class="inp-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              <input
                type="email"
                id="email"
                v-model="credentials.email"
                required
                autocomplete="email"
                placeholder="correo@vigia.com"
              />
            </div>
          </div>

          <div class="field">
            <label for="password">Contraseña</label>
            <div class="input-box">
              <svg class="inp-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type="password"
                id="password"
                v-model="credentials.password"
                required
                autocomplete="current-password"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Transition name="err">
            <div v-if="errorMessage" class="error-box" role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ errorMessage }}
            </div>
          </Transition>

          <button type="submit" class="btn-login" :disabled="isLoading">
            <svg v-if="isLoading" class="spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            {{ isLoading ? 'Autenticando...' : 'Ingresar al sistema' }}
          </button>

        </form>

        <p class="form-note">
          Sistema de uso interno. Si no tienes acceso, comunícate con el administrador.
          <br>
          
          admin@vigia.com / 1234 / SuperAdmin <br>
          carlos@gmail.com /123456 /Recepcion <br>
          benjamin@gmail.com /123456 / Admin <br>
          leandro@gmail.com /123456 / Housekeeping

          
        </p>
        
      
    

      </div>
    </div>

  </div>
</template>

<style scoped>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.root {
  display: flex;
  /* width: 100vw; */
  width: 100%;  
  height: 100vh; 

  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
}

/* Izquierda */
.left {
  width: 46%;
  background: #0c0c18;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.left::before {
  content: '';
  position: absolute;
  top: -120px; left: -120px;
  width: 5080px; height: 5080px;
  background: radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%);
  pointer-events: none;
}

.left::after {
  content: '';
  position: absolute;
  bottom: -80px; right: -80px;
  width: 340px; height: 340px;
  background: radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 70%);
  pointer-events: none;
}

.left-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 40px 28px;
}

.wordmark {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: rgba(255,255,255,0.9);
  text-transform: uppercase;
}

.wordmark-icon {
  width: 34px; height: 34px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.04);
}


/* AQUI WORDMARK-LOGO*/

.wordmark-logo {
  height: 75px;
  border-radius: 10%;
  width: auto;
  object-fit: contain;
}




.left-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-bottom: 40%;
}

.left-body h1 {
  font-size: 35px;
  font-weight: 600;
  line-height: 1.1;
  color: #fff;
  margin-bottom: 16px;
  letter-spacing: -0.01em;
}

.left-body p {
  font-size: 12px;
  line-height: 1.65;
  color: rgb(255, 255, 255);
  margin-bottom: 36px;
  max-width: 340px;
}

.feature-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgb(255, 252, 252);
  line-height: 1.4;
}

.left-footer {
  font-size: 10px;
  color: rgb(255, 255, 255);
}

/* Derecha */
.right {
  flex: 1;
  background: #f8f8f7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
}

.form-wrap {
  width: 100%;
  max-width: 380px;
}

.form-head {
  margin-bottom: 32px;
}

.form-head h2 {
  font-size: 22px;
  font-weight: 600;
  color: #0f0f14;
  margin-bottom: 6px;
  letter-spacing: -0.01em;
}

.form-head p {
  font-size: 13px;
  color: #888;
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 12px;
  font-weight: 500;
  color: #444;
}

.input-box {
  position: relative;
  display: flex;
  align-items: center;
}

.inp-icon {
  position: absolute;
  left: 11px;
  color: #bbb;
  pointer-events: none;
}

.input-box input {
  width: 100%;
  padding: 10px 12px 10px 34px;
  font-size: 13px;
  color: #111;
  background: #fff;
  border: 1px solid #e0e0de;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input-box input::placeholder { color: #ccc; }

.input-box input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79,70,229,0.09);
}

.error-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px 12px;
  line-height: 1.45;
}

.err-enter-active, .err-leave-active { transition: opacity 0.18s, transform 0.18s; }
.err-enter-from, .err-leave-to { opacity: 0; transform: translateY(-3px); }

.btn-login {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px;
  margin-top: 4px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #fff;
  background: #0c0c18;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}

.btn-login:hover:not(:disabled) { background: #1a1a32; }
.btn-login:disabled { opacity: 0.55; cursor: not-allowed; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.75s linear infinite; flex-shrink: 0; }

.form-note {
  margin-top: 24px;
  font-size: 11.5px;
  color: #aaa;
  line-height: 1.5;
  text-align: center;
}

@media (max-width: 720px) {
  .left { display: none; }
  .right { background: #fff; }
}








.left {
  background-image: url('/Hotel-minibar.jpg');
  background-size: cover;
  background-position: center;
}


.left::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 10, 0.73);


  z-index: 0;
}









:global(html, body, #__nuxt) {
  margin: 0;
  padding: 0;
  overflow: hidden;
}











</style>
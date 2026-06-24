<!-- <script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface ProductoFrigobar {
  id: string
  nombre: string
  pesoReferencia: number
  cantidadActual: number
  cantidadMaxima: number
}

interface Habitacion {
  id: number
  numero: string
  piso: number
  estadoLimpieza: 'Sucia' | 'Limpiando' | 'Limpia'
  alertaReposicion: boolean
  origenRecepcion: boolean
  productos: ProductoFrigobar[]
}

const usuarioActivo = ref({
  name: 'Cargando...',
  email: '',
  role: '',
  iniciales: 'U'
})

const cargarSesionUsuario = () => {

  const sesionGuardada = localStorage.getItem('vigia_user')
  
  if (sesionGuardada) {
    const datos = JSON.parse(sesionGuardada)
    usuarioActivo.value = {
      name: datos.name,
      email: datos.email,
      role: datos.role,
      iniciales: datos.name ? datos.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'
    }
  } else {
    usuarioActivo.value = {
      name: 'Marta Colque Aravena', 
      email: 'm.colque@hotelvigia.cl',
      role: 'housekeeping', 
      iniciales: 'MC'
    }
  }
}

onMounted(() => {
  cargarSesionUsuario()
})

const habitaciones = ref<Habitacion[]>([
  {
    id: 1,
    numero: '101',
    piso: 1,
    estadoLimpieza: 'Limpiando',
    alertaReposicion: true,
    origenRecepcion: true,
    productos: [
      { id: 'p1', nombre: 'Agua Mineral Sin Gas', pesoReferencia: 500, cantidadActual: 1, cantidadMaxima: 2 },
      { id: 'p2', nombre: 'Cerveza Club Premium', pesoReferencia: 350, cantidadActual: 2, cantidadMaxima: 2 },
      { id: 'p3', nombre: 'Gaseosa Coca-Cola 350ml', pesoReferencia: 350, cantidadActual: 0, cantidadMaxima: 2 }
    ]
  },
  {
    id: 3,
    numero: '201',
    piso: 2,
    estadoLimpieza: 'Sucia',
    alertaReposicion: true,
    origenRecepcion: true,
    productos: [
      { id: 'p1', nombre: 'Agua Mineral Sin Gas', pesoReferencia: 500, cantidadActual: 0, cantidadMaxima: 2 },
      { id: 'p2', nombre: 'Cerveza Club Premium', pesoReferencia: 350, cantidadActual: 1, cantidadMaxima: 2 },
      { id: 'p3', nombre: 'Gaseosa Coca-Cola 350ml', pesoReferencia: 350, cantidadActual: 2, cantidadMaxima: 2 }
    ]
  }
])

const menuPerfilAbierto = ref(false)
const habitacionSeleccionada = ref<Habitacion | null>(null)
const guardando = ref(false)

const habitacionesAsignadas = computed(() => {
  return habitaciones.value.filter(h => h.origenRecepcion === true)
})

const toggleMenuPerfil = () => {
  menuPerfilAbierto.value = !menuPerfilAbierto.value
}

const seleccionarHabitacion = (hab: Habitacion) => {
  habitacionSeleccionada.value = JSON.parse(JSON.stringify(hab))
}

const reponerProducto = (prodId: string) => {
  if (!habitacionSeleccionada.value) return
  const prod = habitacionSeleccionada.value.productos.find(p => p.id === prodId)
  if (prod && prod.cantidadActual < prod.cantidadMaxima) {
    prod.cantidadActual++
  }
}

const finalizarRevision = async () => {
  if (!habitacionSeleccionada.value) return
  guardando.value = true
  
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const tieneFaltantes = habitacionSeleccionada.value.productos.some(p => p.cantidadActual < p.cantidadMaxima)
  
  const index = habitaciones.value.findIndex(h => h.id === habitacionSeleccionada.value!.id)
  if (index !== -1) {
    habitaciones.value[index] = {
      ...habitacionSeleccionada.value,
      alertaReposicion: tieneFaltantes,
      estadoLimpieza: 'Limpia',
      origenRecepcion: false
    }
  }
  
  guardando.value = false
  habitacionSeleccionada.value = null
}

const cerrarSesion = () => {
  localStorage.removeItem('vigia_user')
  navigateTo('/')

}
</script> -->

















<script setup lang="ts">
import { ref, computed } from 'vue'

interface ProductoFrigobar {
  id: string
  nombre: string
  pesoReferencia: number
  cantidadActual: number
  cantidadMaxima: number
}

interface Habitacion {
  id: number
  numero: string
  piso: number
  estadoLimpieza: 'Sucia' | 'Limpiando' | 'Limpia'
  alertaReposicion: boolean
  origenRecepcion: boolean
  productos: ProductoFrigobar[]
}

interface UsuarioSesion {
  id: number
  name: string
  email: string
  role: string
  iniciales: string
}

interface AuthMeResponse {
  id: number
  name: string
  email: string
  role: string
}

// 1. ESTADO DEL USUARIO AUTENTICADO (real, vía cookie de sesión httpOnly)
const usuarioActivo = ref<UsuarioSesion>({
  id: 0,
  name: 'Cargando...',
  email: '',
  role: '',
  iniciales: 'U'
})

const { data: datos, error: datosError } = await useAsyncData<AuthMeResponse>('auth-me', () => $fetch('/api/auth/me'))

if (datosError.value || !datos.value) {
  navigateTo('/')
} else {
  usuarioActivo.value = {
    id: datos.value.id,
    name: datos.value.name,
    email: datos.value.email,
    role: datos.value.role,
    iniciales: datos.value.name
      ? datos.value.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
      : 'U'
  }
}

// 2. ESTADO SIMULADO DE LAS HABITACIONES (sin cambios, fuera del alcance de esta corrección)
const habitaciones = ref<Habitacion[]>([
  {
    id: 1,
    numero: '101',
    piso: 1,
    estadoLimpieza: 'Limpiando',
    alertaReposicion: true,
    origenRecepcion: true,
    productos: [
      { id: 'p1', nombre: 'Agua Mineral Sin Gas', pesoReferencia: 500, cantidadActual: 1, cantidadMaxima: 2 },
      { id: 'p2', nombre: 'Cerveza Club Premium', pesoReferencia: 350, cantidadActual: 2, cantidadMaxima: 2 },
      { id: 'p3', nombre: 'Gaseosa Coca-Cola 350ml', pesoReferencia: 350, cantidadActual: 0, cantidadMaxima: 2 }
    ]
  },
  {
    id: 3,
    numero: '201',
    piso: 2,
    estadoLimpieza: 'Sucia',
    alertaReposicion: true,
    origenRecepcion: true,
    productos: [
      { id: 'p1', nombre: 'Agua Mineral Sin Gas', pesoReferencia: 500, cantidadActual: 0, cantidadMaxima: 2 },
      { id: 'p2', nombre: 'Cerveza Club Premium', pesoReferencia: 350, cantidadActual: 1, cantidadMaxima: 2 },
      { id: 'p3', nombre: 'Gaseosa Coca-Cola 350ml', pesoReferencia: 350, cantidadActual: 2, cantidadMaxima: 2 }
    ]
  }
])

const menuPerfilAbierto = ref(false)
const habitacionSeleccionada = ref<Habitacion | null>(null)
const guardando = ref(false)

const habitacionesAsignadas = computed(() => {
  return habitaciones.value.filter(h => h.origenRecepcion === true)
})

const toggleMenuPerfil = () => {
  menuPerfilAbierto.value = !menuPerfilAbierto.value
}

const seleccionarHabitacion = (hab: Habitacion) => {
  habitacionSeleccionada.value = JSON.parse(JSON.stringify(hab))
}

const reponerProducto = (prodId: string) => {
  if (!habitacionSeleccionada.value) return
  const prod = habitacionSeleccionada.value.productos.find(p => p.id === prodId)
  if (prod && prod.cantidadActual < prod.cantidadMaxima) {
    prod.cantidadActual++
  }
}

const finalizarRevision = async () => {
  if (!habitacionSeleccionada.value) return
  guardando.value = true

  await new Promise(resolve => setTimeout(resolve, 800))

  const tieneFaltantes = habitacionSeleccionada.value.productos.some(p => p.cantidadActual < p.cantidadMaxima)

  const index = habitaciones.value.findIndex(h => h.id === habitacionSeleccionada.value!.id)
  if (index !== -1) {
    habitaciones.value[index] = {
      ...habitacionSeleccionada.value,
      alertaReposicion: tieneFaltantes,
      estadoLimpieza: 'Limpia',
      origenRecepcion: false
    }
  }

  guardando.value = false
  habitacionSeleccionada.value = null
}

// 3. CIERRE DE SESIÓN REAL (limpia la cookie en el servidor)
const cerrarSesion = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
  } finally {
    await navigateTo('/')
  }
}
</script>










<template>
  <div class="superadmin-layout">
    <nav class="navbar">
      <div class="nav-left">
        <span class="logo-dot"></span>
        <span class="brand-name">VIGÍA</span>
        <span class="nav-separator">/</span>
        <div class="nav-links">
          <a href="#" class="nav-link active">Housekeeping</a>
          <a href="#" class="nav-link disabled">Incidencias</a>
        </div>
      </div>

      <div class="nav-right">
        <div class="live-status">
          <span class="pulse-dot"></span>
          <span>Recepcionado</span>
        </div>
        
        <div class="profile-container">
          <button @click="toggleMenuPerfil" class="avatar-btn">
            {{ usuarioActivo.iniciales }}
          </button>
          
          <div v-if="menuPerfilAbierto" class="profile-dropdown">
            <div class="dropdown-header">
              <p class="user-name">{{ usuarioActivo.name }}</p>
              <p class="user-email">{{ usuarioActivo.email }}</p>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-body">
              <span class="role-badge">{{ usuarioActivo.role }}</span>
              <a href="#" class="dropdown-item">Ajustes de Cuenta</a>
              <button @click="cerrarSesion" class="dropdown-item logout-btn">Cerrar Sesión</button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- CONTENEDOR PRINCIPAL -->
    <main class="workspace" @click="menuPerfilAbierto = false">
      <!-- COLUMNA IZQUIERDA -->
      <section class="sidebar">
        <div class="section-title">Cola de Revisión Actual</div>
        
        <div v-if="habitacionesAsignadas.length === 0" class="no-tasks">
          Sin órdenes pendientes de Recepción.
        </div>

        <div v-else class="list-container">
          <button 
            v-for="hab in habitacionesAsignadas" 
            :key="hab.id"
            class="list-row"
            :class="{ active: habitacionSeleccionada?.id === hab.id }"
            @click.stop="seleccionarHabitacion(hab)"
          >
            <span class="room-id">Hab {{ hab.numero }}</span>
            <div class="badges-row">
              <span v-if="hab.alertaReposicion" class="badge-reponer">Falta stock</span>
              <span class="status-tag" :class="hab.estadoLimpieza.toLowerCase()">{{ hab.estadoLimpieza }}</span>
            </div>
          </button>
        </div>
      </section>

      <!-- COLUMNA DERECHA -->
      <section class="content-area">
        <div v-if="habitacionSeleccionada" class="panel-flat">
          <div class="panel-header">
            <h2>Auditoría de Stock — Hab {{ habitacionSeleccionada.numero }}</h2>
            <span class="sensor-tag">Orden del Check-out</span>
          </div>

          <div class="table-flat">
            <div class="table-header">
              <span>Producto</span>
              <span class="text-right">Inventario Frigobar</span>
            </div>
            
            <div 
              v-for="prod in habitacionSeleccionada.productos" 
              :key="prod.id"
              class="table-row"
              :class="{ warning: prod.cantidadActual < prod.cantidadMaxima }"
            >
              <div class="item-info">
                <span class="item-name">{{ prod.nombre }}</span>
                <span class="item-sub">Umbral de peso: {{ prod.pesoReferencia }}g</span>
              </div>
              
              <div class="item-actions">
                <span class="qty-indicator">{{ prod.cantidadActual }} / {{ prod.cantidadMaxima }}</span>
                <button 
                  @click="reponerProducto(prod.id)"
                  :disabled="prod.cantidadActual === prod.cantidadMaxima || guardando"
                  class="btn-action"
                >
                  Reponer ítem
                </button>
              </div>
            </div>
          </div>

          <div class="panel-actions">
            <button @click="habitacionSeleccionada = null" class="btn-link" :disabled="guardando">
              Cerrar vista
            </button>
            <button @click="finalizarRevision" class="btn-solid" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Finalizar y Notificar a Recepción' }}
            </button>
          </div>
        </div>

        <div v-else class="empty-view">
          <p>Selecciona una orden de la cola de recepción para auditar el frigobar físico.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* ESTILO PREMIUM ULTRA-MINIMALISTA */
.superadmin-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 2rem 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #0f172a;
  background-color: #ffffff;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 2.5rem;
}

.nav-left, .nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-dot {
  width: 8px;
  height: 8px;
  background-color: #0f172a;
  border-radius: 50%;
}

.brand-name {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.nav-separator {
  color: #cbd5e1;
  font-size: 0.85rem;
}

.nav-links {
  display: flex;
  gap: 1.25rem;
}

.nav-link {
  font-size: 0.85rem;
  text-decoration: none;
  color: #64748b;
  transition: color 0.15s;
}

.nav-link.active {
  color: #0f172a;
  font-weight: 500;
}

.nav-link.disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.live-status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
  margin-right: 0.5rem;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background-color: #10b981;
  border-radius: 50%;
}

/* AVATAR Y DROPDOWN */
.profile-container {
  position: relative;
}

.avatar-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s;
}

.avatar-btn:hover {
  background-color: #e2e8f0;
}

.profile-dropdown {
  position: absolute;
  top: 42px;
  right: 0;
  width: 220px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 0.75rem;
  z-index: 100;
  animation: fadeIn 0.15s ease;
}

.dropdown-header {
  padding: 0.25rem 0.5rem 0.5rem 0.5rem;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0;
  text-transform: capitalize;
}

.user-email {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0.1rem 0 0 0;
}

.dropdown-divider {
  height: 1px;
  background-color: #f1f5f9;
  margin: 0.5rem 0;
}

.dropdown-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.role-badge {
  font-size: 0.7rem;
  background-color: #f1f5f9;
  color: #475569;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  align-self: flex-start;
  margin-bottom: 0.4rem;
  margin-left: 0.5rem;
  letter-spacing: 0.03em;
}

.dropdown-item {
  font-size: 0.8rem;
  color: #334155;
  text-decoration: none;
  padding: 0.4rem 0.5rem;
  border-radius: 4px;
  text-align: left;
  background: none;
  border: none;
  width: 100%;
  cursor: pointer;
  transition: background-color 0.1s;
}

.dropdown-item:hover {
  background-color: #f1f5f9;
}

.dropdown-item.logout-btn {
  color: #df4444;
}

.dropdown-item.logout-btn:hover {
  background-color: #fef2f2;
}

/* GRID GENERAL WORKSPACE */
.workspace {
  display: grid;
  grid-template-columns: 310px 1fr;
  gap: 3rem;
}

.section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 1rem;
  font-weight: 600;
}

.no-tasks {
  font-size: 0.85rem;
  color: #94a3b8;
  padding: 1rem 0.5rem;
  border: 1px dashed #e2e8f0;
  border-radius: 6px;
  text-align: center;
}

.list-container {
  display: flex;
  flex-direction: column;
}

.list-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 0.5rem;
  background: none;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  cursor: pointer;
  width: 100%;
}

.list-row:hover {
  background-color: #f8fafc;
}

.list-row.active {
  background-color: #f1f5f9;
  font-weight: 600;
}

.room-id {
  font-size: 0.9rem;
}

.badges-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-tag {
  font-size: 0.7rem;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
}
.status-tag.sucia { background-color: #fee2e2; color: #991b1b; }
.status-tag.limpiando { background-color: #dbeafe; color: #1e40af; }

.badge-reponer {
  font-size: 0.7rem;
  color: #ea580c;
  font-weight: 500;
}

/* CONTENEDORES INTERNOS */
.panel-flat {
  animation: fadeIn 0.15s ease;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.panel-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.sensor-tag {
  font-size: 0.7rem;
  text-transform: uppercase;
  background-color: #f1f5f9;
  color: #475569;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
}

.table-flat {
  width: 100%;
  margin-bottom: 2rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.table-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.table-row.warning .item-name {
  color: #ea580c;
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-name {
  font-size: 0.9rem;
  font-weight: 500;
}

.item-sub {
  font-size: 0.75rem;
  color: #94a3b8;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.qty-indicator {
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
}

.btn-action {
  font-size: 0.75rem;
  background: none;
  border: 1px solid #e2e8f0;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-action:hover:not(:disabled) {
  background-color: #0f172a;
  color: #fff;
}

.btn-action:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1.5rem;
  align-items: center;
}

.btn-link {
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-solid {
  background-color: #0f172a;
  color: #ffffff;
  border: none;
  padding: 0.45rem 1rem;
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
}

.empty-view {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  border: 1px dashed #e2e8f0;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #94a3b8;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(1px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
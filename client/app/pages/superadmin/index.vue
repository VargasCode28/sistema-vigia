
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({ layout: false })

// --- Tipos ---
interface Habitacion {
  id: number
  numero: string
  piso: number
  activa: boolean
  huesped: string | null
  sensorEstado: 'online' | 'offline' | 'alerta'
  frigorificoEstado: 'normal' | 'reponer' | 'sin_huesped'
}

interface Producto {
  _id: string
  nombre: string
  precio: number
  pesoGramos: number
  stock: number
  stockMax: number
  activo: boolean
}

type Rol = 'superadmin' | 'admin' | 'recepcion' | 'housekeeping'

interface Usuario {
  id: number
  nombreCompleto: string
  email: string
  rol: Rol
  activo: boolean
}

interface Alerta {
  id: number
  tipo: 'reposicion' | 'consumo' | 'sensor'
  habitacion: string
  mensaje: string
  hora: string
  resuelta: boolean
}

// --- Navegación ---
const panelActivo = ref<string>('dashboard')

const navItems = [
  { id: 'dashboard',    icon: 'layout-dashboard', label: 'Dashboard' },
  { id: 'habitaciones', icon: 'door',              label: 'Habitaciones' },
  { id: 'productos',    icon: 'package',           label: 'Productos',  badge: 'Mongo' },
  { id: 'alertas',      icon: 'bell',              label: 'Alertas',    badgeNum: true },
  { id: 'usuarios',     icon: 'users',             label: 'Usuarios' },
  { id: 'sensores',     icon: 'cpu',               label: 'Sensores IoT' },
]

// --- Datos mock (habitaciones, productos, alertas sin cambios) ---
const habitaciones = ref<Habitacion[]>([
  { id: 1, numero: '101', piso: 1, activa: true,  huesped: 'M. Torres', sensorEstado: 'online',  frigorificoEstado: 'normal'      },
  { id: 2, numero: '102', piso: 1, activa: true,  huesped: 'J. Soto',   sensorEstado: 'online',  frigorificoEstado: 'reponer'     },
  { id: 3, numero: '103', piso: 1, activa: true,  huesped: 'R. Díaz',   sensorEstado: 'online',  frigorificoEstado: 'normal'      },
  { id: 4, numero: '201', piso: 2, activa: true,  huesped: null,         sensorEstado: 'offline', frigorificoEstado: 'sin_huesped' },
  { id: 5, numero: '202', piso: 2, activa: true,  huesped: 'C. Lagos',  sensorEstado: 'alerta',  frigorificoEstado: 'reponer'     },
])

const productos = ref<Producto[]>([
  { _id: '1', nombre: 'Agua mineral 500ml', precio: 2500, pesoGramos: 520, stock: 8, stockMax: 10, activo: true },
  { _id: '2', nombre: 'Coca-Cola 350ml',    precio: 2000, pesoGramos: 385, stock: 6, stockMax: 10, activo: true },
  { _id: '3', nombre: 'Cerveza 330ml',      precio: 3500, pesoGramos: 360, stock: 2, stockMax: 10, activo: true },
  { _id: '4', nombre: 'Jugo naranja 250ml', precio: 2000, pesoGramos: 270, stock: 7, stockMax: 10, activo: true },
  { _id: '5', nombre: 'Snack maní',         precio: 1500, pesoGramos: 50,  stock: 9, stockMax: 10, activo: true },
])

const alertas = ref<Alerta[]>([
  { id: 1, tipo: 'reposicion', habitacion: '102', mensaje: 'Cerveza 330ml agotada — reposición necesaria',        hora: '09:14', resuelta: false },
  { id: 2, tipo: 'reposicion', habitacion: '202', mensaje: 'Agua mineral agotada — reposición necesaria',         hora: '08:55', resuelta: false },
  { id: 3, tipo: 'consumo',    habitacion: '101', mensaje: 'Coca-Cola 350ml registrada — $2.000 CLP / M. Torres', hora: '08:22', resuelta: false },
])

// --- Usuarios desde PostgreSQL ---
const usuarios      = ref<Usuario[]>([])
const cargandoUsers = ref(false)



const cargarUsuarios = async () => {
  cargandoUsers.value = true
  try {
    const rows = await $fetch<any[]>('/api/usuarios')
    usuarios.value = rows.map(r => ({
      id:             r.id,
      nombreCompleto: r.nombre_completo,
      email:          r.email,
      rol:            r.rol as Rol,
      activo:         r.activo,
    }))
  } catch (e) {
    console.error('[Superadmin] Error cargando usuarios:', e)
  } finally {
    cargandoUsers.value = false
  }
}

onMounted(() => cargarUsuarios())

// --- Métricas ---
const habitacionesOcupadas = computed(() => habitaciones.value.filter(h => h.huesped).length)
const alertasPendientes    = computed(() => alertas.value.filter(a => !a.resuelta).length)
const consumosHoy          = computed(() => alertas.value.filter(a => a.tipo === 'consumo').length)

// --- Modal crear usuario ---
const modalAbierto = ref(false)
const guardando    = ref(false)
const errorMsg     = ref('')

const rolesDisponibles: { value: Rol; label: string }[] = [
  { value: 'admin',        label: 'Admin' },
  { value: 'recepcion',    label: 'Recepción' },
  { value: 'housekeeping', label: 'Housekeeping' },
]

const nuevoUsuario = ref({
  nombreCompleto:    '',
  email:             '',
  password:          '',
  confirmarPassword: '',
  rol:               'recepcion' as Rol,
  activo:            true,
})

const resetForm = () => {
  nuevoUsuario.value = {
    nombreCompleto: '', email: '', password: '',
    confirmarPassword: '', rol: 'recepcion', activo: true,
  }
  errorMsg.value = ''
}

const abrirModal  = () => { resetForm(); modalAbierto.value = true }
const cerrarModal = () => { modalAbierto.value = false }

const crearUsuario = async () => {
  errorMsg.value = ''

  // Validaciones frontend
  if (!nuevoUsuario.value.nombreCompleto.trim()) {
    errorMsg.value = 'El nombre es requerido.'; return
  }
  if (!nuevoUsuario.value.email.includes('@')) {
    errorMsg.value = 'Ingresa un email válido.'; return
  }
  if (nuevoUsuario.value.password.length < 6) {
    errorMsg.value = 'La contraseña debe tener al menos 6 caracteres.'; return
  }
  if (nuevoUsuario.value.password !== nuevoUsuario.value.confirmarPassword) {
    errorMsg.value = 'Las contraseñas no coinciden.'; return
  }

  guardando.value = true
  try {
    const res = await $fetch<{ success: boolean; user: Usuario }>('/api/usuarios', {
      method: 'POST',
      body: {
        nombreCompleto: nuevoUsuario.value.nombreCompleto,
        email:          nuevoUsuario.value.email,
        password:       nuevoUsuario.value.password,
        rol:            nuevoUsuario.value.rol,
        activo:         nuevoUsuario.value.activo,
      }
    })

    // Agregar el usuario retornado por el servidor directamente al array
    if (res.success && res.user) {
      usuarios.value.push(res.user)
    }

    cerrarModal()
  } catch (e: any) {
    // El servidor retorna statusMessage en createError()
    errorMsg.value = e.data?.statusMessage || 'Error al crear el usuario.'
  } finally {
    guardando.value = false
  }
}

const toggleActivo = (u: Usuario) => { u.activo = !u.activo }

// --- Helpers ---
const sensorClase = (e: string) => ({
  'dot dot-green': e === 'online',
  'dot dot-amber': e === 'alerta',
  'dot dot-gray':  e === 'offline',
})

const frigorificoClase = (e: string) => ({
  's-active':   e === 'normal',
  's-alert':    e === 'reponer',
  's-inactive': e === 'sin_huesped',
})

const frigorificoLabel = (e: string) =>
  ({ normal: 'Normal', reponer: 'Reponer', sin_huesped: 'Libre' }[e] ?? e)

const rolClase = (r: string) => ({
  'r-superadmin': r === 'superadmin',
  'r-admin':      r === 'admin',
  'r-recepcion':  r === 'recepcion',
  'r-hk':         r === 'housekeeping',
})

const rolLabel = (r: string) =>
  ({ superadmin: 'superadmin', admin: 'admin', recepcion: 'recepción', housekeeping: 'housekeeping' }[r] ?? r)

const stockPct   = (p: Producto) => Math.round((p.stock / p.stockMax) * 100)
const stockColor = (p: Producto) =>
  stockPct(p) <= 30 ? 'var(--color-text-warning)' : 'var(--color-text-success)'

const resolverAlerta = (id: number) => {
  const a = alertas.value.find(a => a.id === id)
  if (a) a.resuelta = true
}

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)







const cerrarSesion = async () => {
  localStorage.removeItem('vigia_user')
  await navigateTo('/')
}




</script>









<template>
  <div class="layout">


    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">
          <img src="/logo_VIGIA.jpeg" alt="VIGÍA Logo" />
        </div>
      </div>

      

      <nav>
        <p class="nav-section">Principal</p>
        <button
          v-for="item in navItems.slice(0, 4)" :key="item.id"
          class="nav-item" :class="{ active: panelActivo === item.id }"
          @click="panelActivo = item.id"
        >
          <i :class="`ti ti-${item.icon}`" aria-hidden="true" />
          {{ item.label }}
          <span v-if="item.badge" class="badge">{{ item.badge }}</span>
          <span v-if="item.badgeNum && alertasPendientes > 0" class="badge">{{ alertasPendientes }}</span>
        </button>

        <p class="nav-section">Sistema</p>
        <button
          v-for="item in navItems.slice(4)" :key="item.id"
          class="nav-item" :class="{ active: panelActivo === item.id }"
          @click="panelActivo = item.id"
        >
          <i :class="`ti ti-${item.icon}`" aria-hidden="true" />
          {{ item.label }}
        </button>
      </nav>
    </aside>

    <!-- ── Main ── -->
    <main class="main">

      
      <!-- Dashboard -->
      <section v-if="panelActivo === 'dashboard'">
        <div class="topbar">
          <h2>Dashboard</h2>
          <div class="topbar-right">
            <span class="topbar-user">Superadmin</span>
            <div class="avatar">SA</div>
          </div>
        </div>
        <div class="metrics">
          <div class="metric">
            <p class="metric-label">Habitaciones ocupadas</p>
            <p class="metric-value">{{ habitacionesOcupadas }}</p>
            <p class="metric-sub">de {{ habitaciones.length }} total</p>
          </div>
          <div class="metric">
            <p class="metric-label">Consumos hoy</p>
            <p class="metric-value">{{ consumosHoy }}</p>
            <p class="metric-sub">registrados</p>
          </div>
          <div class="metric">
            <p class="metric-label">Ingresos hoy</p>
            <p class="metric-value">$63.000</p>
            <p class="metric-sub">CLP facturado</p>
          </div>
          <div class="metric">
            <p class="metric-label">Alertas activas</p>
            <p class="metric-value metric-warn">{{ alertasPendientes }}</p>
            <p class="metric-sub">reposición pendiente</p>
          </div>
        </div>
        <div class="grid2">
          <div class="card">
            <div class="card-header"><span class="card-title">Estado habitaciones</span></div>
            <table>
              <thead><tr><th>Hab.</th><th>Huésped</th><th>Frigorífico</th></tr></thead>
              <tbody>
                <tr v-for="h in habitaciones" :key="h.id">
                  <td><strong>{{ h.numero }}</strong></td>
                  <td>{{ h.huesped ?? '—' }}</td>
                  <td>
                    <span class="status-pill" :class="frigorificoClase(h.frigorificoEstado)">
                      <span class="dot" :class="{
                        'dot-green': h.frigorificoEstado === 'normal',
                        'dot-amber': h.frigorificoEstado === 'reponer',
                        'dot-gray':  h.frigorificoEstado === 'sin_huesped',
                      }" />
                      {{ frigorificoLabel(h.frigorificoEstado) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">Alertas recientes</span></div>
            <div v-for="a in alertas.filter(a => !a.resuelta)" :key="a.id" class="alert-row">
              <div class="alert-icon" :class="a.tipo === 'consumo' ? 'info' : 'warn'">
                <i :class="a.tipo === 'consumo' ? 'ti ti-receipt' : 'ti ti-alert-triangle'" aria-hidden="true" />
              </div>
              <div class="alert-body">
                <p class="alert-text"><strong>Hab. {{ a.habitacion }}</strong> — {{ a.mensaje }}</p>
              </div>
              <span class="alert-time">{{ a.hora }}</span>
            </div>
            <p v-if="alertasPendientes === 0" class="empty-state">Sin alertas activas</p>
          </div>
        </div>
      </section>

      <!-- Habitaciones -->
    
      <section v-else-if="panelActivo === 'habitaciones'">
        <div class="topbar">
          <h2>Habitaciones</h2>
          <button class="btn btn-primary"><i class="ti ti-plus" aria-hidden="true" /> Nueva</button>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">Listado</span>
            <span class="db-tag tag-pg">PostgreSQL</span>
          </div>
          <table>
            <thead><tr><th>N°</th><th>Piso</th><th>Sensor</th><th>Huésped</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              <tr v-for="h in habitaciones" :key="h.id">
                <td><strong>{{ h.numero }}</strong></td>
                <td>{{ h.piso }}</td>
                <td>
                  <span class="dot" :class="sensorClase(h.sensorEstado)" />
                  {{ h.sensorEstado }}
                </td>
                <td>{{ h.huesped ?? '—' }}</td>
                <td>
                  <span class="status-pill" :class="frigorificoClase(h.frigorificoEstado)">
                    {{ frigorificoLabel(h.frigorificoEstado) }}
                  </span>
                </td>
                <td><button class="btn"><i class="ti ti-edit" aria-hidden="true" /></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Productos -->
      <section v-else-if="panelActivo === 'productos'">
        <div class="topbar">
          <h2>Productos <span class="topbar-sub">MongoDB</span></h2>
          <button class="btn btn-primary"><i class="ti ti-plus" aria-hidden="true" /> Nuevo</button>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">Catálogo minibar</span>
            <span class="db-tag tag-mg">MongoDB</span>
          </div>
          <table>
            <thead><tr><th>Nombre</th><th>Precio</th><th>Peso (g)</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              <tr v-for="p in productos" :key="p._id">
                <td>{{ p.nombre }}</td>
                <td>{{ formatCLP(p.precio) }}</td>
                <td>{{ p.pesoGramos }}</td>
                <td style="min-width:110px">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: stockPct(p) + '%', background: stockColor(p) }" />
                  </div>
                  <span style="font-size:11px;color:var(--color-text-secondary)">{{ p.stock }}/{{ p.stockMax }}</span>
                </td>
                <td><button class="btn"><i class="ti ti-edit" aria-hidden="true" /></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Alertas -->
      <section v-else-if="panelActivo === 'alertas'">
        <div class="topbar"><h2>Centro de alertas</h2></div>
        <div class="card">
          <div v-for="a in alertas" :key="a.id" class="alert-row" :class="{ 'alert-resuelta': a.resuelta }">
            <div class="alert-icon" :class="a.tipo === 'consumo' ? 'info' : 'warn'">
              <i :class="a.tipo === 'consumo' ? 'ti ti-receipt' : 'ti ti-alert-triangle'" aria-hidden="true" />
            </div>
            <div class="alert-body">
              <p class="alert-text"><strong>Hab. {{ a.habitacion }}</strong> — {{ a.mensaje }}</p>
              <p style="font-size:11px;color:var(--color-text-tertiary);margin-top:2px">{{ a.hora }}</p>
            </div>
            <button v-if="!a.resuelta" class="btn" style="font-size:11px" @click="resolverAlerta(a.id)">
              Resolver
            </button>
            <span v-else class="status-pill s-active" style="font-size:11px">Resuelta</span>
          </div>
        </div>
      </section>

      <!-- ════════════════════════════════
          Usuarios
      ════════════════════════════════ -->
      <section v-else-if="panelActivo === 'usuarios'">
        <div class="topbar">
          <h2>Usuarios</h2>
          <button class="btn btn-primary" @click="abrirModal">
            <i class="ti ti-user-plus" aria-hidden="true" /> Nuevo usuario
          </button>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Cuentas del sistema</span>
            <span class="db-tag tag-pg">PostgreSQL</span>
          </div>
          <table>
            <thead>
              <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="u in usuarios" :key="u.id">
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="mini-avatar">{{ u.nombreCompleto.slice(0,2).toUpperCase() }}</div>
                    {{ u.nombreCompleto }}
                  </div>
                </td>
                <td style="color:var(--color-text-secondary)">{{ u.email }}</td>
                <td><span class="role-badge" :class="rolClase(u.rol)">{{ rolLabel(u.rol) }}</span></td>
                <td>
                  <button
                    class="status-pill toggle-btn"
                    :class="u.activo ? 's-active' : 's-inactive'"
                    :title="u.activo ? 'Desactivar' : 'Activar'"
                    :disabled="u.rol === 'superadmin'"
                    @click="toggleActivo(u)"
                  >
                    <span class="dot" :class="u.activo ? 'dot-green' : 'dot-gray'" />
                    {{ u.activo ? 'Activo' : 'Inactivo' }}
                  </button>
                </td>
                <td>
                  <button class="btn" :disabled="u.rol === 'superadmin'">
                    <i class="ti ti-edit" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── Leyenda de roles ── -->
        <div class="roles-info">
          <p class="roles-info-title">Roles disponibles</p>
          <div class="roles-grid">
            <div class="rol-card">
              <span class="role-badge r-superadmin">superadmin</span>
              <p>Acceso total. No se puede crear ni eliminar desde aquí.</p>
            </div>
            <div class="rol-card">
              <span class="role-badge r-admin">admin</span>
              <p>Gestión de usuarios, habitaciones y reportes.</p>
            </div>
            <div class="rol-card">
              <span class="role-badge r-recepcion">recepción</span>
              <p>Check-in/out, visualización de consumos y alertas.</p>
            </div>
            <div class="rol-card">
              <span class="role-badge r-hk">housekeeping</span>
              <p>Recibe alertas de reposición y confirma estado de habitaciones.</p>
            </div>
          </div>
        </div>


      </section>

      <!-- Sensores -->
      <section v-else-if="panelActivo === 'sensores'">


        <div class="topbar"><h2>Sensores IoT</h2></div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">Lecturas en tiempo real</span>
            <span class="db-tag tag-mg">MongoDB</span>
          </div>

          <table>
            <thead><tr><th>Hab.</th><th>Sensor ID</th><th>Protocolo</th><th>Estado</th><th>Δ peso</th></tr></thead>
            <tbody>
              <tr v-for="h in habitaciones" :key="h.id">
                <td><strong>{{ h.numero }}</strong></td>
                <td style="font-family:var(--font-mono);font-size:12px">ESP32-0{{ h.id }}</td>
                <td style="color:var(--color-text-secondary)">MQTT / WiFi</td>
                <td>
                  <span class="dot" :class="sensorClase(h.sensorEstado)" />
                  {{ h.sensorEstado }}
                </td>
                <td style="font-family:var(--font-mono);font-size:12px">
                  {{ h.frigorificoEstado === 'reponer' ? '−360g' : '0g' }}


                </td>


              </tr>

            </tbody>



          </table>



        </div>



      



      </section>
      
    </main>

  


    <!-- ════════════════════════════════
        Modal: Crear usuario
    ════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">

          <div class="modal-header">
            <h3 id="modal-title">Nuevo usuario</h3>
            <button class="btn-icon" aria-label="Cerrar" @click="cerrarModal">
              <i class="ti ti-x" aria-hidden="true" />
            </button>
          </div>

          <div class="modal-body">

            <!-- Nombre -->
            <div class="field">
              <label class="field-label" for="f-nombre">Nombre completo</label>
              <input
                id="f-nombre"
                v-model="nuevoUsuario.nombreCompleto"
                type="text"
                class="field-input"
                placeholder="Ej: Carlos Mendoza"
              />
            </div>

            <!-- Email -->
            <div class="field">
              <label class="field-label" for="f-email">Email</label>
              <input
                id="f-email"
                v-model="nuevoUsuario.email"
                type="email"
                class="field-input"
                placeholder="usuario@vigia.com"
              />
            </div>

            <!-- Rol -->
            <div class="field">
              <label class="field-label" for="f-rol">Rol</label>
              <select id="f-rol" v-model="nuevoUsuario.rol" class="field-input">
                <option v-for="r in rolesDisponibles" :key="r.value" :value="r.value">
                  {{ r.label }}
                </option>
              </select>
            </div>

            <!-- Descripción del rol seleccionado -->
            <div class="rol-hint">
              <i class="ti ti-info-circle" aria-hidden="true" />
              <span v-if="nuevoUsuario.rol === 'admin'">Puede gestionar usuarios, habitaciones y ver reportes.</span>
              <span v-else-if="nuevoUsuario.rol === 'recepcion'">Accede a check-in/out y visualización de consumos.</span>
              <span v-else-if="nuevoUsuario.rol === 'housekeeping'">Recibe alertas de reposición y gestiona el estado de habitaciones.</span>
            </div>


            
            <div class="field-row">
              <!-- Contraseña -->
              <div class="field" style="flex:1">
                <label class="field-label" for="f-pass">Contraseña</label>
                <input
                  id="f-pass"
                  v-model="nuevoUsuario.password"
                  type="password"
                  class="field-input"
                  placeholder="Mín. 6 caracteres"
                />
              </div>

              <!-- Confirmar -->
              <div class="field" style="flex:1">
                <label class="field-label" for="f-pass2">Confirmar contraseña</label>
                <input
                  id="f-pass2"
                  v-model="nuevoUsuario.confirmarPassword"
                  type="password"
                  class="field-input"
                  placeholder="Repetir contraseña"
                />
              </div>
            </div>

          


            <!-- Toggle activo -->
            <div class="field-check">
              <input
                id="f-activo"
                v-model="nuevoUsuario.activo"
                type="checkbox"
              />
              <label for="f-activo">Cuenta activa al crear</label>
            </div>

          

            <!-- Error -->
            <div v-if="errorMsg" class="error-msg">
              <i class="ti ti-alert-circle" aria-hidden="true" />
              {{ errorMsg }}
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn" @click="cerrarModal">Cancelar</button>
            <button class="btn btn-primary" :disabled="guardando" @click="crearUsuario">
              <i v-if="guardando" class="ti ti-loader-2 spin" aria-hidden="true" />
              <i v-else class="ti ti-user-plus" aria-hidden="true" />
              {{ guardando ? 'Creando...' : 'Crear usuario' }}
            </button>
          </div>


        


        </div>
      </div>
    </Teleport>




  </div>


</template>

<style scoped>



*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.layout {
  
  display: flex;
  height: 100vh;


  font-family: var(--font-sans, system-ui, sans-serif);
  background: var(--color-background-tertiary, #f5f5f4);
}

.sidebar {
  width: 210px;
  min-height: 100vh;
  background: var(--color-background-primary, #fff);
  border-right: 0.5px solid var(--color-border-tertiary, #e5e5e5);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}


.logo {
  display: flex;
  align-items: center;
  padding: 16px 50px;
  border-bottom: 0.5px solid var(--color-border-tertiary, #e5e5e5);
}
.logo-icon img {
  height: 70px;
  border-radius: 7px;
  object-fit: contain;
}



nav { padding: 8px 6px; flex: 1 }
.nav-section {
  font-size: 10px; text-transform: uppercase; letter-spacing: .06em;
  color: var(--color-text-tertiary, #aaa); padding: 12px 8px 4px;
}
.nav-item {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 7px 10px; border-radius: 8px; border: none;
  background: transparent; cursor: pointer; font-size: 13px;
  color: var(--color-text-secondary, #555); text-align: left; transition: background .1s;
}
.nav-item:hover { background: var(--color-background-secondary, #f5f5f4) }
.nav-item.active {
  background: var(--color-background-secondary, #f5f5f4);
  color: var(--color-text-primary, #111); font-weight: 500;
}
.nav-item i { font-size: 16px; width: 18px; text-align: center }
.badge {
  margin-left: auto; font-size: 10px;
  background: var(--color-background-danger, #fee2e2);
  color: var(--color-text-danger, #b91c1c);
  padding: 1px 6px; border-radius: 10px; font-weight: 500;
}

.main { flex: 1; overflow-y: auto; padding: 22px 24px }
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px }
.topbar h2 { font-size: 18px; font-weight: 500; color: var(--color-text-primary, #111); display: flex; align-items: baseline; gap: 8px }
.topbar-sub { font-size: 12px; font-weight: 400; color: var(--color-text-tertiary, #aaa) }
.topbar-right { display: flex; align-items: center; gap: 8px }
.topbar-user { font-size: 12px; color: var(--color-text-secondary, #666) }
.avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--color-background-info, #dbeafe);
  color: var(--color-text-info, #1e40af);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 500;
}

.metrics { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 18px }
.metric { background: var(--color-background-secondary, #f5f5f4); border-radius: 8px; padding: 12px 14px }
.metric-label { font-size: 12px; color: var(--color-text-secondary, #666); margin-bottom: 4px }
.metric-value { font-size: 22px; font-weight: 500; color: var(--color-text-primary, #111) }
.metric-warn { color: var(--color-text-warning, #b45309) }
.metric-sub { font-size: 11px; color: var(--color-text-tertiary, #aaa); margin-top: 2px }

.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px }
.card {
  background: var(--color-background-primary, #fff);
  border: 0.5px solid var(--color-border-tertiary, #e5e5e5);
  border-radius: 12px; padding: 14px 16px; margin-bottom: 14px;
}
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px }
.card-title { font-size: 14px; font-weight: 500; color: var(--color-text-primary, #111) }

table { width: 100%; font-size: 13px; border-collapse: collapse }
th {
  text-align: left; font-weight: 500; font-size: 11px;
  color: var(--color-text-secondary, #666); padding: 0 8px 8px;
  border-bottom: 0.5px solid var(--color-border-tertiary, #e5e5e5);
}
td { padding: 9px 8px; border-bottom: 0.5px solid var(--color-border-tertiary, #e5e5e5); color: var(--color-text-primary, #111) }
tr:last-child td { border-bottom: none }
tr:hover td { background: var(--color-background-secondary, #f9f9f8) }

.btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 11px; border-radius: 7px;
  border: 0.5px solid var(--color-border-secondary, #d4d4d4);
  background: transparent; cursor: pointer; font-size: 12px;
  color: var(--color-text-primary, #111); transition: background .1s;
}
.btn:hover:not(:disabled) { background: var(--color-background-secondary, #f5f5f4) }
.btn:disabled { opacity: .4; cursor: not-allowed }
.btn i { font-size: 14px }
.btn-primary { background: #1a1a2e; border-color: #1a1a2e; color: #fff }
.btn-primary:hover:not(:disabled) { background: #2a2a4e }
.btn-icon {
  width: 28px; height: 28px; border-radius: 6px;
  border: none; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-secondary, #666); font-size: 16px;
}
.btn-icon:hover { background: var(--color-background-secondary, #f5f5f4) }

.status-pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500;
}
.toggle-btn { border: none; cursor: pointer }
.toggle-btn:disabled { cursor: not-allowed; opacity: .6 }
.s-active   { background: var(--color-background-success, #dcfce7); color: var(--color-text-success, #166534) }
.s-inactive { background: var(--color-background-secondary, #f5f5f4); color: var(--color-text-secondary, #666) }
.s-alert    { background: var(--color-background-warning, #fef9c3); color: var(--color-text-warning, #b45309) }

.dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; flex-shrink: 0 }
.dot-green { background: #16a34a }
.dot-amber { background: #d97706 }
.dot-gray  { background: #9ca3af }

.role-badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500 }
.r-superadmin { background: #1a1a2e; color: #fff }
.r-admin      { background: var(--color-background-danger, #fee2e2);  color: var(--color-text-danger, #b91c1c) }
.r-recepcion  { background: var(--color-background-info, #dbeafe);    color: var(--color-text-info, #1e40af) }
.r-hk         { background: var(--color-background-warning, #fef9c3); color: var(--color-text-warning, #b45309) }

.db-tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500 }
.tag-pg { background: #336791; color: #fff }
.tag-mg { background: #4DB33D; color: #fff }

.progress-bar { height: 5px; background: var(--color-background-secondary, #f5f5f4); border-radius: 3px; overflow: hidden; margin-bottom: 2px }
.progress-fill { height: 100%; border-radius: 3px; transition: width .3s }

.alert-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 0.5px solid var(--color-border-tertiary, #e5e5e5) }
.alert-row:last-child { border-bottom: none }
.alert-resuelta { opacity: .5 }
.alert-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0 }
.alert-icon.warn { background: var(--color-background-warning, #fef9c3); color: var(--color-text-warning, #b45309) }
.alert-icon.info { background: var(--color-background-info, #dbeafe);    color: var(--color-text-info, #1e40af) }
.alert-body { flex: 1 }
.alert-text { font-size: 12px; color: var(--color-text-primary, #111); line-height: 1.4 }
.alert-time { font-size: 11px; color: var(--color-text-tertiary, #aaa); white-space: nowrap }
.empty-state { font-size: 13px; color: var(--color-text-tertiary, #aaa); text-align: center; padding: 20px 0 }

.mini-avatar {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--color-background-secondary, #f5f5f4);
  color: var(--color-text-secondary, #555);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 500; flex-shrink: 0;
}

.roles-info { margin-top: 4px }
.roles-info-title { font-size: 12px; color: var(--color-text-secondary, #666); margin-bottom: 10px; font-weight: 500 }
.roles-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px }
.rol-card {
  background: var(--color-background-primary, #fff);
  border: 0.5px solid var(--color-border-tertiary, #e5e5e5);
  border-radius: 10px; padding: 12px;
}
.rol-card p { font-size: 12px; color: var(--color-text-secondary, #666); margin-top: 6px; line-height: 1.4 }

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--color-background-primary, #fff);
  border-radius: 14px;
  border: 0.5px solid var(--color-border-tertiary, #e5e5e5);
  width: 480px; max-width: 95vw;
  box-shadow: 0 8px 32px rgba(0,0,0,.12);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px 14px;
  border-bottom: 0.5px solid var(--color-border-tertiary, #e5e5e5);
}
.modal-header h3 { font-size: 15px; font-weight: 500; color: var(--color-text-primary, #111) }
.modal-body { padding: 18px }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 18px;
  border-top: 0.5px solid var(--color-border-tertiary, #e5e5e5);
}

.field { margin-bottom: 14px }
.field-row { display: flex; gap: 12px }
.field-label { display: block; font-size: 12px; font-weight: 500; color: var(--color-text-secondary, #555); margin-bottom: 5px }
.field-input {
  width: 100%; padding: 7px 10px;
  border: 0.5px solid var(--color-border-secondary, #d4d4d4);
  border-radius: 7px; font-size: 13px;
  background: var(--color-background-primary, #fff);
  color: var(--color-text-primary, #111);
  transition: border-color .15s;
}
.field-input:focus { outline: none; border-color: #1a1a2e }
.field-check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text-secondary, #555); margin-bottom: 14px }
.field-check input { width: 15px; height: 15px; cursor: pointer }

.rol-hint {
  display: flex; align-items: flex-start; gap: 6px;
  font-size: 12px; color: var(--color-text-secondary, #666);
  background: var(--color-background-secondary, #f9f9f8);
  border-radius: 7px; padding: 8px 10px; margin-bottom: 14px;
  line-height: 1.4;
}
.rol-hint i { font-size: 14px; flex-shrink: 0; margin-top: 1px }

.error-msg {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--color-text-danger, #b91c1c);
  background: var(--color-background-danger, #fee2e2);
  border-radius: 7px; padding: 8px 10px;
}
.error-msg i { font-size: 14px; flex-shrink: 0 }

@keyframes spin { to { transform: rotate(360deg) } }
.spin { display: inline-block; animation: spin .7s linear infinite }


</style>
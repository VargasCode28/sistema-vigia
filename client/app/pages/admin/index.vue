
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({ layout: false })

// --- Tipos ---
interface Personal {
  id: number
  nombre: string
  email: string
  rol: 'admin' | 'recepcion' | 'mantenimiento'
  estado: 'activo' | 'inactivo'
}

interface HabitacionAdmin {
  id: number
  numero: string
  piso: number
  tipo: 'Simple' | 'Doble' | 'Suite'
  sensorId: string
  estadoHardware: 'online' | 'offline'
}

interface ReporteConsumo {
  id: number
  fecha: string
  habitacion: string
  producto: string
  cantidad: number
  total: number
}

// --- Estado de Navegación del Panel ---
const panelActivo = ref<string>('usuarios')

const navItems = [
  { id: 'usuarios',     icon: 'users',             label: 'Gestión de Personal' },
  { id: 'habitaciones', icon: 'bed',               label: 'Habitaciones e IoT' },
  { id: 'reportes',     icon: 'chart-bar',         label: 'Reportes y Consumos' },
]

// --- Datos Reactivos ---
const personal = ref<Personal[]>([
  { id: 1, nombre: 'Carlos Mendoza', email: 'carlos.m@vigia.cl',  rol: 'admin',         estado: 'activo' },
  { id: 2, nombre: 'Ana María Gómez', email: 'ana.g@vigia.cl',     rol: 'recepcion',     estado: 'activo' },
  { id: 3, nombre: 'Pedro Pascal',    email: 'pedro.p@vigia.cl',   rol: 'mantenimiento', estado: 'activo' },
  { id: 4, nombre: 'Sofía Lagos',     email: 'sofia.l@vigia.cl',   rol: 'recepcion',     estado: 'inactivo' },
])

const habitaciones = ref<HabitacionAdmin[]>([
  { id: 1, numero: '101', piso: 1, tipo: 'Simple', sensorId: 'ESP32-WOKWI-001', estadoHardware: 'online' },
  { id: 2, numero: '102', piso: 1, tipo: 'Doble',  sensorId: 'ESP32-WOKWI-002', estadoHardware: 'online' },
  { id: 3, numero: '103', piso: 1, tipo: 'Suite',  sensorId: 'ESP32-WOKWI-003', estadoHardware: 'online' },
  { id: 4, numero: '201', piso: 2, tipo: 'Simple', sensorId: 'ESP32-WOKWI-004', estadoHardware: 'offline' },
  { id: 5, numero: '202', piso: 2, tipo: 'Suite',  sensorId: 'ESP32-WOKWI-005', estadoHardware: 'online' },
])

const reportes = ref<ReporteConsumo[]>([
  { id: 1, fecha: '2026-05-28', habitacion: '101', producto: 'Coca-Cola 350ml', cantidad: 1, total: 2000 },
  { id: 2, fecha: '2026-05-28', habitacion: '102', producto: 'Snack Maní',       cantidad: 1, total: 1500 },
  { id: 3, fecha: '2026-05-27', habitacion: '202', producto: 'Agua Mineral',     cantidad: 2, total: 2400 },
  { id: 4, fecha: '2026-05-26', habitacion: '103', producto: 'Cerveza 330ml',    cantidad: 3, total: 9000 },
])

// --- Variables de Usuario Logueado ---
const usuarioActivo = ref({ name: 'Administrador', email: '', iniciales: 'AD' })

onMounted(() => {
  if (!process.client) return
  const sesionGuardada = localStorage.getItem('vigia_user')
  if (sesionGuardada) {
    try {
      const datos = JSON.parse(sesionGuardada)
      usuarioActivo.value = {
        name: datos.name || datos.nombre_completo || 'Administrador VIGÍA',
        email: datos.email || '',
        iniciales: (datos.name || datos.nombre_completo || 'AD').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
      }
    } catch (e) { console.error(e) }
  }
})

// --- Computados para Métricas Generales ---
const totalIngresos = computed(() => reportes.value.reduce((acc, curr) => acc + curr.total, 0))
const totalHardwareOnline = computed(() => habitaciones.value.filter(h => h.estadoHardware === 'online').length)

// --- Modales (Agregar Personal / Habitación) ---
const modalUsuarioAbierto = ref(false)
const modalHabitacionAbierto = ref(false)

// Formularios
const nuevoUsuario = ref({ nombre: '', email: '', rol: 'recepcion' as const })
const nuevaHabitacion = ref({ numero: '', piso: 1, tipo: 'Simple' as const, sensorId: '' })

const agregarUsuario = () => {
  if (!nuevoUsuario.value.nombre || !nuevoUsuario.value.email) return
  personal.value.push({
    id: Date.now(),
    nombre: nuevoUsuario.value.nombre,
    email: nuevoUsuario.value.email,
    rol: nuevoUsuario.value.rol,
    estado: 'activo'
  })
  nuevoUsuario.value = { nombre: '', email: '', rol: 'recepcion' }
  modalUsuarioAbierto.value = false
}

const agregarHabitacion = () => {
  if (!nuevaHabitacion.value.numero || !nuevaHabitacion.value.sensorId) return
  habitaciones.value.push({
    id: Date.now(),
    numero: nuevaHabitacion.value.numero,
    piso: Number(nuevaHabitacion.value.piso),
    tipo: nuevaHabitacion.value.tipo,
    sensorId: nuevaHabitacion.value.sensorId,
    estadoHardware: 'online'
  })
  nuevaHabitacion.value = { numero: '', piso: 1, tipo: 'Simple', sensorId: '' }
  modalHabitacionAbierto.value = false
}

const cambiarEstadoUsuario = (id: number) => {
  const u = personal.value.find(p => p.id === id)
  if (u) u.estado = u.estado === 'activo' ? 'inactivo' : 'activo'
}

const cerrarSesion = async () => {
  localStorage.removeItem('vigia_user')
  await navigateTo('/')
}

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
</script>

<template>
  <div class="layout">
    
    <!-- ── Sidebar ── -->
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">
          <img src="/logo_VIGIA.jpeg" alt="VIGÍA Logo" />
        </div>
      </div>

      <nav>
        <p class="nav-section">Administración</p>
        <button
          v-for="item in navItems" :key="item.id"
          class="nav-item" :class="{ active: panelActivo === item.id }"
          @click="panelActivo = item.id"
        >
          <i :class="`ti ti-${item.icon}`" />
          {{ item.label }}
        </button>
      </nav>

      <div style="padding: 12px; border-top: 0.5px solid var(--color-border-tertiary, #e5e5e5);">
        <button @click="cerrarSesion" class="nav-item logout-btn">
          <i class="ti ti-logout" /> Cerrar Sesión
        </button>
      </div>
    </aside>

    <!-- ── Main ── -->
    <main class="main">
      
      <!-- Topbar -->
      <div class="topbar">
        <div>
          <h2>Panel de Administración Central</h2>
          <p style="font-size: 12px; color: var(--color-text-secondary, #666); margin-top: 2px;">Configuración global del sistema, infraestructura y finanzas</p>
        </div>
        <div class="topbar-right">
          <!-- <span class="topbar-user">{{ usuarioActivo.name }}</span> -->
          <span class="topbar-user">{{ usuarioActivo.email }}</span>
          <div class="avatar">{{ usuarioActivo.iniciales }}</div>
        </div>
      </div>

      <!-- Tarjetas de Métricas de Negocio -->
      <div class="metrics">
        <div class="metric">
          <p class="metric-label">Ventas Totales Minibares</p>
          <p class="metric-value" style="color: var(--color-text-success, #166534)">{{ formatCLP(totalIngresos) }}</p>
          <p class="metric-sub">auditoría de consumos totales</p>
        </div>
        <div class="metric">
          <p class="metric-label">Nodos IoT Vinculados</p>
          <p class="metric-value">{{ totalHardwareOnline }} / {{ habitaciones.length }}</p>
          <p class="metric-sub">microcontroladores activos</p>
        </div>
        <div class="metric">
          <p class="metric-label">Personal Registrado</p>
          <p class="metric-value">{{ personal.filter(p => p.estado === 'activo').length }}</p>
          <p class="metric-sub">usuarios operativos activos</p>
        </div>
      </div>

      <!-- SECCIÓN: GESTIÓN DE USUARIOS -->
      <section v-if="panelActivo === 'usuarios'">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Usuarios con Acceso a la Plataforma</span>
            <button class="btn btn-primary" style="font-size: 12px;" @click="modalUsuarioAbierto = true">
              <i class="ti ti-user-plus" /> Agregar Colaborador
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo Electrónico</th>
                <th>Rol Asignado</th>
                <th>Estado</th>
                <th style="text-align: right;">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in personal" :key="u.id" :style="{ opacity: u.estado === 'inactivo' ? 0.5 : 1 }">
                <td><strong>{{ u.nombre }}</strong></td>
                <td>{{ u.email }}</td>
                <td>
                  <span class="rol-tag" :class="u.rol">
                    {{ u.rol === 'admin' ? 'Administrador' : u.rol === 'recepcion' ? 'Recepción' : 'Mantenimiento' }}
                  </span>
                </td>
                <td>
                  <span class="status-pill" :class="u.estado === 'activo' ? 's-active' : 's-inactive'">
                    {{ u.estado === 'activo' ? 'Activo' : 'Suspendido' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <button class="btn" style="font-size: 11px; padding: 4px 8px;" @click="cambiarEstadoUsuario(u.id)">
                    {{ u.estado === 'activo' ? 'Desactivar' : 'Activar' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- SECCIÓN: HABITACIONES E IOT -->
      <section v-else-if="panelActivo === 'habitaciones'">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Inventario de Habitaciones y Dispositivos de Telemetría</span>
            <button class="btn btn-primary" style="font-size: 12px;" @click="modalHabitacionAbierto = true">
              <i class="ti ti-plus" /> Registrar Habitación
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nº Habitación</th>
                <th>Piso</th>
                <th>Tipo</th>
                <th>ID Sensor Minibar (Hardware)</th>
                <th>Enlace IoT</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in habitaciones" :key="h.id">
                <td><strong>{{ h.numero }}</strong></td>
                <td>Piso {{ h.piso }}</td>
                <td>{{ h.tipo }}</td>
                <td><code class="sensor-code">{{ h.sensorId }}</code></td>
                <td>
                  <span class="status-pill" :class="h.estadoHardware === 'online' ? 's-active' : 's-inactive'">
                    <span class="dot" :class="h.estadoHardware === 'online' ? 'dot-green' : 'dot-gray'" />
                    {{ h.estadoHardware === 'online' ? 'Conectado' : 'Sin Señal' }}

                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- SECCIÓN: REPORTES Y CONSUMOS -->
      <section v-else-if="panelActivo === 'reportes'">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Auditoría Histórica de Ventas automáticas por Peso</span>
            <span class="db-tag tag-pg">Fuente: Base de Datos Central</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Habitación</th>
                <th>Producto Removido</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Total Cargado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in reportes" :key="r.id">
                <td>{{ r.fecha }}</td>
                <td><strong>{{ r.habitacion }}</strong></td>
                <td>{{ r.producto }}</td>
                <td style="text-align: center;">{{ r.cantidad }}</td>
                <td style="text-align: right; font-weight: 500;">{{ formatCLP(r.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </main>

    <!-- ── Teleport: Modal Agregar Usuario ── -->
    <Teleport to="body">
      <div v-if="modalUsuarioAbierto" class="modal-overlay" @click.self="modalUsuarioAbierto = false">
        <div class="modal">
          <div class="modal-header">
            <h3>Registrar Nuevo Colaborador</h3>
            <button class="btn-icon" @click="modalUsuarioAbierto = false"><i class="ti ti-x" /></button>
          </div>
          <div class="modal-body">
            <div class="field" style="margin-bottom: 12px;">
              <label class="field-label">Nombre Completo</label>
              <input v-model="nuevoUsuario.nombre" type="text" class="field-input" placeholder="Ej: Patricia Olivares" />
            </div>
            <div class="field" style="margin-bottom: 12px;">
              <label class="field-label">Correo Electrónico Corporativo</label>
              <input v-model="nuevoUsuario.email" type="email" class="field-input" placeholder="p.olivares@vigia.cl" />
            </div>
            <div class="field">
              <label class="field-label">Rol de Sistema</label>
              <select v-model="nuevoUsuario.rol" class="field-input" style="background-color: #fff;">
                <option value="admin">Administrador</option>
                <option value="recepcion">Recepción</option>
                <option value="mantenimiento">Mantenimiento</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" @click="modalUsuarioAbierto = false">Cancelar</button>
            <button class="btn btn-primary" :disabled="!nuevoUsuario.nombre || !nuevoUsuario.email" @click="agregarUsuario">Dar de Alta</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Teleport: Modal Agregar Habitación ── -->
    <Teleport to="body">
      <div v-if="modalHabitacionAbierto" class="modal-overlay" @click.self="modalHabitacionAbierto = false">
        <div class="modal">
          <div class="modal-header">
            <h3>Configurar Nueva Habitación</h3>
            <button class="btn-icon" @click="modalHabitacionAbierto = false"><i class="ti ti-x" /></button>
          </div>
          <div class="modal-body">
            <div class="field-row" style="margin-bottom: 12px;">
              <div class="field" style="flex: 1;">
                <label class="field-label">Número</label>
                <input v-model="nuevaHabitacion.numero" type="text" class="field-input" placeholder="305" />
              </div>
              <div class="field" style="flex: 1;">
                <label class="field-label">Piso</label>
                <input v-model="nuevaHabitacion.piso" type="number" class="field-input" min="1" max="10" />
              </div>
            </div>
            <div class="field" style="margin-bottom: 12px;">
              <label class="field-label">Categoría de Habitación</label>
              <select v-model="nuevaHabitacion.tipo" class="field-input" style="background-color: #fff;">
                <option value="Simple">Simple</option>
                <option value="Doble">Doble</option>
                <option value="Suite">Suite</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">MAC Address / ID del Sensor (ESP32)</label>
              <input v-model="nuevaHabitacion.sensorId" type="text" class="field-input" placeholder="ESP32-WOKWI-XXX" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" @click="modalHabitacionAbierto = false">Cancelar</button>
            <button class="btn btn-primary" :disabled="!nuevaHabitacion.numero || !nuevaHabitacion.sensorId" @click="agregarHabitacion">Vincular Nodo</button>
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

nav { padding: 8px 6px; flex: 1; }
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
.nav-item:hover { background: var(--color-background-secondary, #f5f5f4); }
.nav-item.active {
  background: var(--color-background-secondary, #f5f5f4);
  color: var(--color-text-primary, #111); font-weight: 500;
}
.logout-btn { color: #b91c1c; margin-top: auto; }
.logout-btn:hover { background: #fee2e2; }

.main { flex: 1; overflow-y: auto; padding: 22px 24px; }
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.topbar h2 { font-size: 18px; font-weight: 500; color: var(--color-text-primary, #111); }
.topbar-right { display: flex; align-items: center; gap: 8px; }
.topbar-user { font-size: 12px; color: var(--color-text-secondary, #666); }
.avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: #fef3c7; color: #d97706;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 500;
}

.metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
.metric { background: var(--color-background-secondary, #f5f5f4); border-radius: 8px; padding: 12px 14px; }
.metric-label { font-size: 12px; color: var(--color-text-secondary, #666); margin-bottom: 4px; }
.metric-value { font-size: 22px; font-weight: 500; color: var(--color-text-primary, #111); }
.metric-sub { font-size: 11px; color: var(--color-text-tertiary, #aaa); margin-top: 2px; }

.card {
  background: var(--color-background-primary, #fff);
  border: 0.5px solid var(--color-border-tertiary, #e5e5e5);
  border-radius: 12px; padding: 14px 16px; margin-bottom: 14px;
}
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.card-title { font-size: 14px; font-weight: 500; color: var(--color-text-primary, #111); }

table { width: 100%; font-size: 13px; border-collapse: collapse; }
th {
  text-align: left; font-weight: 500; font-size: 11px;
  color: var(--color-text-secondary, #666); padding: 0 8px 8px;
  border-bottom: 0.5px solid var(--color-border-tertiary, #e5e5e5);
}
td { padding: 9px 8px; border-bottom: 0.5px solid var(--color-border-tertiary, #e5e5e5); color: var(--color-text-primary, #111); }
tr:last-child td { border-bottom: none; }

.sensor-code { font-family: monospace; background: #fafafa; padding: 2px 6px; border: 0.5px solid #e5e5e5; border-radius: 4px; font-size: 11px; color: #444; }

.btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 11px; border-radius: 7px;
  border: 0.5px solid var(--color-border-secondary, #d4d4d4);
  background: transparent; cursor: pointer; font-size: 12px;
  color: var(--color-text-primary, #111); transition: background .1s;
}
.btn:hover:not(:disabled) { background: var(--color-background-secondary, #f5f5f4); }
.btn:disabled { opacity: .4; cursor: not-allowed; }
.btn-primary { background: #1a1a2e; border-color: #1a1a2e; color: #fff; }
.btn-primary:hover:not(:disabled) { background: #2a2a4e; }
.btn-icon { width: 28px; height: 28px; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #666; border-radius: 6px; }
.btn-icon:hover { background: #f5f5f4; }

.status-pill { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500; }
.s-active   { background: var(--color-background-success, #dcfce7); color: var(--color-text-success, #166534); }
.s-inactive { background: #fee2e2; color: #b91c1c; }

.dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.dot-green { background: #16a34a; }
.dot-gray  { background: #9ca3af; }

.rol-tag { font-size: 11px; font-weight: 500; padding: 1px 6px; border-radius: 4px; }
.rol-tag.admin { background: #fef3c7; color: #d97706; }
.rol-tag.recepcion { background: #dbeafe; color: #1e40af; }
.rol-tag.mantenimiento { background: #e0f2fe; color: #0369a1; }

.db-tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
.tag-pg { background: #336791; color: #fff; }

/* Modales */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #fff; border-radius: 12px; width: 400px; max-width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 0.5px solid #e5e5e5; }
.modal-header h3 { font-size: 15px; font-weight: 500; }
.modal-body { padding: 16px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field-row { display: flex; gap: 10px; }
.field-label { font-size: 11px; font-weight: 500; color: #666; }
.field-input { padding: 6px 10px; border-radius: 6px; border: 0.5px solid #d4d4d4; font-size: 13px; width: 100%; }
.field-input:focus { outline: none; border-color: #1a1a2e; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 16px; border-top: 0.5px solid #e5e5e5; background: #f9f9f8; }
</style>





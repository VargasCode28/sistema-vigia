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

interface Alerta {
  id: number
  tipo: 'reposicion' | 'consumo' | 'sensor'
  habitacion: string
  mensaje: string
  hora: string
  resuelta: boolean
  monto?: number // Monto opcional para cobros en recepción
}

// --- Estado de Navegación del Panel Interno ---
const panelActivo = ref<string>('monitoreo')

const navItems = [
  { id: 'monitoreo',   icon: 'layout-dashboard',  label: 'Monitoreo General' },
  { id: 'recep_alertas', icon: 'bell',              label: 'Alertas de Consumo', badgeNum: true },
]

// --- Datos Reactivos (Sincronizados con el Mock General) ---
const habitaciones = ref<Habitacion[]>([
  { id: 1, numero: '101', piso: 1, activa: true,  huesped: 'M. Torres', sensorEstado: 'online',  frigorificoEstado: 'normal'      },
  { id: 2, numero: '102', piso: 1, activa: true,  huesped: 'J. Soto',   sensorEstado: 'online',  frigorificoEstado: 'reponer'     },
  { id: 3, numero: '103', piso: 1, activa: true,  huesped: 'R. Díaz',   sensorEstado: 'online',  frigorificoEstado: 'normal'      },
  { id: 4, numero: '201', piso: 2, activa: true,  huesped: null,        sensorEstado: 'offline', frigorificoEstado: 'sin_huesped' },
  { id: 5, numero: '202', piso: 2, activa: true,  huesped: 'C. Lagos',  sensorEstado: 'alerta',  frigorificoEstado: 'reponer'     },
])

const alertas = ref<Alerta[]>([
  { id: 1, tipo: 'reposicion', habitacion: '102', mensaje: 'Cerveza 330ml agotada — reposición necesaria',         hora: '09:14', resuelta: false },
  { id: 2, tipo: 'reposicion', habitacion: '202', mensaje: 'Agua mineral agotada — reposición necesaria',          hora: '08:55', resuelta: false },
  { id: 3, tipo: 'consumo',    habitacion: '101', mensaje: 'Coca-Cola 350ml registrada — M. Torres',              hora: '08:22', resuelta: false, monto: 2000 },
  { id: 4, tipo: 'consumo',    habitacion: '102', mensaje: 'Snack maní registrado — J. Soto',                    hora: '11:05', resuelta: false, monto: 1500 },
])

// --- Variables del Usuario Logueado (Carga Dinámica) ---
const usuarioActivo = ref({
  name: 'Cargando...',
  email: '',
  iniciales: '??'
})

const cargarSesionUsuario = () => {
  if (!process.client) return
  const sesionGuardada = localStorage.getItem('vigia_user')
  if (sesionGuardada) {
    try {
      const datos = JSON.parse(sesionGuardada)
      usuarioActivo.value = {
        name: datos.name || datos.nombre_completo || 'Recepcionista VIGÍA',
        email: datos.email || '',
        iniciales: (datos.name || datos.nombre_completo || 'RE').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
      }
    } catch (e) {
      console.error(e)
    }
  }
}

onMounted(() => {
  cargarSesionUsuario()
})

// --- Computados para Métricas de Recepción ---
const totalOcupadas = computed(() => habitaciones.value.filter(h => h.huesped).length)
const alertasConsumoPendientes = computed(() => alertas.value.filter(a => !a.resuelta && a.tipo === 'consumo').length)
const habitacionesDisponibles = computed(() => habitaciones.value.filter(h => !h.huesped).length)

// --- Modales (Check-in / Check-out) ---
const modalCheckInAbierto = ref(false)
const modalCheckOutAbierto = ref(false)
const habitacionSeleccionada = ref<Habitacion | null>(null)

// Formulario Check-in
const nombreHuesped = ref('')

const abrirCheckIn = (hab: Habitacion) => {
  habitacionSeleccionada.value = hab
  nombreHuesped.value = ''
  modalCheckInAbierto.value = true
}

const ejecutarCheckIn = () => {
  if (!nombreHuesped.value.trim() || !habitacionSeleccionada.value) return
  
  const hab = habitaciones.value.find(h => h.id === habitacionSeleccionada.value?.id)
  if (hab) {
    hab.huesped = nombreHuesped.value.trim()
    hab.frigorificoEstado = 'normal' // El minibar pasa a estar activo/normal con huésped
  }
  modalCheckInAbierto.value = false
}

const abrirCheckOut = (hab: Habitacion) => {
  habitacionSeleccionada.value = hab
  modalCheckOutAbierto.value = true
}

const ejecutarCheckOut = () => {
  if (!habitacionSeleccionada.value) return
  
  const hab = habitaciones.value.find(h => h.id === habitacionSeleccionada.value?.id)
  if (hab) {
    // Resolver automáticamente todas las alertas asociadas a esta habitación al salir
    alertas.value.forEach(a => {
      if (a.habitacion === hab.numero) a.resuelta = true
    })
    hab.huesped = null
    hab.frigorificoEstado = 'sin_huesped' // Pasa a estado libre/cerrado
  }
  modalCheckOutAbierto.value = false
}

// Consumos específicos de la habitación seleccionada en el Check-out
const consumosHabitacionSeleccionada = computed(() => {
  if (!habitacionSeleccionada.value) return []
  return alertas.value.filter(a => a.habitacion === habitacionSeleccionada.value?.numero && a.tipo === 'consumo' && !a.resuelta)
})

const totalACobrarCheckOut = computed(() => {
  return consumosHabitacionSeleccionada.value.reduce((acc, curr) => acc + (curr.monto || 0), 0)
})

// --- Acciones de Alertas ---
const resolverAlerta = (id: number) => {
  const a = alertas.value.find(al => al.id === id)
  if (a) a.resuelta = true
}

const cerrarSesion = async () => {
  localStorage.removeItem('vigia_user')
  await navigateTo('/')
}

// --- Clases Estilizadas (Compatibilidad de Diseño) ---
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
  ({ normal: 'Minibar Ok', reponer: 'Por Reponer', sin_huesped: 'Sin Huésped / Cerrado' }[e] ?? e)

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
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
        <p class="nav-section">Recepción</p>
        <button
          v-for="item in navItems" :key="item.id"
          class="nav-item" :class="{ active: panelActivo === item.id }"
          @click="panelActivo = item.id"
        >
          <i :class="`ti ti-${item.icon}`" aria-hidden="true" />
          {{ item.label }}
          <span v-if="item.badgeNum && alertasConsumoPendientes > 0" class="badge">{{ alertasConsumoPendientes }}</span>
        </button>
      </nav>

      <div style="padding: 12px; border-top: 0.5px solid var(--color-border-tertiary, #e5e5e5);">
        <button @click="cerrarSesion" class="nav-item logout-btn">
          <i class="ti ti-logout" /> Cerrar Sesión
        </button>
      </div>
    </aside>

    <main class="main">
      
      <div class="topbar">
        <div>
          <h2>Panel Operativo de Recepción</h2>
          <p style="font-size: 12px; color: var(--color-text-secondary, #666); margin-top: 2px;">Control de Check-in/out y auditoría de consumos</p>
        </div>
        <div class="topbar-right">
          <span class="topbar-user">{{ usuarioActivo.name }}</span>
          <div class="avatar">{{ usuarioActivo.iniciales }}</div>
        </div>
      </div>

      <div class="metrics">
        <div class="metric">
          <p class="metric-label">Habitaciones Disponibles</p>
          <p class="metric-value" style="color: var(--color-text-success, #166534)">{{ habitacionesDisponibles }}</p>
          <p class="metric-sub">listas para Check-in</p>
        </div>
        <div class="metric">
          <p class="metric-label">Habitaciones Ocupadas</p>
          <p class="metric-value">{{ totalOcupadas }}</p>
          <p class="metric-sub">en el hotel actualmente</p>
        </div>
        <div class="metric">
          <p class="metric-label">Cargos por Cobrar</p>
          <p class="metric-value metric-warn">{{ alertasConsumoPendientes }}</p>
          <p class="metric-sub">consumos no procesados</p>
        </div>
      </div>

      <section v-if="panelActivo === 'monitoreo'">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Distribución y Ocupación en Tiempo Real</span>
            <span class="db-tag tag-pg">Filtro: Recepción</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Habitación</th>
                <th>Piso</th>
                <th>Huésped Actual</th>
                <th>Estado Minibar (IoT)</th>
                <th style="text-align: right;">Acciones Operativas</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in habitaciones" :key="h.id">
                <td><strong>{{ h.numero }}</strong></td>
                <td>Piso {{ h.piso }}</td>
                <td :style="{ color: h.huesped ? 'inherit' : 'var(--color-text-tertiary, #aaa)' }">
                  {{ h.huesped ?? 'Disponible / Vacía' }}
                </td>
                <td>
                  <span class="status-pill" :class="frigorificoClase(h.frigorificoEstado)">
                    <span class="dot" :class="h.frigorificoEstado === 'normal' ? 'dot-green' : h.frigorificoEstado === 'reponer' ? 'dot-amber' : 'dot-gray'" />
                    {{ frigorificoLabel(h.frigorificoEstado) }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <button v-if="!h.huesped" class="btn btn-primary" style="font-size: 11px; padding: 4px 10px;" @click="abrirCheckIn(h)">
                    <i class="ti ti-login" /> Check-In
                  </button>
                  <button v-else class="btn" style="font-size: 11px; padding: 4px 10px; border-color: #b91c1c; color: #b91c1c;" @click="abrirCheckOut(h)">
                    <i class="ti ti-logout" /> Check-Out
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else-if="panelActivo === 'recep_alertas'">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Historial de Consumos Registrados por Peso</span>
          </div>
          
          <div v-for="a in alertas.filter(al => al.tipo === 'consumo')" :key="a.id" class="alert-row" :class="{ 'alert-resuelta': a.resuelta }">
            <div class="alert-icon info">
              <i class="ti ti-receipt" />
            </div>
            <div class="alert-body">
              <p class="alert-text"><strong>Habitación {{ a.habitacion }}</strong> — {{ a.mensaje }}</p>
              <p style="font-size:11px; color:var(--color-text-tertiary, #aaa); margin-top:2px;">Detectado a las {{ a.hora }}</p>
            </div>
            <div style="margin-right: 15px; font-weight: 500; font-size: 13px;">
              {{ formatCLP(a.monto || 0) }}
            </div>
            <button v-if="!a.resuelta" class="btn" style="font-size:11px;" @click="resolverAlerta(a.id)">
              Cargar a Cuenta
            </button>
            <span v-else class="status-pill s-active" style="font-size:11px;">Cobrado</span>
          </div>

          <p v-if="alertas.filter(al => al.tipo === 'consumo' && !al.resuelta).length === 0" class="empty-state">
            No hay alertas de consumo pendientes de cobro.
          </p>
        </div>
      </section>

    </main>

    <Teleport to="body">
      <div v-if="modalCheckInAbierto" class="modal-overlay" @click.self="modalCheckInAbierto = false">
        <div class="modal">
          <div class="modal-header">
            <h3>Ingreso de Huésped (Check-In)</h3>
            <button class="btn-icon" @click="modalCheckInAbierto = false"><i class="ti ti-x" /></button>
          </div>
          <div class="modal-body">
            <p style="font-size: 13px; color: #555; margin-bottom: 6px;">Asignando la <strong>Habitación {{ habitacionSeleccionada?.numero }}</strong></p>
            <div class="field">
              <label class="field-label">Nombre Completo del Pasajero</label>
              <input v-model="nombreHuesped" type="text" class="field-input" placeholder="Ej: Marcela Ramos Valenzuela" @keyup.enter="ejecutarCheckIn" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" @click="modalCheckInAbierto = false">Cancelar</button>
            <button class="btn btn-primary" :disabled="!nombreHuesped.trim()" @click="ejecutarCheckIn">Confirmar Ingreso</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="modalCheckOutAbierto" class="modal-overlay" @click.self="modalCheckOutAbierto = false">
        <div class="modal" style="width: 460px;">
          <div class="modal-header">
            <h3>Cierre de Cuenta (Check-Out)</h3>
            <button class="btn-icon" @click="modalCheckOutAbierto = false"><i class="ti ti-x" /></button>
          </div>
          <div class="modal-body">
            <p style="font-size: 13px; color: #111; margin-bottom: 12px;">
              Resumen de la <strong>Habitación {{ habitacionSeleccionada?.numero }}</strong> — Huésped: <strong>{{ habitacionSeleccionada?.huesped }}</strong>
            </p>
            
            <div style="border: 0.5px solid #e5e5e5; border-radius: 8px; padding: 10px; background: #fafafa; margin-bottom: 12px;">
              <p style="font-size: 11px; font-weight: 500; text-transform: uppercase; color: #888; margin-bottom: 6px;">Consumos pendientes detectados en Minibar</p>
              
              <div v-for="c in consumosHabitacionSeleccionada" :key="c.id" style="display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; border-bottom: 0.5px dashed #e5e5e5;">
                <span style="color: #333;">{{ c.mensaje.split(' registrado')[0] }}</span>
                <span style="font-weight: 500;">{{ formatCLP(c.monto || 0) }}</span>
              </div>

              <div v-if="consumosHabitacionSeleccionada.length === 0" style="font-size: 12px; color: var(--color-text-success, #166534); padding: 6px 0; text-align: center;">
                <i class="ti ti-circle-check" /> Sin consumos adicionales de minibar.
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 500; margin-top: 10px; padding-top: 8px; border-top: 0.5px solid #e5e5e5; color: #1a1a2e;">
                <span>Total Consumo Minibar:</span>
                <span>{{ formatCLP(totalACobrarCheckOut) }}</span>
              </div>
            </div>
            <p style="font-size: 11px; color: #666;">Al hacer click en "Procesar Salida", el estado del minibar se liberará y la habitación quedará disponible para el próximo pasajero.</p>
          </div>
          <div class="modal-footer">
            <button class="btn" @click="modalCheckOutAbierto = false">Cancelar</button>
            <button class="btn btn-primary" style="background: #b91c1c; border-color: #b91c1c;" @click="ejecutarCheckOut">Procesar Salida & Facturar</button>
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
  gap: 9px;
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
.logout-btn { color: #b91c1c; margin-top: auto; }
.logout-btn:hover { background: #fee2e2; }

.badge {
  margin-left: auto; font-size: 10px;
  background: var(--color-background-warning, #fef9c3);
  color: var(--color-text-warning, #b45309);
  padding: 1px 6px; border-radius: 10px; font-weight: 500;
}

.main { flex: 1; overflow-y: auto; padding: 22px 24px }
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px }
.topbar h2 { font-size: 18px; font-weight: 500; color: var(--color-text-primary, #111); }
.topbar-right { display: flex; align-items: center; gap: 8px }
.topbar-user { font-size: 12px; color: var(--color-text-secondary, #666) }
.avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--color-background-info, #dbeafe);
  color: var(--color-text-info, #1e40af);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 500;
}

.metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px }
.metric { background: var(--color-background-secondary, #f5f5f4); border-radius: 8px; padding: 12px 14px }
.metric-label { font-size: 12px; color: var(--color-text-secondary, #666); margin-bottom: 4px }
.metric-value { font-size: 22px; font-weight: 500; color: var(--color-text-primary, #111) }
.metric-warn { color: var(--color-text-warning, #b45309) }
.metric-sub { font-size: 11px; color: var(--color-text-tertiary, #aaa); margin-top: 2px }

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

.btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 11px; border-radius: 7px;
  border: 0.5px solid var(--color-border-secondary, #d4d4d4);
  background: transparent; cursor: pointer; font-size: 12px;
  color: var(--color-text-primary, #111); transition: background .1s;
}
.btn:hover:not(:disabled) { background: var(--color-background-secondary, #f5f5f4) }
.btn:disabled { opacity: .4; cursor: not-allowed }
.btn-primary { background: #1a1a2e; border-color: #1a1a2e; color: #fff }
.btn-primary:hover:not(:disabled) { background: #2a2a4e }
.btn-icon { width: 28px; height: 28px; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #666; border-radius: 6px; }
.btn-icon:hover { background: #f5f5f4; }

.status-pill { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500; }
.s-active   { background: var(--color-background-success, #dcfce7); color: var(--color-text-success, #166534) }
.s-inactive { background: var(--color-background-secondary, #f5f5f4); color: var(--color-text-secondary, #666) }
.s-alert    { background: var(--color-background-warning, #fef9c3); color: var(--color-text-warning, #b45309) }

.dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.dot-green { background: #16a34a }
.dot-amber { background: #d97706 }
.dot-gray  { background: #9ca3af }

.db-tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500 }
.tag-pg { background: #336791; color: #fff }

.alert-row { display: flex; align-items: center; gap: 10px; padding: 12px 0; border-bottom: 0.5px solid var(--color-border-tertiary, #e5e5e5) }
.alert-row:last-child { border-bottom: none }
.alert-resuelta { opacity: .4 }
.alert-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.alert-icon.info { background: var(--color-background-info, #dbeafe); color: var(--color-text-info, #1e40af); }
.alert-body { flex: 1; }
.alert-text { font-size: 13px; }
.empty-state { font-size: 13px; color: #aaa; text-align: center; padding: 24px 0; }

/* Modal Modificaciones */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #fff; border-radius: 12px; width: 400px; max-width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 0.5px solid #e5e5e5; }
.modal-header h3 { font-size: 15px; font-weight: 500; }
.modal-body { padding: 16px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 11px; font-weight: 500; color: #666; }
.field-input { padding: 6px 10px; border-radius: 6px; border: 0.5px solid #d4d4d4; font-size: 13px; width: 100%; }
.field-input:focus { outline: none; border-color: #1a1a2e; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 16px; border-top: 0.5px solid #e5e5e5; background: #f9f9f8; }
</style>
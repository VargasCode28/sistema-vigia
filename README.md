
# Sistema Vigía

Este repositorio contiene el cliente web de `Sistema Vigía`, una plataforma de gestión para el control de accesos, usuarios y operaciones internas en entornos de recepción, housekeeping, administración y superadministración.

## Introducción

`Sistema Vigía` ofrece una interfaz moderna y modular desarrollada con Nuxt 3 para garantizar una experiencia de usuario fluida y escalable. El proyecto está estructurado para soportar múltiples roles, rutas protegidas y una administración centralizada de usuarios y productos.

### Objetivos principales

- Proveer una solución web para el manejo de usuarios y permisos.
- Facilitar la gestión de tareas de recepción, housekeeping y administración.
- Integrar autenticación segura con sesiones y API REST.
- Escalar fácilmente con una arquitectura basada en Nuxt y servicios separados.

## Qué se utilizó

- `Nuxt 3` como framework principal para la aplicación cliente.
- `TypeScript` para tipado seguro y mayor mantenibilidad.
- `Vue 3` y la composición de componentes para una UI modular.
- `API REST` en el backend para autenticación, gestión de usuarios y productos.
- `MongoDB` y `PostgreSQL` en el servidor según la configuración de datos.
- `Session` y middleware personalizado para manejo de usuarios autenticados.

## Estructura del proyecto

- `client/` — aplicación Nuxt con las páginas y estilos de la interfaz.
- `server/` — API y servicios que consumen el cliente.
- `app/pages/` — rutas internas para cada rol de usuario.
- `server/api/` — endpoints del backend para autenticación y CRUD.
- `server/utils/` — utilidades comunes como sesión y conexión a BD.

## Instalación

Ejecuta los siguientes comandos desde la carpeta `client`:

```bash
npm install
```

## Desarrollo

Inicia el servidor de desarrollo local en `http://localhost:3000`:

```bash
npm run dev
```

## Producción

Genera el build de producción:

```bash
npm run build
```

Vista previa local del build de producción:

```bash
npm run preview
```

## Imágenes 

Puedes agregar capturas de pantalla, diagramas o demos en el README usando la carpeta `public/` del proyecto.

### Ejemplo de imagen

<img width="1918" height="863" alt="Screenshot 2026-06-24 174021" src="https://github.com/user-attachments/assets/8043eca3-0b0c-418d-bfe4-ab1924f24eba" />

<img width="1917" height="871" alt="image" src="https://github.com/user-attachments/assets/eaf9ea6f-b63c-48c5-8dd3-2a09cadbed6d" />

<img width="1918" height="871" alt="Screenshot 2026-06-24 171632" src="https://github.com/user-attachments/assets/712eb72e-f47f-454c-9ee4-2c6b61c54d12" />


<img width="1915" height="867" alt="Screenshot 2026-06-24 173908" src="https://github.com/user-attachments/assets/8a395e49-d9a7-4f72-b822-9f2eb68b1d02" />

> Nota: para la vista en GitHub, los archivos deben estar en el repositorio y la ruta debe ser accesible desde el README.

## Más información

Consulta la documentación oficial de Nuxt para detalles de despliegue y configuración avanzada:

https://nuxt.com/docs/getting-started/deployment

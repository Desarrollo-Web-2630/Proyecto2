# Editor y visualizador de procesos · Frontend (Entrega 2)

SPA en **Angular 20** que consume la API REST del backend Spring Boot (repo `Proyecto1`).

## Reglas del equipo (obligatorias)

1. **Prohibido `any`.** Ni en TypeScript ni `$any()` en plantillas. `npm run lint` falla si aparece
   (`@typescript-eslint/no-explicit-any` y `@angular-eslint/template/no-any`).
2. **Nada de llamados HTTP directos.** Todo sale por `core/api-client.ts` (axios).
   Lint bloquea `fetch`, `HttpClient` y cualquier `import axios` fuera de ese archivo.
3. Antes de cada push: `npm run lint && npm run build`.

## Arrancar en local

```bash
# 1. Backend (repo Proyecto1)
cd thymeleaf && ./mvnw spring-boot:run -Dspring-boot.run.profiles=h2

# 2. Frontend
npm install
npm start            # http://localhost:4200
```

`ng serve` reenvía `/api/**` a `http://localhost:8080` (`proxy.conf.json`), así que no hace falta
configurar CORS en el backend.

### Sin backend (API simulada)

```bash
npm run mock     # terminal 1, puerto 8080
npm start        # terminal 2
```

Usuarios: `admin@demo.com` (admin), `laura@demo.com` (editor), `pedro@demo.com` (lectura),
`p@p.com` (otra empresa). Contraseña: `Demo12345`.

## Docker

```bash
docker build -t procesos-front .
docker run -p 4200:80 -e BACKEND_URL=http://host.docker.internal:8080 procesos-front
# o todo junto (el backend necesita su propio Dockerfile):
BACKEND_PATH=../Proyecto1/thymeleaf docker compose up --build
```

`ng build` solo genera archivos estáticos (HTML, JS, CSS). En Docker algo tiene que servirlos: para eso
está nginx, que además reenvía `/api/` al backend (`nginx/default.conf.template`).

## Estructura

```text
src/app/
├── core/
│   ├── api-client.ts  axios + X-Empresa-Id + errores
│   ├── api-error.ts
│   ├── auth.guard.ts  protege rutas (sesión / rol)
│   ├── models/        interfaces = DTOs del backend
│   └── services/      un servicio por recurso REST
├── layout/            barra superior
├── shared/            validadores
└── features/
    ├── auth/          login, activar-cuenta (HU-03)
    ├── empresas/      registro-empresa (HU-01)
    ├── usuarios/      gestion-usuarios (HU-02)
    ├── procesos/      lista-procesos (base para HU-04..07)
    └── pools/         HU-21, HU-22, HU-23, HU-24
```

### Cómo agregar una historia

1. Modelo en `core/models/` (interfaces, sin `any`).
2. Servicio en `core/services/` que use `ApiClient` (`this.api.get<T>(...)`).
3. Componente standalone en `features/<modulo>/`, con `signal()` para estado y `async/await` + `try/catch`
   usando `mensajeDeError(e)` para mostrar el error del backend.
4. Ruta lazy en `app.routes.ts`.

## Sesión (entrega 2)

El backend aún no emite token (entrega 3). El login no devuelve la empresa, así que el front la ubica
buscando al usuario en `GET /usuarios` de cada empresa, la guarda en `sessionStorage` y envía
`X-Empresa-Id` en cada petición.

## Pendiente en el backend (HU-21 a HU-24)

### Endpoints de HU-21 a HU-24 (no existen todavía)

`Actividad.laneId` existe, pero no hay entidades `Pool`, `Lane`, `RolProceso` ni compartición. Contrato que usa el front
(todas con `X-Empresa-Id`, errores con `{ timestamp, status, mensaje }`):

| Método | Ruta | Cuerpo / respuesta |
|---|---|---|
| GET / POST | `/api/v1/procesos/{p}/pools` | `PoolRequest { nombre, tipo }` → `Pool { id, nombre, tipo, procesoId }` |
| PUT / DELETE | `/api/v1/procesos/{p}/pools/{poolId}` | `PoolRequest` → `Pool` |
| GET / POST | `/api/v1/procesos/{p}/pools/{poolId}/lanes` | `LaneRequest { nombre, rolProcesoId }` → `Lane { id, nombre, orden, rolProcesoId, poolId }` |
| PUT / DELETE | `/api/v1/procesos/{p}/pools/{poolId}/lanes/{laneId}` | `LaneRequest` → `Lane` |
| PUT | `/api/v1/procesos/{p}/pools/{poolId}/lanes/orden` | `{ lanesIds: number[] }` → `Lane[]` |
| GET | `/api/v1/roles-proceso` | `RolProceso[] { id, nombre, descripcion }` (HU-17..20) |
| GET / PUT | `/api/v1/procesos/{p}/comparticion` | `{ compartido: boolean, empresasIds: number[] }` |
| GET | `/api/v1/procesos/compartidos` | `Proceso[]` de otras empresas compartidos con la mía |
| GET / PUT | `/api/v1/permisos-pool` | `{ crear: RolAcceso[], editar: RolAcceso[], eliminar: RolAcceso[] }` |

`tipo` ∈ `PROPIETARIO | CLIENTE | PROVEEDOR | SISTEMA_EXTERNO`.

Reglas que el backend debe validar (el front ya las valida, pero la API no puede confiar en él):

- **HU-21**: un solo pool `PROPIETARIO` por proceso; los demás son caja negra (no aceptan lanes).
- **HU-22**: 400 al eliminar una lane con actividades; `rolProcesoId` debe existir en la empresa.
- **HU-23**: solo `ADMIN` del dueño cambia la compartición; el proceso compartido es solo lectura para la
  invitada (GET permitido, PUT/POST/DELETE → 403); cada cambio va al historial.
- **HU-24**: `ADMIN` siempre puede, `LECTURA` nunca; 400 al eliminar un rol de proceso usado por una lane.

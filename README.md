# Editor y visualizador de procesos · Frontend (Entrega 2)

SPA en **Angular 20** que consume la API REST del backend Spring Boot (repo `Proyecto1`).

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
front/src/app/
├── core/
│   ├── api.ts         cliente axios (baseURL /api); todas las llamadas HTTP salen de aquí
│   └── api-error.ts   mensajeDeError(): convierte el error del backend en un texto para el usuario
├── models/            una interfaz por entidad, espejo de los DTO del backend
├── services/          un servicio por recurso REST (ProcesoService, RolProcesoService, ...)
├── layout/            barra superior y <router-outlet> de las pantallas con sesión
├── inicio/            página pública
├── auth/              login y activar-cuenta (HU-03)
├── empresas/          empresa-form (HU-01)
├── usuarios/          usuario-list y usuario-form (HU-02)
├── procesos/          proceso-list, proceso-compartido-list y proceso-compartir
├── actividades/       actividad-list y actividad-form (HU-08, HU-09, HU-10)
├── roles/             rol-list y rol-form (HU-17, HU-18, HU-19, HU-20)
└── pools/             pool-list, pool-diagrama y permisos-pool-form (HU-21 a HU-24)
```

Cada módulo tiene su archivo de rutas (`roles/roles.routes.ts`) y `app.routes.ts` lo carga con `loadChildren`.

### Cómo agregar una historia

1. Modelo en `models/`: una interfaz por entidad con los mismos campos del DTO del backend.
2. Servicio en `services/` que use `api` de `core/api.ts` (`api.get<T>(...)`). No se usa `fetch` ni
   `HttpClient`; eslint los rechaza, igual que `any`.
3. Componentes standalone en `<modulo>/<nombre>-list/` y `<modulo>/<nombre>-form/`, con `signal()` para el
   estado y `mensajeDeError(e)` para mostrar el error que devuelve el backend.
4. Rutas del módulo en `<modulo>/<modulo>.routes.ts` y su entrada en `app.routes.ts`.
5. Si se quiere probar sin backend, agregar los endpoints en `mock/server.mjs`.
6. Antes del PR: `npm run lint` y `npm run build`.

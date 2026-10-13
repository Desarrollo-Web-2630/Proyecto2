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

1. Modelo en `core/models/`.
2. Servicio en `core/services/` que use `ApiClient` (`this.api.get<T>(...)`).
3. Componente standalone en `features/<modulo>/`, con `signal()` para estado y `async/await` + `try/catch`
   usando `mensajeDeError(e)` para mostrar el error del backend.
4. Ruta lazy en `app.routes.ts`.
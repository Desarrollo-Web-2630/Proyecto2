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

## Seguridad

### Cómo funciona en el front

1. **Login** (`AuthService.login`): `POST /api/v1/usuarios/login` devuelve `{ token, usuario }`. `SesionService`
   guarda ambos en `sessionStorage` (se borra al cerrar la pestaña) junto con la expiración leída del claim `exp`.
2. **Peticiones** (`authInterceptor`): toda petición privada sale con `Authorization: Bearer <token>`. El front
   **ya no envía `X-Empresa-Id`**: la empresa la saca el backend del token firmado.
3. **Errores** (`errorInterceptor`): un `401` en una ruta privada cierra la sesión y lleva a
   `/login?motivo=expirada&redirect=<ruta>`. Un `403` se deja pasar y la pantalla muestra el mensaje.
4. **Expiración**: `SesionService` programa el cierre de sesión para el instante en que vence el token.
5. **Guards** (solo experiencia de usuario; quien protege los datos es el backend):

| Guard | Dónde | Qué hace |
| --- | --- | --- |
| `authGuard` | layout y todas sus hijas | sin sesión vigente → `/login?redirect=…` |
| `invitadoGuard` | `/`, `/login`, `/registro` | con sesión → `/procesos` |
| `rolGuard('ADMIN', 'EDITOR')` | crear/editar procesos y actividades | otro rol → `/acceso-denegado` |
| `rolGuard('ADMIN')` | invitar usuarios, crear/editar roles | otro rol → `/acceso-denegado` |

En las pantallas, los botones usan `sesion.puedeEditar()`, `sesion.esAdmin()` y `sesion.soloLectura()`.

### Contrato que debe cumplir el backend (Proyecto1)

- `POST /api/v1/usuarios/login` → `200 { "token": "<jwt>", "usuario": UsuarioVistaDTO }`; credenciales malas → `401`
  con el mismo mensaje sin importar si el correo existe.
- JWT firmado (HS256 o RS256) con los claims `sub` (correo), `uid`, `empresaId`, `rol` (`ADMIN|EDITOR|LECTURA`),
  `iat`, `exp`.
- Rutas públicas: el login, `POST /api/v1/empresas` (registro) y `/api/auth/**`. Todo lo demás exige token.
- Token ausente, inválido o vencido → `401`. Token válido pero sin permiso → `403`.
- Permisos: `LECTURA` solo `GET`; `EDITOR` crea y edita; solo `ADMIN` elimina y administra usuarios y roles.
- **Aislamiento**: la empresa se toma del token (nunca del cuerpo, la URL o un encabezado). Un recurso de otra
  empresa responde `404`.
- Respuestas de error con el formato de `ErrorResponse` (`{ timestamp, status, mensaje }`).
- CORS: aceptar el origen del front si no va detrás del proxy (`ng serve` y nginx ya reenvían `/api`).

### Probar con el mock

`npm run mock` ya firma tokens y aplica las mismas reglas (401, 403 por rol y 404 entre empresas). Para ver la
expiración sin esperar una hora: `MOCK_JWT_SEG=30 npm run mock`.

## Estructura

```text
front/src/app/
├── app.component.ts · app.config.ts · app.routes.ts
├── core/                    piezas transversales, sin interfaz
│   ├── guards/              auth.guard, rol.guard, invitado.guard
│   ├── interceptors/        api (antepone /api), auth (Bearer), error (401 → login)
│   └── utils/               api-error (mensajeDeError), jwt (leer exp), redireccion (anti open-redirect)
├── models/                  una interfaz por entidad (espejo de los DTO) + tipos del lienzo y del diagrama
├── services/                un servicio por recurso REST con HttpClient; devuelven Observable
├── routes/                  rutas hijas por módulo (procesos, usuarios, roles), cargadas con loadChildren
├── layout/                  barra superior y <router-outlet> de las pantallas con sesión
├── components/              componentes reutilizables (no tienen ruta propia)
│   ├── lienzo-proceso/      lienzo SVG del editor
│   └── pool-diagrama/       diagrama de pools y lanes con drag and drop
└── pages/                   pantallas enrutadas, agrupadas por módulo
    ├── publico/             landing, inicio
    ├── errores/             acceso-denegado (destino de rolGuard)
    ├── auth/                login, activar-cuenta (HU-03)
    ├── empresas/            empresa-form (HU-01)
    ├── usuarios/            usuario-list, usuario-form (HU-02)
    ├── procesos/            proceso-list, proceso-form (HU-04 a HU-07)
    ├── editor/              editor-proceso
    ├── actividades/         actividad-list, actividad-form (HU-08 a HU-10)
    ├── arcos/               arco-list (HU-11, HU-12)
    ├── gateways/            gateway-list (HU-14)
    ├── roles/               rol-list, rol-form (HU-17 a HU-20)
    ├── pools/               pool-list (HU-21, HU-22)
    └── mensajes/            mensaje-list con clave de correlación (HU-25 a HU-28)
```

### Cómo agregar una historia

1. Modelo en `models/`: una interfaz por entidad con los mismos campos del DTO del backend. Los tipos
   que comparten varios componentes también van aquí, no exportados desde el componente.
2. Servicio en `services/` que inyecte `HttpClient` y devuelva `Observable<T>`. No se usa `fetch` ni
   `axios`; eslint los rechaza, igual que `any`.
3. Pantallas standalone en `pages/<modulo>/<nombre>-list/` y `pages/<modulo>/<nombre>-form/` (lo reutilizable
   sin ruta propia va en `components/`), con `signal()` para el
   estado, `subscribe()` con `takeUntilDestroyed` y `mensajeDeError(e)` para mostrar el error del backend.
4. Rutas del módulo en `routes/<modulo>.routes.ts` y su entrada en `app.routes.ts`.
5. Si se quiere probar sin backend, agregar los endpoints en `mock/server.mjs`.
6. Antes del PR: `npm run lint` y `npm run build`.

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
├── app.component.ts · app.config.ts · app.routes.ts
├── core/                    piezas transversales, sin interfaz
│   ├── guards/              invitado.guard.ts (manda a /procesos a quien ya tiene sesión)
│   ├── interceptors/        api.interceptor.ts (antepone /api y agrega X-Empresa-Id)
│   └── utils/               api-error.ts → mensajeDeError()
├── models/                  una interfaz por entidad (espejo de los DTO) + tipos del lienzo y del diagrama
├── services/                un servicio por recurso REST con HttpClient; devuelven Observable
├── routes/                  rutas hijas por módulo (procesos, usuarios, roles), cargadas con loadChildren
├── layout/                  barra superior y <router-outlet> de las pantallas con sesión
├── components/              componentes reutilizables (no tienen ruta propia)
│   ├── lienzo-proceso/      lienzo SVG del editor
│   └── pool-diagrama/       diagrama de pools y lanes con drag and drop
└── pages/                   pantallas enrutadas, agrupadas por módulo
    ├── publico/             landing, inicio
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

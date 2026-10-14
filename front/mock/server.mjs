// API simulada SOLO para probar el front sin backend (npm run mock).
// Login: admin@demo.com / laura@demo.com (editor) / pedro@demo.com (lectura) / p@p.com (otra empresa), clave Demo12345.
import http from 'node:http';
const db = {
  empresas: [{ id: 1, nombre: 'Empresa Demo', nit: '900000001', correo: 'admin@demo.com' }, { id: 2, nombre: 'Proveedor SAS', nit: '900000002', correo: 'p@p.com' }],
  procesos: [{ id: 1, nombre: 'Solicitud de vacaciones', descripcion: 'd', categoria: 'Talento Humano', estado: 'BORRADOR', empresaId: 1 }],
  roles: [{ id: 1, nombre: 'Empleado', descripcion: 'Quien solicita' }, { id: 2, nombre: 'Jefe inmediato', descripcion: 'Aprueba' }, { id: 3, nombre: 'Talento Humano', descripcion: 'Registra' }],
  usuarios: [
    { id: 1, nombre: 'Admin Demo', correo: 'admin@demo.com', rolAcceso: 'ADMIN', activo: true, empresaId: 1 },
    { id: 2, nombre: 'Laura Editora', correo: 'laura@demo.com', rolAcceso: 'EDITOR', activo: true, empresaId: 1 },
    { id: 3, nombre: 'Pedro Lector', correo: 'pedro@demo.com', rolAcceso: 'LECTURA', activo: true, empresaId: 1 },
    { id: 4, nombre: 'Admin Proveedor', correo: 'p@p.com', rolAcceso: 'ADMIN', activo: true, empresaId: 2 },
  ],
  pools: [], lanes: [], actividades: [], arcos: [], comp: { compartido: false, empresasIds: [] },
  permisos: { crear: ['ADMIN', 'EDITOR'], editar: ['ADMIN', 'EDITOR'], eliminar: ['ADMIN'] },
};
let seq = 100;
const send = (res, s, b) => { res.writeHead(s, { 'Content-Type': 'application/json' }); res.end(b === undefined ? '' : JSON.stringify(b)); };
const err = (res, s, m) => send(res, s, { timestamp: new Date().toISOString(), status: s, mensaje: m });
const validarActividad = (b) => !b.nombre?.trim() ? 'El nombre de la actividad es obligatorio'
  : !b.tipoActividad?.trim() ? 'El tipo de actividad es obligatorio'
  : b.laneId == null ? 'La actividad debe estar asociada a una lane'
  : (b.posicionX == null || b.posicionY == null) ? 'La posicion de la actividad en el diagrama es obligatoria'
  : (b.posicionX < 0 || b.posicionY < 0) ? 'La posicion de la actividad no puede ser negativa' : null;
http.createServer((req, res) => {
  let body = ''; req.on('data', c => body += c); req.on('end', () => {
    const b = body ? JSON.parse(body) : {}; const u = new URL(req.url, 'http://x'); const u2 = u; const p = u.pathname; const m = req.method;
    console.log(m, p, req.headers['x-empresa-id'] ?? '-');
    let r;
    if (m === 'POST' && p === '/api/v1/empresas') { if (db.empresas.some(e => e.nit === b.nit)) return err(res, 400, 'Ya existe una empresa con ese NIT'); const e = { id: ++seq, ...b }; db.empresas.push(e); return send(res, 201, e); }
    if (m === 'GET' && p === '/api/v1/empresas') return send(res, 200, db.empresas);
    if ((r = p.match(/^\/api\/v1\/empresas\/(\d+)$/))) return send(res, 200, db.empresas.find(e => e.id == r[1]));
    // Igual que el backend real: el login NO devuelve empresaId
    if (p === '/api/v1/usuarios/login') { const u = db.usuarios.find(x => x.correo === b.correo && x.activo); return u && b.password === 'Demo12345' ? send(res, 200, u) : send(res, 401); }
    if (p === '/api/v1/usuarios' && m === 'GET') return send(res, 200, db.usuarios.filter(u => u.empresaId == (req.headers['x-empresa-id'] ?? 1)).map(({ empresaId, ...u }) => u));
    if (p === '/api/v1/usuarios' && m === 'POST') { if (db.usuarios.some(u => u.correo === b.correo)) return err(res, 400, `Ya existe un usuario con el correo '${b.correo}'`); const u = { id: ++seq, nombre: b.nombre, correo: b.correo, rolAcceso: b.rolAcceso, activo: false, empresaId: +(req.headers['x-empresa-id'] ?? 1) }; db.usuarios.push(u); const { empresaId, ...v } = u; return send(res, 201, v); }
    if ((r = p.match(/^\/api\/v1\/usuarios\/(\d+)\/rol$/))) { const u = db.usuarios.find(x => x.id == r[1]); u.rolAcceso = u2.searchParams.get('rolAcceso'); return send(res, 200, u); }
    if ((r = p.match(/^\/api\/v1\/usuarios\/(\d+)\/desactivar$/))) { const u = db.usuarios.find(x => x.id == r[1]); u.activo = false; return send(res, 200, u); }
    if (p === '/api/auth/reenviar-verificacion') return send(res, 200, { verificado: false, mensaje: 'Si el correo existe, se envió un nuevo enlace', correo: b.correo });
    if (p === '/api/auth/activar-cuenta') return send(res, 200, { verificado: true, mensaje: 'Cuenta activada', correo: 'a@a.com' });
    if (p === '/api/v1/procesos/compartidos') return send(res, 200, []);
    if (p === '/api/v1/procesos') return send(res, 200, db.procesos);
    if (p === '/api/v1/roles-proceso') return send(res, 200, db.roles);
    if (p === '/api/v1/permisos-pool') { if (m === 'PUT') db.permisos = b; return send(res, 200, db.permisos); }
    if ((r = p.match(/^\/api\/v1\/procesos\/(\d+)$/))) return send(res, 200, db.procesos[0]);
    // Actividades (HU-08/09/10): mismas validaciones y mensajes que ActividadService
    if ((r = p.match(/^\/api\/v1\/procesos\/(\d+)\/actividades$/))) {
      if (m === 'GET') return send(res, 200, db.actividades);
      if (m === 'POST') {
        const faltan = validarActividad(b); if (faltan) return err(res, 400, faltan);
        const nombre = b.nombre.trim();
        if (db.actividades.some(a => a.nombre === nombre)) return err(res, 400, `Ya existe una actividad llamada '${nombre}' en el proceso`);
        const a = { id: ++seq, nombre, tipoActividad: b.tipoActividad.trim(), posicionX: b.posicionX, posicionY: b.posicionY, laneId: b.laneId, procesoId: +r[1] };
        db.actividades.push(a); return send(res, 201, a);
      }
    }
    if ((r = p.match(/^\/api\/v1\/procesos\/\d+\/actividades\/(\d+)$/))) {
      const a = db.actividades.find(x => x.id == r[1]);
      if (!a) return err(res, 400, 'La actividad no existe o no pertenece a su empresa');
      if (m === 'PUT') {
        const faltan = validarActividad(b); if (faltan) return err(res, 400, faltan);
        const nombre = b.nombre.trim();
        if (db.actividades.some(x => x.nombre === nombre && x.id !== a.id)) return err(res, 400, `Ya existe una actividad llamada '${nombre}' en el proceso`);
        Object.assign(a, { nombre, tipoActividad: b.tipoActividad.trim(), laneId: b.laneId, posicionX: b.posicionX, posicionY: b.posicionY });
        return send(res, 200, a);
      }
      if (m === 'DELETE') {
        // Borrado en cascada: los arcos conectados también se van
        db.arcos = db.arcos.filter(x => x.origenId !== a.id && x.destinoId !== a.id);
        db.actividades.splice(db.actividades.indexOf(a), 1); return send(res, 204);
      }
      return send(res, 200, a);
    }
    // Arcos: solo lo necesario para probar la advertencia de HU-10 (el CRUD completo es de HU-11 a HU-13)
    // Crear uno a mano:  curl -X POST localhost:8080/api/v1/procesos/1/arcos -H 'Content-Type: application/json' -d '{"origenId":900,"destinoId":101}'
    if ((r = p.match(/^\/api\/v1\/procesos\/(\d+)\/arcos$/))) {
      if (m === 'POST') {
        const o = db.actividades.find(x => x.id == b.origenId), d = db.actividades.find(x => x.id == b.destinoId);
        if (!o || !d) return err(res, 400, 'Origen o destino no existen');
        const x = { id: ++seq, nombre: b.nombre ?? null, condicion: null, origenId: o.id, origenNombre: o.nombre, destinoId: d.id, destinoNombre: d.nombre, procesoId: +r[1] };
        db.arcos.push(x); return send(res, 201, x);
      }
      return send(res, 200, db.arcos);
    }
    if ((r = p.match(/^\/api\/v1\/procesos\/(\d+)\/comparticion$/))) { if (m === 'PUT') db.comp = b; return send(res, 200, db.comp); }
    if ((r = p.match(/^\/api\/v1\/procesos\/(\d+)\/pools$/))) { if (m === 'POST') { const x = { id: ++seq, procesoId: 1, ...b }; db.pools.push(x); return send(res, 201, x); } return send(res, 200, db.pools); }
    if ((r = p.match(/^\/api\/v1\/procesos\/\d+\/pools\/(\d+)$/))) { const i = db.pools.findIndex(x => x.id == r[1]); if (m === 'DELETE') { db.pools.splice(i, 1); return send(res, 204); } Object.assign(db.pools[i], b); return send(res, 200, db.pools[i]); }
    if ((r = p.match(/^\/api\/v1\/procesos\/\d+\/pools\/(\d+)\/lanes\/orden$/))) { b.lanesIds.forEach((id, k) => db.lanes.find(l => l.id == id).orden = k); return send(res, 200, db.lanes); }
    if ((r = p.match(/^\/api\/v1\/procesos\/\d+\/pools\/(\d+)\/lanes$/))) { if (m === 'POST') { const l = { id: ++seq, poolId: +r[1], orden: db.lanes.length, ...b }; db.lanes.push(l); if (db.lanes.length === 2) db.actividades.push({ id: 900, nombre: 'Revisar solicitud', tipoActividad: 'TAREA', laneId: l.id, posicionX: 1, posicionY: 1, procesoId: 1 }); return send(res, 201, l); } return send(res, 200, db.lanes.filter(l => l.poolId == r[1])); }
    if ((r = p.match(/^\/api\/v1\/procesos\/\d+\/pools\/\d+\/lanes\/(\d+)$/))) { const i = db.lanes.findIndex(x => x.id == r[1]); if (m === 'DELETE') { db.lanes.splice(i, 1); return send(res, 204); } Object.assign(db.lanes[i], b); return send(res, 200, db.lanes[i]); }
    err(res, 404, 'La ruta solicitada no existe');
  });
}).listen(8080, () => console.log('mock 8080'));

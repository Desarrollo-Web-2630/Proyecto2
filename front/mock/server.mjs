// API simulada para probar sin backend; clave de todos los usuarios: Demo12345
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
// Un rol está en uso si alguna lane lo usa
const procesosDondeSeUsa = (rolId) => db.lanes.some(l => l.rolProcesoId == rolId) && db.procesos[0] ? [{ id: db.procesos[0].id, nombre: db.procesos[0].nombre }] : [];
const rolDetalle = (r) => { const usos = procesosDondeSeUsa(r.id); return { ...r, procesosEnUso: usos, eliminable: usos.length === 0 }; };
const validarRol = (b) => !b.nombre?.trim() ? 'El nombre del rol es obligatorio'
  : !b.descripcion?.trim() ? 'La descripcion del rol es obligatoria'
  : b.nombre.trim().length > 100 ? 'El nombre del rol no puede superar 100 caracteres'
  : b.descripcion.trim().length > 500 ? 'La descripcion del rol no puede superar 500 caracteres' : null;
const validarProceso = (b) => !b.nombre?.trim() ? 'El nombre del proceso es obligatorio'
  : !b.descripcion?.trim() ? 'La descripción del proceso es obligatoria'
  : !b.categoria?.trim() ? 'La categoría del proceso es obligatoria'
  : b.nombre.trim().length > 255 ? 'El nombre no puede superar los 255 caracteres'
  : b.descripcion.trim().length > 255 ? 'La descripción no puede superar los 255 caracteres'
  : b.categoria.trim().length > 255 ? 'La categoría no puede superar los 255 caracteres' : null;
http.createServer((req, res) => {
  let body = ''; req.on('data', c => body += c); req.on('end', () => {
    const b = body ? JSON.parse(body) : {}; const u = new URL(req.url, 'http://x'); const u2 = u; const p = u.pathname; const m = req.method;
    const empresaId = +(req.headers['x-empresa-id'] ?? 1);
    console.log(m, p, req.headers['x-empresa-id'] ?? '-');
    let r;
    if (m === 'POST' && p === '/api/v1/empresas') { if (db.empresas.some(e => e.nit === b.nit)) return err(res, 400, 'Ya existe una empresa con ese NIT'); const e = { id: ++seq, ...b }; db.empresas.push(e); return send(res, 201, e); }
    if (m === 'GET' && p === '/api/v1/empresas') return send(res, 200, db.empresas);
    if ((r = p.match(/^\/api\/v1\/empresas\/(\d+)$/))) return send(res, 200, db.empresas.find(e => e.id == r[1]));
    // Como el backend real, el login no devuelve empresaId
    if (p === '/api/v1/usuarios/login') { const u = db.usuarios.find(x => x.correo === b.correo && x.activo); if (!u || b.password !== 'Demo12345') return send(res, 401); const { empresaId: _e, ...v } = u; return send(res, 200, v); }
    if (p === '/api/v1/usuarios' && m === 'GET') return send(res, 200, db.usuarios.filter(u => u.empresaId == empresaId).map(({ empresaId: _e, ...u }) => u));
    if (p === '/api/v1/usuarios' && m === 'POST') { if (db.usuarios.some(u => u.correo === b.correo)) return err(res, 400, `Ya existe un usuario con el correo '${b.correo}'`); const u = { id: ++seq, nombre: b.nombre, correo: b.correo, rolAcceso: b.rolAcceso, activo: false, empresaId }; db.usuarios.push(u); const { empresaId: _e, ...v } = u; return send(res, 201, v); }
    if ((r = p.match(/^\/api\/v1\/usuarios\/(\d+)\/rol$/))) { const u = db.usuarios.find(x => x.id == r[1]); u.rolAcceso = u2.searchParams.get('rolAcceso'); return send(res, 200, u); }
    if ((r = p.match(/^\/api\/v1\/usuarios\/(\d+)\/desactivar$/))) { const u = db.usuarios.find(x => x.id == r[1]); u.activo = false; return send(res, 200, u); }
    if (p === '/api/auth/reenviar-verificacion') return send(res, 200, { verificado: false, mensaje: 'Si el correo existe, se envió un nuevo enlace', correo: b.correo });
    if (p === '/api/auth/activar-cuenta') return send(res, 200, { verificado: true, mensaje: 'Cuenta activada', correo: 'a@a.com' });
    if (p === '/api/v1/procesos/compartidos') return send(res, 200, []);
    // Procesos (HU-04 a HU-07)
    if (p === '/api/v1/procesos/buscar' && m === 'GET') {
      const qNombre = (u.searchParams.get('nombre') ?? '').trim().toLowerCase();
      const qCategoria = (u.searchParams.get('categoria') ?? '').trim().toLowerCase();
      const qEstado = (u.searchParams.get('estado') ?? '').trim();
      const incluirInactivos = u.searchParams.get('incluirInactivos') === 'true';
      const page = Math.max(+(u.searchParams.get('page') ?? 0), 0), size = Math.min(Math.max(+(u.searchParams.get('size') ?? 10), 1), 100);
      const todos = db.procesos.filter(pr =>
        pr.empresaId == empresaId &&
        (!qNombre || pr.nombre.toLowerCase().includes(qNombre)) &&
        (!qCategoria || pr.categoria.toLowerCase() === qCategoria) &&
        (!qEstado || pr.estado === qEstado) &&
        (incluirInactivos || pr.estado !== 'INACTIVO')
      ).sort((a, c) => a.nombre.localeCompare(c.nombre));
      return send(res, 200, { content: todos.slice(page * size, page * size + size), totalElements: todos.length, totalPages: Math.ceil(todos.length / size), number: page, size });
    }
    if (p === '/api/v1/procesos') {
      if (m === 'POST') {
        const faltan = validarProceso(b); if (faltan) return err(res, 400, faltan);
        const nombre = b.nombre.trim();
        if (db.procesos.some(pr => pr.empresaId == empresaId && pr.nombre.toLowerCase() === nombre.toLowerCase())) return err(res, 400, `Ya existe un proceso llamado '${nombre}' en la empresa`);
        const nuevo = { id: ++seq, nombre, descripcion: b.descripcion.trim(), categoria: b.categoria.trim(), estado: 'BORRADOR', empresaId };
        db.procesos.push(nuevo); return send(res, 201, nuevo);
      }
      const incluirInactivos = u.searchParams.get('incluirInactivos') === 'true';
      return send(res, 200, db.procesos.filter(pr => pr.empresaId == empresaId && (incluirInactivos || pr.estado !== 'INACTIVO')));
    }
    // Roles de proceso
    if (p === '/api/v1/roles-proceso/buscar' && m === 'GET') {
      const q = (u.searchParams.get('nombre') ?? '').trim().toLowerCase();
      const page = Math.max(+(u.searchParams.get('page') ?? 0), 0), size = Math.min(Math.max(+(u.searchParams.get('size') ?? 10), 1), 100);
      const todos = db.roles.filter(r => !q || r.nombre.toLowerCase().includes(q)).sort((a, b) => a.nombre.localeCompare(b.nombre)).map(rolDetalle);
      return send(res, 200, { content: todos.slice(page * size, page * size + size), totalElements: todos.length, totalPages: Math.ceil(todos.length / size), number: page, size });
    }
    if (p === '/api/v1/roles-proceso') {
      if (m === 'POST') {
        const faltan = validarRol(b); if (faltan) return err(res, 400, faltan);
        const nombre = b.nombre.trim();
        if (db.roles.some(r => r.nombre.toLowerCase() === nombre.toLowerCase())) return err(res, 400, `Ya existe un rol llamado '${nombre}' en la empresa`);
        const r = { id: ++seq, nombre, descripcion: b.descripcion.trim() }; db.roles.push(r); return send(res, 201, rolDetalle(r));
      }
      return send(res, 200, db.roles.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)).map(rolDetalle));
    }
    if ((r = p.match(/^\/api\/v1\/roles-proceso\/(\d+)$/))) {
      const rol = db.roles.find(x => x.id == r[1]);
      if (!rol) return err(res, 400, 'El rol no existe o no pertenece a su empresa');
      if (m === 'PUT') {
        const faltan = validarRol(b); if (faltan) return err(res, 400, faltan);
        const nombre = b.nombre.trim();
        if (db.roles.some(x => x.id !== rol.id && x.nombre.toLowerCase() === nombre.toLowerCase())) return err(res, 400, `Ya existe un rol llamado '${nombre}' en la empresa`);
        Object.assign(rol, { nombre, descripcion: b.descripcion.trim() }); return send(res, 200, rolDetalle(rol));
      }
      if (m === 'DELETE') {
        const usos = procesosDondeSeUsa(rol.id);
        if (usos.length) return err(res, 400, `No se puede eliminar el rol '${rol.nombre}' porque esta en uso en los procesos: ${usos.map(x => x.nombre).join(', ')}`);
        db.roles.splice(db.roles.indexOf(rol), 1); return send(res, 204);
      }
      return send(res, 200, rolDetalle(rol));
    }
    if (p === '/api/v1/permisos-pool') { if (m === 'PUT') db.permisos = b; return send(res, 200, db.permisos); }
    if ((r = p.match(/^\/api\/v1\/procesos\/(\d+)\/(publicar|inactivar|reactivar)$/))) {
      const proc = db.procesos.find(x => x.id == r[1] && x.empresaId == empresaId);
      if (!proc) return err(res, 400, 'El proceso no existe o no pertenece a su empresa');
      if (r[2] === 'publicar') { if (proc.estado === 'PUBLICADO') return err(res, 400, 'El proceso ya está publicado'); proc.estado = 'PUBLICADO'; }
      if (r[2] === 'inactivar') { proc.estado = 'INACTIVO'; }
      if (r[2] === 'reactivar') { if (proc.estado !== 'INACTIVO') return err(res, 400, 'El proceso no está inactivo'); proc.estado = 'BORRADOR'; }
      return send(res, 200, proc);
    }
    if ((r = p.match(/^\/api\/v1\/procesos\/(\d+)$/))) {
      const proc = db.procesos.find(x => x.id == r[1] && x.empresaId == empresaId);
      if (!proc) return err(res, 400, 'El proceso no existe o no pertenece a su empresa');
      if (m === 'PUT') {
        const faltan = validarProceso(b); if (faltan) return err(res, 400, faltan);
        const nombre = b.nombre.trim();
        if (db.procesos.some(x => x.id !== proc.id && x.empresaId == empresaId && x.nombre.toLowerCase() === nombre.toLowerCase())) return err(res, 400, `Ya existe un proceso llamado '${nombre}' en la empresa`);
        Object.assign(proc, { nombre, descripcion: b.descripcion.trim(), categoria: b.categoria.trim() });
        return send(res, 200, proc);
      }
      if (m === 'DELETE') { db.procesos.splice(db.procesos.indexOf(proc), 1); return send(res, 204); }
      return send(res, 200, proc);
    }
    // Actividades
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
    if ((r = p.match(/^\/api\/v1\/procesos\/\d+\/actividades\/(\d+)\/mover$/)) && m === 'POST') {
      const a = db.actividades.find(x => x.id == r[1]);
      if (!a) return err(res, 400, 'La actividad no existe o no pertenece a su empresa');
      const px = +(u.searchParams.get('posicionX') ?? -1), py = +(u.searchParams.get('posicionY') ?? -1);
      if (px < 0 || py < 0) return err(res, 400, 'La posicion de la actividad no puede ser negativa');
      a.posicionX = px; a.posicionY = py;
      return send(res, 200, a);
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
    // Arcos: solo lo necesario para HU-10
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

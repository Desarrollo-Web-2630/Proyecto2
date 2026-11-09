import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { mensajeDeError } from '../../../core/utils/api-error';
import { Actividad } from '../../../models/actividad.model';
import { Arco } from '../../../models/arco.model';
import { Gateway, TipoGateway } from '../../../models/gateway.model';
import { Lane } from '../../../models/lane.model';
import { Mensaje } from '../../../models/mensaje.model';
import { Pool, TipoPool } from '../../../models/pool.model';
import { Proceso } from '../../../models/proceso.model';
import { RolProceso } from '../../../models/rol-proceso.model';
import { ActividadService } from '../../../services/actividad.service';
import { ArcoService } from '../../../services/arco.service';
import { ElementoService } from '../../../services/elemento.service';
import { GatewayService } from '../../../services/gateway.service';
import { LaneService } from '../../../services/lane.service';
import { MensajeService } from '../../../services/mensaje.service';
import { PoolService } from '../../../services/pool.service';
import { ProcesoService } from '../../../services/proceso.service';
import { RolProcesoService } from '../../../services/rol-proceso.service';
import { SesionService } from '../../../services/sesion.service';
import {
  ClavePaleta,
  CrearArco,
  CrearMensaje,
  MoverActividad,
  MoverGateway,
  Seleccion,
  SoltarPaleta
} from '../../../models/lienzo.model';
import { LienzoProcesoComponent } from '../../../components/lienzo-proceso/lienzo-proceso.component';

type Dialogo =
  | { tipo: 'pool'; tipoPool: TipoPool }
  | { tipo: 'lane' }
  | { tipo: 'actividad'; laneId: number; x: number; y: number }
  | { tipo: 'gateway'; x: number; y: number }
  | { tipo: 'mensaje'; origenId: number; poolDestinoId: number }
  | { tipo: 'arco'; origenId: number; destinoId: number };

interface ItemPaleta {
  clave: ClavePaleta;
  texto: string;
  ayuda: string;
  forma: string;
}

interface Datos {
  pools: Pool[];
  lanes: Lane[];
  actividades: Actividad[];
  gateways: Gateway[];
  arcos: Arco[];
  mensajes: Mensaje[];
}

const NOMBRES_POOL: Record<TipoPool, string> = {
  PROPIETARIO: 'Mi empresa',
  CLIENTE: 'Cliente',
  PROVEEDOR: 'Proveedor',
  SISTEMA_EXTERNO: 'Sistema externo'
};

const NOMBRES_GATEWAY: Record<TipoGateway, string> = {
  EXCLUSIVO: 'Decisión',
  PARALELO: 'Paralelo',
  INCLUSIVO: 'Inclusivo'
};

// Editor visual del proceso (HU-08 a HU-28)
@Component({
  selector: 'app-editor-proceso',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, LienzoProcesoComponent],
  templateUrl: './editor-proceso.component.html',
  styleUrl: './editor-proceso.component.css'
})
export class EditorProcesoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly procesoService = inject(ProcesoService);
  private readonly poolService = inject(PoolService);
  private readonly laneService = inject(LaneService);
  private readonly actividadService = inject(ActividadService);
  private readonly gatewayService = inject(GatewayService);
  private readonly arcoService = inject(ArcoService);
  private readonly mensajeService = inject(MensajeService);
  private readonly rolService = inject(RolProcesoService);
  private readonly elementoService = inject(ElementoService);
  private readonly sesion = inject(SesionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly procesoId = input.required<string>();

  protected readonly grupos: { titulo: string; items: ItemPaleta[] }[] = [
    {
      titulo: 'Participantes',
      items: [
        { clave: 'POOL_PROPIETARIO', texto: 'Pool de la empresa', ayuda: 'El proceso de tu empresa', forma: 'pool' },
        { clave: 'POOL_CLIENTE', texto: 'Cliente', ayuda: 'Participante externo', forma: 'externo' },
        { clave: 'POOL_PROVEEDOR', texto: 'Proveedor', ayuda: 'Participante externo', forma: 'externo' },
        { clave: 'POOL_SISTEMA_EXTERNO', texto: 'Sistema externo', ayuda: 'Por ejemplo, servicio de correo', forma: 'externo' }
      ]
    },
    {
      titulo: 'Estructura',
      items: [{ clave: 'LANE', texto: 'Lane', ayuda: 'División por rol dentro del pool', forma: 'lane' }]
    },
    {
      titulo: 'Flujo',
      items: [
        { clave: 'ACTIVIDAD', texto: 'Actividad', ayuda: 'Una tarea del proceso', forma: 'actividad' },
        { clave: 'GATEWAY_EXCLUSIVO', texto: 'Gateway exclusivo', ayuda: 'Un solo camino', forma: 'gateway-x' },
        { clave: 'GATEWAY_PARALELO', texto: 'Gateway paralelo', ayuda: 'Todos los caminos', forma: 'gateway-p' },
        { clave: 'GATEWAY_INCLUSIVO', texto: 'Gateway inclusivo', ayuda: 'Uno o varios caminos', forma: 'gateway-i' }
      ]
    }
  ];

  protected readonly tiposActividad = [
    { valor: 'TAREA', texto: 'Tarea' },
    { valor: 'TAREA_USUARIO', texto: 'Tarea de usuario' },
    { valor: 'TAREA_SERVICIO', texto: 'Tarea de servicio' },
    { valor: 'TAREA_MANUAL', texto: 'Tarea manual' }
  ];

  protected readonly tiposGateway: { valor: TipoGateway; texto: string }[] = [
    { valor: 'EXCLUSIVO', texto: 'Exclusivo (un solo camino)' },
    { valor: 'PARALELO', texto: 'Paralelo (todos los caminos)' },
    { valor: 'INCLUSIVO', texto: 'Inclusivo (uno o varios caminos)' }
  ];

  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly mensajeCarga = signal('');
  protected readonly error = signal('');
  protected readonly aviso = signal('');
  protected readonly proceso = signal<Proceso | null>(null);
  protected readonly roles = signal<RolProceso[]>([]);
  protected readonly pools = signal<Pool[]>([]);
  protected readonly lanes = signal<Lane[]>([]);
  protected readonly actividades = signal<Actividad[]>([]);
  protected readonly gateways = signal<Gateway[]>([]);
  protected readonly arcos = signal<Arco[]>([]);
  protected readonly mensajes = signal<Mensaje[]>([]);
  protected readonly seleccion = signal<Seleccion | null>(null);
  protected readonly itemPaleta = signal<ClavePaleta | null>(null);
  protected readonly dialogo = signal<Dialogo | null>(null);
  protected readonly guardando = signal(false);

  protected readonly editable = this.sesion.puedeEditar;
  protected readonly puedeEliminar = this.sesion.esAdmin;
  protected readonly propietario = computed(() => this.pools().find(p => p.tipo === 'PROPIETARIO') ?? null);

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(255)]],
    tipo: [''],
    rolId: [null as number | null],
    clave: [''],
    condicion: ['']
  });

  protected readonly props = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(255)]],
    tipo: [''],
    rolId: [null as number | null],
    clave: [''],
    condicion: ['']
  });

  protected readonly elegida = computed(() => {
    const s = this.seleccion();
    if (!s) {
      return null;
    }
    switch (s.tipo) {
      case 'actividad':
        return this.actividades().find(x => x.id === s.id) ?? null;
      case 'gateway':
        return this.gateways().find(x => x.id === s.id) ?? null;
      case 'arco':
        return this.arcos().find(x => x.id === s.id) ?? null;
      case 'mensaje':
        return this.mensajes().find(x => x.id === s.id) ?? null;
      case 'lane':
        return this.lanes().find(x => x.id === s.id) ?? null;
      case 'pool':
        return this.pools().find(x => x.id === s.id) ?? null;
    }
  });

  protected readonly origenArcoEsGateway = computed(() => {
    const d = this.dialogo();
    return d?.tipo === 'arco' && this.gateways().some(g => g.id === d.origenId);
  });

  protected readonly arcoOrigen = computed(() => {
    const el = this.elegida();
    return this.seleccion()?.tipo === 'arco' && el ? (el as Arco).origenId : null;
  });

  protected readonly arcoDestino = computed(() => {
    const el = this.elegida();
    return this.seleccion()?.tipo === 'arco' && el ? (el as Arco).destinoId : null;
  });

  protected readonly mensajeDestino = computed(() => {
    const el = this.elegida();
    return this.seleccion()?.tipo === 'mensaje' && el ? (el as Mensaje).poolDestinoId : 0;
  });

  constructor() {
    effect(() => {
      this.rellenarPropiedades(this.seleccion(), this.elegida());
    });
  }

  private get id(): number {
    return Number(this.procesoId());
  }

  ngOnInit(): void {
    forkJoin({ proceso: this.procesoService.get(this.id), roles: this.rolService.list(), datos: this.datos() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ proceso, roles, datos }) => {
          this.proceso.set(proceso);
          this.roles.set(roles);
          this.aplicar(datos);
          this.status.set('success');
        },
        error: err => {
          this.mensajeCarga.set(mensajeDeError(err, 'No fue posible cargar el proceso'));
          this.status.set('error');
        }
      });
  }

  // Paleta

  empezarArrastre(event: DragEvent, clave: ClavePaleta): void {
    if (!this.editable()) {
      event.preventDefault();
      return;
    }
    event.dataTransfer?.setData('text/plain', clave);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
    this.itemPaleta.set(clave);
  }

  terminarArrastre(): void {
    this.itemPaleta.set(null);
  }

  // Eventos del lienzo

  alSoltarPaleta(s: SoltarPaleta): void {
    this.itemPaleta.set(null);
    this.error.set('');
    this.aviso.set('');
    if (s.clave.startsWith('POOL_')) {
      const tipoPool = s.clave.replace('POOL_', '') as TipoPool;
      this.abrir({ tipo: 'pool', tipoPool }, NOMBRES_POOL[tipoPool]);
    } else if (s.clave === 'LANE') {
      this.abrir({ tipo: 'lane' }, 'Nuevo lane');
    } else if (s.clave === 'ACTIVIDAD' && s.laneId !== null) {
      this.abrir({ tipo: 'actividad', laneId: s.laneId, x: s.x, y: s.y }, '', 'TAREA');
    } else if (s.laneId !== null) {
      const tipo = s.clave.replace('GATEWAY_', '') as TipoGateway;
      this.abrir({ tipo: 'gateway', x: s.x, y: s.y }, NOMBRES_GATEWAY[tipo], tipo);
    }
  }

  alMoverActividad(m: MoverActividad): void {
    const { actividad, laneId, x, y } = m;
    this.actividades.update(lista =>
      lista.map(a => (a.id === actividad.id ? { ...a, laneId, posicionX: x, posicionY: y } : a))
    );
    const accion: Observable<unknown> =
      actividad.laneId === laneId
        ? this.actividadService.mover(this.id, actividad.id, x, y)
        : this.actividadService.update(this.id, actividad.id, {
            nombre: actividad.nombre,
            tipoActividad: actividad.tipoActividad,
            laneId,
            posicionX: x,
            posicionY: y
          });
    this.ejecutar(accion, 'No fue posible mover la actividad');
  }

  alMoverGateway(m: MoverGateway): void {
    this.gateways.update(lista =>
      lista.map(g => (g.id === m.gateway.id ? { ...g, posicionX: m.x, posicionY: m.y } : g))
    );
    this.ejecutar(this.elementoService.mover(this.id, m.gateway.id, m.x, m.y), 'No fue posible mover el gateway');
  }

  alReordenar(ids: number[]): void {
    const propietario = this.propietario();
    if (!propietario) {
      return;
    }
    this.ejecutar(this.laneService.ordenar(this.id, propietario.id, ids), 'No fue posible reordenar los lanes');
  }

  alCrearArco(a: CrearArco): void {
    const origenEsGateway = this.gateways().some(g => g.id === a.origenId);
    if (origenEsGateway) {
      this.abrir({ tipo: 'arco', origenId: a.origenId, destinoId: a.destinoId }, '');
      return;
    }
    this.ejecutar(
      this.arcoService.create(this.id, { nombre: null, condicion: null, origenId: a.origenId, destinoId: a.destinoId }),
      'No fue posible crear el arco'
    );
  }

  alCrearMensaje(m: CrearMensaje): void {
    this.abrir({ tipo: 'mensaje', origenId: m.origenId, poolDestinoId: m.poolDestinoId }, '');
  }

  // Diálogo de creación

  titulo(d: Dialogo): string {
    switch (d.tipo) {
      case 'pool':
        return d.tipoPool === 'PROPIETARIO' ? 'Nuevo pool de la empresa' : `Nuevo participante: ${NOMBRES_POOL[d.tipoPool].toLowerCase()}`;
      case 'lane':
        return 'Nuevo lane';
      case 'actividad':
        return 'Nueva actividad';
      case 'gateway':
        return 'Nuevo gateway';
      case 'mensaje':
        return 'Nuevo mensaje';
      case 'arco':
        return 'Nuevo arco';
    }
  }

  cerrarDialogo(): void {
    this.dialogo.set(null);
    this.guardando.set(false);
  }

  guardarDialogo(): void {
    const d = this.dialogo();
    if (!d) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const nombre = v.nombre.trim();
    let accion: Observable<unknown>;
    switch (d.tipo) {
      case 'pool':
        accion = this.poolService.create(this.id, { nombre, tipo: d.tipoPool });
        break;
      case 'lane': {
        const propietario = this.propietario();
        if (!propietario || v.rolId === null) {
          return;
        }
        accion = this.laneService.create(this.id, propietario.id, { nombre, rolProcesoId: v.rolId });
        break;
      }
      case 'actividad':
        accion = this.actividadService.create(this.id, {
          nombre,
          tipoActividad: v.tipo,
          laneId: d.laneId,
          posicionX: d.x,
          posicionY: d.y
        });
        break;
      case 'gateway':
        accion = this.gatewayService.create(this.id, {
          nombre,
          tipo: v.tipo as TipoGateway,
          posicionX: d.x,
          posicionY: d.y
        });
        break;
      case 'mensaje': {
        const propietario = this.propietario();
        if (!propietario) {
          return;
        }
        accion = this.mensajeService.create(this.id, {
          nombre,
          claveCorrelacion: v.clave.trim(),
          poolOrigenId: propietario.id,
          poolDestinoId: d.poolDestinoId,
          elementoOrigenId: d.origenId
        });
        break;
      }
      case 'arco':
        accion = this.arcoService.create(this.id, {
          nombre: nombre || null,
          condicion: v.condicion.trim() || null,
          origenId: d.origenId,
          destinoId: d.destinoId
        });
        break;
    }
    this.guardando.set(true);
    this.ejecutar(accion, 'No fue posible guardar', () => this.cerrarDialogo(), () => this.guardando.set(false));
  }

  // Panel de propiedades

  guardarPropiedades(): void {
    const s = this.seleccion();
    const el = this.elegida();
    if (!s || !el) {
      return;
    }
    if (this.props.invalid) {
      this.props.markAllAsTouched();
      return;
    }
    const v = this.props.getRawValue();
    const nombre = v.nombre.trim();
    let accion: Observable<unknown> | null = null;
    switch (s.tipo) {
      case 'actividad': {
        const a = el as Actividad;
        accion = this.actividadService.update(this.id, a.id, {
          nombre,
          tipoActividad: v.tipo,
          laneId: a.laneId,
          posicionX: a.posicionX,
          posicionY: a.posicionY
        });
        break;
      }
      case 'gateway': {
        const g = el as Gateway;
        accion = this.gatewayService.update(this.id, g.id, { nombre, tipo: v.tipo as TipoGateway });
        break;
      }
      case 'arco': {
        const a = el as Arco;
        if (a.origenId !== null && a.destinoId !== null) {
          accion = this.arcoService.update(this.id, a.id, {
            nombre: nombre || null,
            condicion: v.condicion.trim() || null,
            origenId: a.origenId,
            destinoId: a.destinoId
          });
        }
        break;
      }
      case 'mensaje': {
        const m = el as Mensaje;
        accion = this.mensajeService.update(this.id, m.id, {
          nombre,
          claveCorrelacion: v.clave.trim(),
          poolOrigenId: m.poolOrigenId,
          poolDestinoId: m.poolDestinoId,
          elementoOrigenId: m.elementoOrigenId
        });
        break;
      }
      case 'lane': {
        const l = el as Lane;
        if (v.rolId !== null) {
          accion = this.laneService.update(this.id, l.poolId, l.id, { nombre, rolProcesoId: v.rolId });
        }
        break;
      }
      case 'pool': {
        const p = el as Pool;
        accion = this.poolService.update(this.id, p.id, { nombre, tipo: p.tipo });
        break;
      }
    }
    if (accion) {
      this.ejecutar(accion, 'No fue posible guardar los cambios');
    }
  }

  eliminar(): void {
    const s = this.seleccion();
    const el = this.elegida();
    if (!s || !el) {
      return;
    }
    const nombre = 'nombre' in el && el.nombre ? el.nombre : 'este elemento';
    if (!confirm(`¿Eliminar ${s.tipo === 'arco' ? 'el arco' : nombre}?`)) {
      return;
    }
    let accion: Observable<unknown>;
    switch (s.tipo) {
      case 'actividad':
        accion = this.actividadService.delete(this.id, s.id);
        break;
      case 'gateway':
        accion = this.gatewayService.delete(this.id, s.id);
        break;
      case 'arco':
        accion = this.arcoService.delete(this.id, s.id).pipe(
          map(r => {
            if (r.advertencia) {
              this.aviso.set(r.advertencia);
            }
            return r;
          })
        );
        break;
      case 'mensaje':
        accion = this.mensajeService.delete(this.id, s.id);
        break;
      case 'lane': {
        const l = el as Lane;
        accion = this.laneService.delete(this.id, l.poolId, l.id);
        break;
      }
      case 'pool':
        accion = this.poolService.delete(this.id, s.id);
        break;
    }
    this.ejecutar(accion, 'No fue posible eliminar', () => this.seleccion.set(null));
  }

  textoSeleccion(): string {
    switch (this.seleccion()?.tipo) {
      case 'actividad':
        return 'Actividad';
      case 'gateway':
        return 'Gateway';
      case 'arco':
        return 'Arco';
      case 'mensaje':
        return 'Mensaje';
      case 'lane':
        return 'Lane';
      case 'pool':
        return 'Pool';
      default:
        return '';
    }
  }

  nombreNodo(id: number | null): string {
    if (id === null) {
      return '';
    }
    return (
      this.actividades().find(a => a.id === id)?.nombre ?? this.gateways().find(g => g.id === id)?.nombre ?? ''
    );
  }

  nombrePool(id: number): string {
    return this.pools().find(p => p.id === id)?.nombre ?? '';
  }

  // Internos

  private abrir(dialogo: Dialogo, nombre: string, tipo = ''): void {
    const rolId = this.roles().length > 0 ? this.roles()[0].id : null;
    this.form.reset({ nombre, tipo, rolId, clave: '', condicion: '' });
    const requerido = Validators.required;
    this.form.controls.rolId.setValidators(dialogo.tipo === 'lane' ? requerido : null);
    this.form.controls.clave.setValidators(dialogo.tipo === 'mensaje' ? [requerido, Validators.maxLength(255)] : null);
    this.form.controls.nombre.setValidators(
      dialogo.tipo === 'arco' ? Validators.maxLength(255) : [requerido, Validators.maxLength(255)]
    );
    this.form.controls.rolId.updateValueAndValidity();
    this.form.controls.clave.updateValueAndValidity();
    this.form.controls.nombre.updateValueAndValidity();
    this.dialogo.set(dialogo);
  }

  private rellenarPropiedades(s: Seleccion | null, el: ReturnType<EditorProcesoComponent['elegida']>): void {
    this.props.reset({ nombre: '', tipo: '', rolId: null, clave: '', condicion: '' });
    this.props.controls.nombre.setValidators(
      s?.tipo === 'arco' ? Validators.maxLength(255) : [Validators.required, Validators.maxLength(255)]
    );
    this.props.controls.nombre.updateValueAndValidity();
    if (!s || !el) {
      return;
    }
    switch (s.tipo) {
      case 'actividad':
        this.props.patchValue({ nombre: (el as Actividad).nombre, tipo: (el as Actividad).tipoActividad });
        break;
      case 'gateway':
        this.props.patchValue({ nombre: (el as Gateway).nombre, tipo: (el as Gateway).tipo });
        break;
      case 'arco':
        this.props.patchValue({ nombre: (el as Arco).nombre ?? '', condicion: (el as Arco).condicion ?? '' });
        break;
      case 'mensaje':
        this.props.patchValue({ nombre: (el as Mensaje).nombre, clave: (el as Mensaje).claveCorrelacion });
        break;
      case 'lane':
        this.props.patchValue({ nombre: (el as Lane).nombre, rolId: (el as Lane).rolProcesoId });
        break;
      case 'pool':
        this.props.patchValue({ nombre: (el as Pool).nombre });
        break;
    }
  }

  private datos(): Observable<Datos> {
    return forkJoin({
      pools: this.poolService.list(this.id),
      actividades: this.actividadService.list(this.id),
      gateways: this.gatewayService.list(this.id),
      arcos: this.arcoService.list(this.id),
      mensajes: this.mensajeService.list(this.id)
    }).pipe(
      switchMap(d => {
        const propietario = d.pools.find(p => p.tipo === 'PROPIETARIO');
        const lanes$ = propietario ? this.laneService.list(this.id, propietario.id) : of<Lane[]>([]);
        return lanes$.pipe(map(lanes => ({ ...d, lanes: [...lanes].sort((a, b) => a.orden - b.orden) })));
      })
    );
  }

  private aplicar(d: Datos): void {
    this.pools.set(d.pools);
    this.lanes.set(d.lanes);
    this.actividades.set(d.actividades);
    this.gateways.set(d.gateways);
    this.arcos.set(d.arcos);
    this.mensajes.set(d.mensajes);
    const s = this.seleccion();
    if (s && !this.existe(s)) {
      this.seleccion.set(null);
    }
  }

  private existe(s: Seleccion): boolean {
    switch (s.tipo) {
      case 'actividad':
        return this.actividades().some(x => x.id === s.id);
      case 'gateway':
        return this.gateways().some(x => x.id === s.id);
      case 'arco':
        return this.arcos().some(x => x.id === s.id);
      case 'mensaje':
        return this.mensajes().some(x => x.id === s.id);
      case 'lane':
        return this.lanes().some(x => x.id === s.id);
      case 'pool':
        return this.pools().some(x => x.id === s.id);
    }
  }

  private ejecutar(
    accion: Observable<unknown>,
    porDefecto: string,
    alTerminar?: () => void,
    alFallar?: () => void
  ): void {
    this.error.set('');
    accion
      .pipe(
        switchMap(() => this.datos()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: d => {
          this.aplicar(d);
          alTerminar?.();
        },
        error: err => {
          this.error.set(mensajeDeError(err, porDefecto));
          alFallar?.();
          this.datos()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ next: d => this.aplicar(d), error: () => undefined });
        }
      });
  }
}

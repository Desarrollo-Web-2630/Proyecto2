import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/api-error';
import {
  ActividadRequest,
  ArcoVista,
  TIPOS_ACTIVIDAD,
  etiquetaTipoActividad,
} from '../../../core/models/actividad.model';
import { Lane, Pool, RolProceso, esCajaNegra } from '../../../core/models/pool.model';
import { Actividad, Proceso } from '../../../core/models/proceso.model';
import { ActividadService } from '../../../core/services/actividad.service';
import { ArcoService } from '../../../core/services/arco.service';
import { PoolService } from '../../../core/services/pool.service';
import { ProcesoService } from '../../../core/services/proceso.service';
import { RolProcesoService } from '../../../core/services/rol-proceso.service';
import { SesionService } from '../../../core/services/sesion.service';
import { mostrarError } from '../../../shared/validadores';
import { DiagramaPool } from '../../pools/diagrama-pool/diagrama-pool';

// Lo que se le muestra al usuario antes de confirmar la eliminación (HU-10)
interface ResumenEliminacion {
  actividad: Actividad;
  arcosAfectados: ArcoVista[];
  advertencias: string[];
}

// Un arco que sale de la actividad le quita una entrada a su destino y uno que llega le quita una
// salida a su origen. Si ese elemento se queda en cero, el diagrama queda con algo desconectado.
export function calcularResumenEliminacion(actividad: Actividad, arcos: ArcoVista[]): ResumenEliminacion {
  const arcosAfectados = arcos.filter((a) => a.origenId === actividad.id || a.destinoId === actividad.id);
  const restantes = arcos.filter((a) => !arcosAfectados.includes(a));

  const sinSalida = new Map<number, string>();
  const sinEntrada = new Map<number, string>();

  for (const arco of arcosAfectados) {
    if (arco.destinoId === actividad.id && arco.origenId !== null) {
      const tieneOtraSalida = restantes.some((r) => r.origenId === arco.origenId);
      if (!tieneOtraSalida) {
        sinSalida.set(arco.origenId, arco.origenNombre ?? `Elemento ${arco.origenId}`);
      }
    }
    if (arco.origenId === actividad.id && arco.destinoId !== null) {
      const tieneOtraEntrada = restantes.some((r) => r.destinoId === arco.destinoId);
      if (!tieneOtraEntrada) {
        sinEntrada.set(arco.destinoId, arco.destinoNombre ?? `Elemento ${arco.destinoId}`);
      }
    }
  }

  const advertencias = [
    ...[...sinSalida.values()].map((n) => `"${n}" queda sin camino de salida.`),
    ...[...sinEntrada.values()].map((n) => `"${n}" queda sin camino de entrada: nada llega hasta él.`),
  ];
  return { actividad, arcosAfectados, advertencias };
}

@Component({
  selector: 'app-gestion-actividades',
  imports: [ReactiveFormsModule, RouterLink, DiagramaPool],
  templateUrl: './gestion-actividades.html',
  styleUrl: './gestion-actividades.css',
})
export class GestionActividades implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly actividadesApi = inject(ActividadService);
  private readonly arcosApi = inject(ArcoService);
  private readonly procesosApi = inject(ProcesoService);
  private readonly poolsApi = inject(PoolService);
  private readonly rolesApi = inject(RolProcesoService);
  private readonly sesion = inject(SesionService);

  // Llega de la ruta /procesos/:procesoId/actividades
  readonly procesoId = input.required<string>();

  protected readonly tipos = TIPOS_ACTIVIDAD;
  protected readonly etiquetaTipo = etiquetaTipoActividad;
  protected readonly mostrarError = mostrarError;

  protected readonly proceso = signal<Proceso | null>(null);
  protected readonly pools = signal<Pool[]>([]);
  protected readonly lanesPorPool = signal<Record<number, Lane[]>>({});
  protected readonly roles = signal<RolProceso[]>([]);
  protected readonly actividades = signal<Actividad[]>([]);

  protected readonly cargando = signal(true);
  protected readonly ocupado = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly advertenciasPosteriores = signal<string[]>([]);

  protected readonly editandoId = signal<number | null>(null);
  protected readonly resumen = signal<ResumenEliminacion | null>(null);

  private get id(): number {
    return Number(this.procesoId());
  }

  // Un proceso compartido por otra empresa se ve, pero no se toca
  protected readonly esAjeno = computed(() => {
    const p = this.proceso();
    return p !== null && p.empresaId !== this.sesion.empresaId();
  });

  // HU-08 y HU-09: admin y editor. HU-10: solo admin.
  protected readonly puedeEditar = computed(() => {
    const rol = this.sesion.rol();
    return !this.esAjeno() && (rol === 'ADMIN' || rol === 'EDITOR');
  });
  protected readonly puedeEliminar = computed(() => !this.esAjeno() && this.sesion.esAdmin());

  // Las actividades viven en las lanes del pool de la empresa propietaria
  protected readonly poolPropietario = computed(() => this.pools().find((p) => p.tipo === 'PROPIETARIO') ?? null);

  protected readonly lanes = computed(() => {
    const pool = this.poolPropietario();
    return pool ? [...(this.lanesPorPool()[pool.id] ?? [])].sort((a, b) => a.orden - b.orden) : [];
  });

  protected readonly nombreLane = computed(() => new Map(this.lanes().map((l) => [l.id, l.nombre])));

  protected readonly actividadesOrdenadas = computed(() =>
    [...this.actividades()].sort((a, b) => {
      const ordenA = this.lanes().findIndex((l) => l.id === a.laneId);
      const ordenB = this.lanes().findIndex((l) => l.id === b.laneId);
      return ordenA - ordenB || a.posicionX - b.posicionX;
    }),
  );

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    tipoActividad: [TIPOS_ACTIVIDAD[0], Validators.required],
    laneId: this.fb.control<number | null>(null, Validators.required),
    posicionX: this.fb.control<number>(0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]),
    posicionY: this.fb.control<number>(0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]),
  });

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const [proceso, pools, roles, actividades] = await Promise.all([
        this.procesosApi.obtener(this.id),
        this.poolsApi.listar(this.id),
        this.rolesApi.listar(),
        this.actividadesApi.listar(this.id),
      ]);
      this.proceso.set(proceso);
      this.pools.set(pools);
      this.roles.set(roles);
      this.actividades.set(actividades);

      const internos = pools.filter((p) => !esCajaNegra(p.tipo));
      const listas = await Promise.all(internos.map((p) => this.poolsApi.listarLanes(this.id, p.id)));
      const mapa: Record<number, Lane[]> = {};
      internos.forEach((p, i) => (mapa[p.id] = listas[i]));
      this.lanesPorPool.set(mapa);

      this.sugerirPosicion();
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  // Ejecuta una acción, recarga las actividades y deja el mensaje de éxito
  private async ejecutar(accion: () => Promise<unknown>, exito: string): Promise<boolean> {
    this.ocupado.set(true);
    this.error.set(null);
    this.aviso.set(null);
    try {
      await accion();
      this.aviso.set(exito);
      this.actividades.set(await this.actividadesApi.listar(this.id));
      return true;
    } catch (e) {
      this.error.set(mensajeDeError(e));
      return false;
    } finally {
      this.ocupado.set(false);
    }
  }

  // Dentro de una lane las actividades se dibujan de izquierda a derecha según X: se propone la siguiente
  private sugerirPosicion(): void {
    const siguiente = this.actividades().reduce((max, a) => Math.max(max, a.posicionX), -1) + 1;
    this.form.controls.posicionX.setValue(siguiente);
    this.form.controls.posicionY.setValue(0);
  }

  // HU-08 y HU-09 usan el mismo formulario
  protected async guardar(): Promise<void> {
    if (!this.puedeEditar()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const d = this.form.getRawValue();
    const nombre = d.nombre.trim();
    if (!nombre) {
      this.form.controls.nombre.setErrors({ required: true });
      this.form.controls.nombre.markAsTouched();
      return;
    }
    const editando = this.editandoId();
    const repetida = this.actividades().some((a) => a.nombre === nombre && a.id !== editando);
    if (repetida) {
      this.error.set(`Ya existe una actividad llamada "${nombre}" en este proceso.`);
      return;
    }
    const datos: ActividadRequest = {
      nombre,
      tipoActividad: d.tipoActividad,
      laneId: Number(d.laneId),
      posicionX: Number(d.posicionX),
      posicionY: Number(d.posicionY),
    };

    if (editando === null) {
      const ok = await this.ejecutar(() => this.actividadesApi.crear(this.id, datos), `Actividad "${nombre}" creada.`);
      if (ok) {
        this.form.reset({ nombre: '', tipoActividad: TIPOS_ACTIVIDAD[0], laneId: d.laneId, posicionX: 0, posicionY: 0 });
        this.sugerirPosicion();
      }
      return;
    }

    const original = this.actividades().find((a) => a.id === editando);
    const cambioLane = original !== undefined && original.laneId !== datos.laneId;
    const mensaje = cambioLane
      ? `Actividad "${nombre}" movida a la lane "${this.nombreLane().get(datos.laneId) ?? datos.laneId}". Sus arcos se conservan.`
      : `Actividad "${nombre}" actualizada.`;
    const ok = await this.ejecutar(() => this.actividadesApi.actualizar(this.id, editando, datos), mensaje);
    if (ok) {
      this.cancelarEdicion();
    }
  }

  protected iniciarEdicion(a: Actividad): void {
    this.cancelarEliminar();
    this.error.set(null);
    this.aviso.set(null);
    this.editandoId.set(a.id);
    this.form.setValue({
      nombre: a.nombre,
      tipoActividad: a.tipoActividad,
      laneId: a.laneId,
      posicionX: a.posicionX,
      posicionY: a.posicionY,
    });
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
    this.form.reset({ nombre: '', tipoActividad: TIPOS_ACTIVIDAD[0], laneId: null, posicionX: 0, posicionY: 0 });
    this.sugerirPosicion();
  }

  // HU-10: primero se calcula qué arcos se van y qué queda desconectado; recién ahí se pide confirmar
  protected async pedirEliminar(a: Actividad): Promise<void> {
    this.ocupado.set(true);
    this.error.set(null);
    this.aviso.set(null);
    this.advertenciasPosteriores.set([]);
    this.cancelarEdicion();
    try {
      const arcos = await this.arcosApi.listar(this.id);
      this.resumen.set(calcularResumenEliminacion(a, arcos));
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.ocupado.set(false);
    }
  }

  protected cancelarEliminar(): void {
    this.resumen.set(null);
  }

  protected async confirmarEliminar(): Promise<void> {
    const r = this.resumen();
    if (!r || !this.puedeEliminar()) {
      return;
    }
    const n = r.arcosAfectados.length;
    const ok = await this.ejecutar(
      () => this.actividadesApi.eliminar(this.id, r.actividad.id),
      n === 0
        ? `Actividad "${r.actividad.nombre}" eliminada.`
        : `Actividad "${r.actividad.nombre}" eliminada junto con ${n} arco${n === 1 ? '' : 's'}.`,
    );
    if (ok) {
      this.advertenciasPosteriores.set(r.advertencias);
      this.resumen.set(null);
    }
  }
}

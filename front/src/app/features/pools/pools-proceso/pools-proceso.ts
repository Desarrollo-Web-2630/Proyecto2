import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/api-error';
import {
  ETIQUETA_TIPO_POOL,
  Lane,
  Pool,
  RolProceso,
  TIPOS_POOL,
  TipoPool,
  esCajaNegra,
} from '../../../core/models/pool.model';
import { Actividad, Proceso } from '../../../core/models/proceso.model';
import { EmpresaService } from '../../../core/services/empresa.service';
import { PermisosPoolService } from '../../../core/services/permisos-pool.service';
import { PoolService } from '../../../core/services/pool.service';
import { ProcesoService } from '../../../core/services/proceso.service';
import { RolProcesoService } from '../../../core/services/rol-proceso.service';
import { SesionService } from '../../../core/services/sesion.service';
import { mostrarError } from '../../../shared/validadores';
import { DiagramaPool } from '../diagrama-pool/diagrama-pool';

@Component({
  selector: 'app-pools-proceso',
  imports: [ReactiveFormsModule, RouterLink, DiagramaPool],
  templateUrl: './pools-proceso.html',
  styleUrl: './pools-proceso.css',
})
export class PoolsProceso implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly poolsApi = inject(PoolService);
  private readonly procesosApi = inject(ProcesoService);
  private readonly rolesApi = inject(RolProcesoService);
  private readonly empresasApi = inject(EmpresaService);
  private readonly sesion = inject(SesionService);
  protected readonly permisos = inject(PermisosPoolService);

  readonly procesoId = input.required<string>();

  protected readonly tipos = TIPOS_POOL;
  protected readonly etiquetaTipo = ETIQUETA_TIPO_POOL;
  protected readonly esCajaNegra = esCajaNegra;
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
  protected readonly editandoPoolId = signal<number | null>(null);
  protected readonly editandoLaneId = signal<number | null>(null);

  private get id(): number {
    return Number(this.procesoId());
  }

  // Proceso compartido por otra empresa: solo lectura
  protected readonly esAjeno = computed(() => {
    const p = this.proceso();
    return p !== null && p.empresaId !== this.sesion.empresaId();
  });

  protected readonly puedeCrear = computed(() => !this.esAjeno() && this.permisos.puede()('crear'));
  protected readonly puedeEditar = computed(() => !this.esAjeno() && this.permisos.puede()('editar'));
  protected readonly puedeEliminar = computed(() => !this.esAjeno() && this.permisos.puede()('eliminar'));
  protected readonly soloLectura = computed(
    () => !this.puedeCrear() && !this.puedeEditar() && !this.puedeEliminar(),
  );

  protected readonly poolPropietario = computed(() => this.pools().find((p) => p.tipo === 'PROPIETARIO') ?? null);
  protected readonly poolsExternos = computed(() => this.pools().filter((p) => esCajaNegra(p.tipo)));

  protected readonly lanesPropietario = computed(() => {
    const pool = this.poolPropietario();
    return pool ? [...(this.lanesPorPool()[pool.id] ?? [])].sort((a, b) => a.orden - b.orden) : [];
  });

  // Una lane con actividades no se puede eliminar
  protected readonly actividadesPorLane = computed(() => {
    const conteo = new Map<number, number>();
    for (const a of this.actividades()) {
      conteo.set(a.laneId, (conteo.get(a.laneId) ?? 0) + 1);
    }
    return conteo;
  });

  protected readonly nombreRol = computed(() => new Map(this.roles().map((r) => [r.id, r.nombre])));

  protected readonly formPool = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    tipo: this.fb.control<TipoPool>('PROPIETARIO', Validators.required),
  });

  protected readonly formEditarPool = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    tipo: this.fb.control<TipoPool>('PROPIETARIO', Validators.required),
  });

  protected readonly formLane = this.fb.group({
    rolProcesoId: this.fb.control<number | null>(null, Validators.required),
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
  });

  protected readonly formEditarLane = this.fb.group({
    rolProcesoId: this.fb.control<number | null>(null, Validators.required),
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
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
        this.procesosApi.listarActividades(this.id),
      ]);
      this.proceso.set(proceso);
      this.pools.set(pools);
      this.roles.set(roles);
      this.actividades.set(actividades);
      await this.cargarLanes(pools);
      await this.cargarPermisos();
      await this.sugerirNombrePropietario();
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargarLanes(pools: Pool[]): Promise<void> {
    const internos = pools.filter((p) => !esCajaNegra(p.tipo));
    const listas = await Promise.all(internos.map((p) => this.poolsApi.listarLanes(this.id, p.id)));
    const mapa: Record<number, Lane[]> = {};
    internos.forEach((p, i) => (mapa[p.id] = listas[i]));
    this.lanesPorPool.set(mapa);
  }

  private async cargarPermisos(): Promise<void> {
    try {
      await this.permisos.cargar();
    } catch {
      this.aviso.set('No se pudo leer la configuración de permisos; se aplican los permisos por defecto.');
    }
  }

  private async sugerirNombrePropietario(): Promise<void> {
    const empresaId = this.sesion.empresaId();
    if (this.poolPropietario() || empresaId === null || this.esAjeno()) {
      this.formPool.controls.tipo.setValue(this.poolPropietario() ? 'CLIENTE' : 'PROPIETARIO');
      return;
    }
    try {
      const empresa = await this.empresasApi.obtener(empresaId);
      this.formPool.controls.nombre.setValue(empresa.nombre);
    } catch {
      // se ignora
    }
  }

  private async ejecutar(accion: () => Promise<unknown>, exito: string): Promise<boolean> {
    this.ocupado.set(true);
    this.error.set(null);
    this.aviso.set(null);
    try {
      await accion();
      this.aviso.set(exito);
      const [pools, actividades] = await Promise.all([
        this.poolsApi.listar(this.id),
        this.procesosApi.listarActividades(this.id),
      ]);
      this.pools.set(pools);
      this.actividades.set(actividades);
      await this.cargarLanes(pools);
      return true;
    } catch (e) {
      this.error.set(mensajeDeError(e));
      return false;
    } finally {
      this.ocupado.set(false);
    }
  }

  // HU-21
  protected tipoDeshabilitado(tipo: TipoPool, poolActualId: number | null = null): boolean {
    const propietario = this.poolPropietario();
    return tipo === 'PROPIETARIO' && propietario !== null && propietario.id !== poolActualId;
  }

  protected async crearPool(): Promise<void> {
    if (this.formPool.invalid) {
      this.formPool.markAllAsTouched();
      return;
    }
    const datos = this.formPool.getRawValue();
    if (this.tipoDeshabilitado(datos.tipo)) {
      this.error.set('El diagrama ya tiene el pool de la empresa propietaria.');
      return;
    }
    const ok = await this.ejecutar(
      () => this.poolsApi.crear(this.id, { nombre: datos.nombre.trim(), tipo: datos.tipo }),
      `Pool "${datos.nombre.trim()}" creado.`,
    );
    if (ok) {
      this.formPool.reset({ nombre: '', tipo: 'CLIENTE' });
    }
  }

  protected iniciarEdicionPool(pool: Pool): void {
    this.editandoPoolId.set(pool.id);
    this.formEditarPool.setValue({ nombre: pool.nombre, tipo: pool.tipo });
  }

  protected async guardarPool(pool: Pool): Promise<void> {
    if (this.formEditarPool.invalid) {
      this.formEditarPool.markAllAsTouched();
      return;
    }
    const datos = this.formEditarPool.getRawValue();
    const tieneLanes = (this.lanesPorPool()[pool.id] ?? []).length > 0;
    if (pool.tipo === 'PROPIETARIO' && esCajaNegra(datos.tipo) && tieneLanes) {
      this.error.set('Un pool externo es caja negra: elimina primero sus lanes para cambiarle el tipo.');
      return;
    }
    if (this.tipoDeshabilitado(datos.tipo, pool.id)) {
      this.error.set('El diagrama ya tiene el pool de la empresa propietaria.');
      return;
    }
    const ok = await this.ejecutar(
      () => this.poolsApi.actualizar(this.id, pool.id, { nombre: datos.nombre.trim(), tipo: datos.tipo }),
      'Pool actualizado.',
    );
    if (ok) {
      this.editandoPoolId.set(null);
    }
  }

  protected async eliminarPool(pool: Pool): Promise<void> {
    const lanes = this.lanesPorPool()[pool.id] ?? [];
    const conActividades = lanes.some((l) => (this.actividadesPorLane().get(l.id) ?? 0) > 0);
    if (conActividades) {
      this.error.set('El pool tiene lanes con actividades. Reasigna o elimina esas actividades primero.');
      return;
    }
    if (lanes.length > 0) {
      this.error.set('Elimina primero las lanes del pool.');
      return;
    }
    await this.ejecutar(() => this.poolsApi.eliminar(this.id, pool.id), `Pool "${pool.nombre}" eliminado.`);
  }

  // HU-22
  protected alElegirRol(): void {
    const rolId = Number(this.formLane.controls.rolProcesoId.value);
    const rol = this.roles().find((r) => r.id === rolId);
    if (rol && !this.formLane.controls.nombre.value.trim()) {
      this.formLane.controls.nombre.setValue(rol.nombre);
    }
  }

  protected async crearLane(): Promise<void> {
    const pool = this.poolPropietario();
    if (!pool) {
      return;
    }
    if (this.formLane.invalid) {
      this.formLane.markAllAsTouched();
      return;
    }
    const { nombre, rolProcesoId } = this.formLane.getRawValue();
    const ok = await this.ejecutar(
      () => this.poolsApi.crearLane(this.id, pool.id, { nombre: nombre.trim(), rolProcesoId: Number(rolProcesoId) }),
      `Lane "${nombre.trim()}" creada.`,
    );
    if (ok) {
      this.formLane.reset({ nombre: '', rolProcesoId: null });
    }
  }

  protected iniciarEdicionLane(lane: Lane): void {
    this.editandoLaneId.set(lane.id);
    this.formEditarLane.setValue({ nombre: lane.nombre, rolProcesoId: lane.rolProcesoId });
  }

  protected async guardarLane(lane: Lane): Promise<void> {
    if (this.formEditarLane.invalid) {
      this.formEditarLane.markAllAsTouched();
      return;
    }
    const { nombre, rolProcesoId } = this.formEditarLane.getRawValue();
    const ok = await this.ejecutar(
      () =>
        this.poolsApi.actualizarLane(this.id, lane.poolId, lane.id, {
          nombre: nombre.trim(),
          rolProcesoId: Number(rolProcesoId),
        }),
      'Lane actualizada.',
    );
    if (ok) {
      this.editandoLaneId.set(null);
    }
  }

  protected async mover(lane: Lane, delta: -1 | 1): Promise<void> {
    const lanes = this.lanesPropietario();
    const i = lanes.findIndex((l) => l.id === lane.id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= lanes.length) {
      return;
    }
    const ids = lanes.map((l) => l.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await this.ejecutar(() => this.poolsApi.reordenarLanes(this.id, lane.poolId, ids), 'Orden de lanes actualizado.');
  }

  protected async eliminarLane(lane: Lane): Promise<void> {
    if ((this.actividadesPorLane().get(lane.id) ?? 0) > 0) {
      this.error.set(`La lane "${lane.nombre}" tiene actividades: reasígnalas a otra lane antes de eliminarla.`);
      return;
    }
    await this.ejecutar(
      () => this.poolsApi.eliminarLane(this.id, lane.poolId, lane.id),
      `Lane "${lane.nombre}" eliminada.`,
    );
  }
}

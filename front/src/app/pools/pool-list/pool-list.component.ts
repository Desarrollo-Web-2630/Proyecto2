import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api-error';
import { Actividad } from '../../models/actividad.model';
import { Lane } from '../../models/lane.model';
import { Pool, TipoPool } from '../../models/pool.model';
import { Proceso } from '../../models/proceso.model';
import { RolProceso } from '../../models/rol-proceso.model';
import { ActividadService } from '../../services/actividad.service';
import { LaneService } from '../../services/lane.service';
import { PoolService } from '../../services/pool.service';
import { ProcesoService } from '../../services/proceso.service';
import { RolProcesoService } from '../../services/rol-proceso.service';
import { SesionService } from '../../services/sesion.service';
import { PoolDiagramaComponent } from '../pool-diagrama/pool-diagrama.component';

// HU-21 y HU-22
@Component({
  selector: 'app-pool-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, PoolDiagramaComponent],
  templateUrl: './pool-list.component.html'
})
export class PoolListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly procesoService = inject(ProcesoService);
  private readonly poolService = inject(PoolService);
  private readonly laneService = inject(LaneService);
  private readonly actividadService = inject(ActividadService);
  private readonly rolService = inject(RolProcesoService);
  private readonly sesion = inject(SesionService);

  readonly procesoId = input.required<string>();

  protected readonly tipos: { valor: TipoPool; texto: string }[] = [
    { valor: 'PROPIETARIO', texto: 'Empresa propietaria' },
    { valor: 'CLIENTE', texto: 'Cliente' },
    { valor: 'PROVEEDOR', texto: 'Proveedor' },
    { valor: 'SISTEMA_EXTERNO', texto: 'Sistema externo' }
  ];

  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly proceso = signal<Proceso | null>(null);
  protected readonly pools = signal<Pool[]>([]);
  protected readonly lanes = signal<Lane[]>([]);
  protected readonly actividades = signal<Actividad[]>([]);
  protected readonly roles = signal<RolProceso[]>([]);
  protected readonly message = signal('');
  protected readonly actionError = signal('');
  protected readonly editandoPool = signal<Pool | null>(null);
  protected readonly editandoLane = signal<Lane | null>(null);

  protected readonly propietario = computed(() => this.pools().find(p => p.tipo === 'PROPIETARIO') ?? null);
  protected readonly externos = computed(() => this.pools().filter(p => p.tipo !== 'PROPIETARIO'));

  // HU-22: solo lectura segun el rol de acceso del usuario
  protected readonly soloLectura = computed(() => this.sesion.usuario()?.rolAcceso === 'LECTURA');
  protected readonly puedeEliminar = computed(() => this.sesion.esAdmin());

  protected readonly poolForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    tipo: ['PROPIETARIO' as TipoPool, Validators.required]
  });

  protected readonly laneForm = this.fb.group({
    rolProcesoId: [null as number | null, Validators.required],
    nombre: ['', [Validators.required, Validators.maxLength(120)]]
  });

  private get id(): number {
    return Number(this.procesoId());
  }

  ngOnInit(): void {
    Promise.all([this.procesoService.get(this.id), this.rolService.list()])
      .then(([proceso, roles]) => {
        this.proceso.set(proceso);
        this.roles.set(roles);
        return this.load();
      })
      .then(() => this.status.set('success'))
      .catch(err => {
        this.message.set(mensajeDeError(err, 'No fue posible cargar el proceso'));
        this.status.set('error');
      });
  }

  // Trae pools, lanes del pool propietario y actividades
  private async load(): Promise<void> {
    const [pools, actividades] = await Promise.all([
      this.poolService.list(this.id),
      this.actividadService.list(this.id)
    ]);
    this.pools.set(pools);
    this.actividades.set(actividades);
    const propietario = pools.find(p => p.tipo === 'PROPIETARIO');
    const lanes = propietario ? await this.laneService.list(this.id, propietario.id) : [];
    this.lanes.set(lanes.sort((a, b) => a.orden - b.orden));
    if (!propietario) {
      this.poolForm.controls.tipo.setValue('PROPIETARIO');
    } else if (this.poolForm.controls.tipo.value === 'PROPIETARIO' && !this.editandoPool()) {
      this.poolForm.controls.tipo.setValue('CLIENTE');
    }
  }

  private ejecutar(accion: Promise<unknown>, porDefecto: string): Promise<boolean> {
    this.actionError.set('');
    return accion
      .then(() => this.load())
      .then(() => true)
      .catch(err => {
        this.actionError.set(mensajeDeError(err, porDefecto));
        return false;
      });
  }

  cantidadActividades(laneId: number): number {
    return this.actividades().filter(a => a.laneId === laneId).length;
  }

  // Solo puede existir un pool de la empresa propietaria
  tipoDeshabilitado(tipo: TipoPool): boolean {
    const propietario = this.propietario();
    return tipo === 'PROPIETARIO' && propietario !== null && propietario.id !== this.editandoPool()?.id;
  }

  // HU-21

  guardarPool(): void {
    if (this.poolForm.invalid) {
      this.poolForm.markAllAsTouched();
      return;
    }
    const datos = this.poolForm.getRawValue();
    const pool = this.editandoPool();
    if (pool?.tipo === 'PROPIETARIO' && datos.tipo !== 'PROPIETARIO' && this.lanes().length > 0) {
      this.actionError.set('Un pool externo no tiene lanes: elimina primero sus lanes');
      return;
    }
    const accion = pool
      ? this.poolService.update(this.id, pool.id, { nombre: datos.nombre.trim(), tipo: datos.tipo })
      : this.poolService.create(this.id, { nombre: datos.nombre.trim(), tipo: datos.tipo });
    this.ejecutar(accion, 'No fue posible guardar el pool').then(ok => {
      if (ok) {
        this.cancelarPool();
      }
    });
  }

  editarPool(pool: Pool): void {
    this.editandoPool.set(pool);
    this.poolForm.setValue({ nombre: pool.nombre, tipo: pool.tipo });
  }

  cancelarPool(): void {
    this.editandoPool.set(null);
    this.poolForm.reset({ nombre: '', tipo: this.propietario() ? 'CLIENTE' : 'PROPIETARIO' });
  }

  eliminarPool(pool: Pool): void {
    if (pool.tipo === 'PROPIETARIO' && this.lanes().length > 0) {
      this.actionError.set('Elimina primero las lanes del pool');
      return;
    }
    if (!confirm(`¿Eliminar el pool ${pool.nombre}?`)) {
      return;
    }
    this.ejecutar(this.poolService.delete(this.id, pool.id), 'No fue posible eliminar el pool');
  }

  // HU-22

  // La lane toma el nombre del rol si está vacía
  elegirRol(): void {
    const rol = this.roles().find(r => r.id === Number(this.laneForm.controls.rolProcesoId.value));
    if (rol && !this.laneForm.controls.nombre.value) {
      this.laneForm.controls.nombre.setValue(rol.nombre);
    }
  }

  guardarLane(): void {
    const pool = this.propietario();
    if (!pool) {
      return;
    }
    if (this.laneForm.invalid) {
      this.laneForm.markAllAsTouched();
      return;
    }
    const datos = { nombre: (this.laneForm.value.nombre ?? '').trim(), rolProcesoId: Number(this.laneForm.value.rolProcesoId) };
    const lane = this.editandoLane();
    const accion = lane
      ? this.laneService.update(this.id, pool.id, lane.id, datos)
      : this.laneService.create(this.id, pool.id, datos);
    this.ejecutar(accion, 'No fue posible guardar la lane').then(ok => {
      if (ok) {
        this.cancelarLane();
      }
    });
  }

  editarLane(lane: Lane): void {
    this.editandoLane.set(lane);
    this.laneForm.setValue({ nombre: lane.nombre, rolProcesoId: lane.rolProcesoId });
  }

  cancelarLane(): void {
    this.editandoLane.set(null);
    this.laneForm.reset({ nombre: '', rolProcesoId: null });
  }

  mover(indice: number, cambio: number): void {
    const pool = this.propietario();
    const ids = this.lanes().map(l => l.id);
    const destino = indice + cambio;
    if (!pool || destino < 0 || destino >= ids.length) {
      return;
    }
    [ids[indice], ids[destino]] = [ids[destino], ids[indice]];
    this.ejecutar(this.laneService.ordenar(this.id, pool.id, ids), 'No fue posible reordenar las lanes');
  }

  eliminarLane(lane: Lane): void {
    const pool = this.propietario();
    if (!pool) {
      return;
    }
    if (this.cantidadActividades(lane.id) > 0) {
      this.actionError.set(`La lane ${lane.nombre} tiene actividades: reasígnalas a otra lane antes de eliminarla`);
      return;
    }
    if (!confirm(`¿Eliminar la lane ${lane.nombre}?`)) {
      return;
    }
    this.ejecutar(this.laneService.delete(this.id, pool.id, lane.id), 'No fue posible eliminar la lane');
  }

  nombreRol(rolId: number): string {
    return this.roles().find(r => r.id === rolId)?.nombre ?? '—';
  }

  textoTipo(tipo: TipoPool): string {
    return this.tipos.find(t => t.valor === tipo)?.texto ?? tipo;
  }
}

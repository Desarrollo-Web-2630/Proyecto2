import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { mensajeDeError } from '../../../core/utils/api-error';
import { Actividad } from '../../../models/actividad.model';
import { Arco } from '../../../models/arco.model';
import { Lane } from '../../../models/lane.model';
import { Pool } from '../../../models/pool.model';
import { Proceso } from '../../../models/proceso.model';
import { RolProceso } from '../../../models/rol-proceso.model';
import { EdicionArcoDiagrama, MovimientoActividad, NuevoArcoDiagrama } from '../../../models/diagrama.model';
import { PoolDiagramaComponent } from '../../../components/pool-diagrama/pool-diagrama.component';
import { ActividadService } from '../../../services/actividad.service';
import { ArcoService } from '../../../services/arco.service';
import { GatewayService } from '../../../services/gateway.service';
import { LaneService } from '../../../services/lane.service';
import { PoolService } from '../../../services/pool.service';
import { ProcesoService } from '../../../services/proceso.service';
import { RolProcesoService } from '../../../services/rol-proceso.service';
import { SesionService } from '../../../services/sesion.service';

interface Elemento {
  id: number;
  nombre: string;
  tipo: string;
}

// HU-11 y HU-12
@Component({
  selector: 'app-arco-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, PoolDiagramaComponent],
  templateUrl: './arco-list.component.html'
})
export class ArcoListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly arcoService = inject(ArcoService);
  private readonly actividadService = inject(ActividadService);
  private readonly gatewayService = inject(GatewayService);
  private readonly poolService = inject(PoolService);
  private readonly laneService = inject(LaneService);
  private readonly rolService = inject(RolProcesoService);
  private readonly procesoService = inject(ProcesoService);
  private readonly sesion = inject(SesionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly procesoId = input.required<string>();

  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly proceso = signal<Proceso | null>(null);
  protected readonly pools = signal<Pool[]>([]);
  protected readonly lanes = signal<Lane[]>([]);
  protected readonly roles = signal<RolProceso[]>([]);
  protected readonly actividades = signal<Actividad[]>([]);
  protected readonly arcos = signal<Arco[]>([]);
  protected readonly elementos = signal<Elemento[]>([]);
  protected readonly message = signal('');
  protected readonly actionError = signal('');
  protected readonly aviso = signal('');
  protected readonly editando = signal<Arco | null>(null);

  protected readonly puedeEditar = computed(() => this.sesion.usuario()?.rolAcceso !== 'LECTURA');
  protected readonly puedeEliminar = computed(() => this.sesion.esAdmin());

  protected readonly form = this.fb.group({
    nombre: ['', Validators.maxLength(255)],
    condicion: ['', Validators.maxLength(255)],
    origenId: [null as number | null, Validators.required],
    destinoId: [null as number | null, Validators.required]
  });

  private get id(): number {
    return Number(this.procesoId());
  }

  ngOnInit(): void {
    forkJoin({
      proceso: this.procesoService.get(this.id),
      pools: this.poolService.list(this.id),
      roles: this.rolService.list(),
      arcos: this.arcoService.list(this.id),
      actividades: this.actividadService.list(this.id),
      gateways: this.gatewayService.list(this.id)
    })
      .pipe(
        switchMap(datos => {
          const propietario = datos.pools.find(p => p.tipo === 'PROPIETARIO');
          const lanes$ = propietario
            ? this.laneService.list(this.id, propietario.id)
            : of([] as Lane[]);
          return lanes$.pipe(map(lanes => ({ ...datos, lanes })));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ proceso, pools, lanes, roles, arcos, actividades, gateways }) => {
          this.proceso.set(proceso);
          this.pools.set(pools);
          this.lanes.set(lanes.sort((a, b) => a.orden - b.orden));
          this.roles.set(roles);
          this.actividades.set(actividades);
          this.arcos.set(arcos);
          this.elementos.set([
            ...actividades.map(a => ({ id: a.id, nombre: a.nombre, tipo: 'Actividad' })),
            ...gateways.map(g => ({ id: g.id, nombre: g.nombre, tipo: 'Gateway' }))
          ]);
          this.status.set('success');
        },
        error: err => {
          this.message.set(mensajeDeError(err, 'No fue posible cargar los arcos'));
          this.status.set('error');
        }
      });
  }

  private ejecutar(accion: Observable<unknown>, porDefecto: string, alTerminar?: () => void): void {
    this.actionError.set('');
    this.aviso.set('');
    accion
      .pipe(
        switchMap(() => this.arcoService.list(this.id)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: arcos => {
          this.arcos.set(arcos);
          alTerminar?.();
        },
        error: err => this.actionError.set(mensajeDeError(err, porDefecto))
      });
  }

  moverActividadDiagrama(mov: MovimientoActividad): void {
    if (!this.puedeEditar()) {
      return;
    }
    const { actividad, laneId, posicionX, posicionY } = mov;
    if (
      actividad.laneId === laneId &&
      actividad.posicionX === posicionX &&
      actividad.posicionY === posicionY
    ) {
      return;
    }
    this.actionError.set('');
    const previas = this.actividades();
    this.actividades.update(lista =>
      lista.map(a => (a.id === actividad.id ? { ...a, laneId, posicionX, posicionY } : a))
    );
    const peticion =
      actividad.laneId === laneId
        ? this.actividadService.mover(this.id, actividad.id, posicionX, posicionY)
        : this.actividadService.update(this.id, actividad.id, {
            nombre: actividad.nombre,
            tipoActividad: actividad.tipoActividad,
            laneId,
            posicionX,
            posicionY
          });
    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: actualizada => {
        this.actividades.update(lista =>
          lista.map(a => (a.id === actualizada.id ? actualizada : a))
        );
      },
      error: err => {
        this.actividades.set(previas);
        this.actionError.set(mensajeDeError(err, 'No fue posible mover la actividad'));
      }
    });
  }

  reordenarLanesDiagrama(lanesIds: number[]): void {
    if (!this.puedeEditar()) {
      return;
    }
    const propietario = this.pools().find(p => p.tipo === 'PROPIETARIO');
    if (!propietario) {
      return;
    }
    this.actionError.set('');
    this.laneService
      .ordenar(this.id, propietario.id, lanesIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: lanes => this.lanes.set(lanes.sort((a, b) => a.orden - b.orden)),
        error: err => this.actionError.set(mensajeDeError(err, 'No fue posible reordenar las lanes'))
      });
  }

  crearArcoDiagrama(datos: NuevoArcoDiagrama): void {
    if (!this.puedeEditar()) {
      return;
    }
    const accion = this.arcoService.create(this.id, {
      origenId: datos.origenId,
      destinoId: datos.destinoId,
      nombre: null,
      condicion: null
    });
    this.ejecutar(accion, 'No fue posible crear el arco');
  }

  editarArcoDiagrama(datos: EdicionArcoDiagrama): void {
    if (!this.puedeEditar() || datos.arco.origenId === null || datos.arco.destinoId === null) {
      return;
    }
    const accion = this.arcoService.update(this.id, datos.arco.id, {
      origenId: datos.arco.origenId,
      destinoId: datos.arco.destinoId,
      nombre: datos.nombre,
      condicion: datos.arco.condicion
    });
    this.ejecutar(accion, 'No fue posible actualizar el arco');
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const datos = {
      nombre: valores.nombre?.trim() || null,
      condicion: valores.condicion?.trim() || null,
      origenId: Number(valores.origenId),
      destinoId: Number(valores.destinoId)
    };
    const arco = this.editando();
    const accion = arco
      ? this.arcoService.update(this.id, arco.id, datos)
      : this.arcoService.create(this.id, datos);
    this.ejecutar(accion, 'No fue posible guardar el arco', () => this.cancelar());
  }

  editar(arco: Arco): void {
    this.editando.set(arco);
    this.form.setValue({
      nombre: arco.nombre ?? '',
      condicion: arco.condicion ?? '',
      origenId: arco.origenId,
      destinoId: arco.destinoId
    });
  }

  cancelar(): void {
    this.editando.set(null);
    this.form.reset({ nombre: '', condicion: '', origenId: null, destinoId: null });
  }

  eliminar(arco: Arco): void {
    if (!confirm('¿Eliminar este arco?')) {
      return;
    }
    this.actionError.set('');
    this.aviso.set('');
    this.arcoService
      .delete(this.id, arco.id)
      .pipe(
        switchMap(respuesta => {
          this.aviso.set(respuesta.advertencia ?? '');
          return this.arcoService.list(this.id);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: arcos => this.arcos.set(arcos),
        error: err => this.actionError.set(mensajeDeError(err, 'No fue posible eliminar el arco'))
      });
  }
}

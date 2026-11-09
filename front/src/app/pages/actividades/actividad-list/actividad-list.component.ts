import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EMPTY, forkJoin, map, of, switchMap } from 'rxjs';
import { mensajeDeError } from '../../../core/utils/api-error';
import { Actividad } from '../../../models/actividad.model';
import { Arco } from '../../../models/arco.model';
import { Lane } from '../../../models/lane.model';
import { Pool } from '../../../models/pool.model';
import { Proceso } from '../../../models/proceso.model';
import { RolProceso } from '../../../models/rol-proceso.model';
import { ActividadService } from '../../../services/actividad.service';
import { ArcoService } from '../../../services/arco.service';
import { LaneService } from '../../../services/lane.service';
import { PoolService } from '../../../services/pool.service';
import { ProcesoService } from '../../../services/proceso.service';
import { RolProcesoService } from '../../../services/rol-proceso.service';
import { SesionService } from '../../../services/sesion.service';
import { EdicionArcoDiagrama, MovimientoActividad, NuevoArcoDiagrama } from '../../../models/diagrama.model';
import { PoolDiagramaComponent } from '../../../components/pool-diagrama/pool-diagrama.component';

// HU-08 a HU-10
@Component({
  selector: 'app-actividad-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PoolDiagramaComponent],
  templateUrl: './actividad-list.component.html'
})
export class ActividadListComponent implements OnInit {
  private readonly actividadService = inject(ActividadService);
  private readonly arcoService = inject(ArcoService);
  private readonly procesoService = inject(ProcesoService);
  private readonly poolService = inject(PoolService);
  private readonly laneService = inject(LaneService);
  private readonly rolService = inject(RolProcesoService);
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
  protected readonly filas = signal<Actividad[]>([]);
  protected readonly pagina = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly message = signal('');
  protected readonly actionError = signal('');

  // Eliminar es solo para el administrador
  protected readonly puedeEditar = computed(() => this.sesion.usuario()?.rolAcceso !== 'LECTURA');
  protected readonly puedeEliminar = computed(() => this.sesion.esAdmin());

  private readonly tamano = 10;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = Number(this.procesoId());
    this.status.set('loading');
    forkJoin({
      proceso: this.procesoService.get(id),
      pools: this.poolService.list(id),
      roles: this.rolService.list(),
      actividades: this.actividadService.list(id),
      arcos: this.arcoService.list(id),
      filas: this.actividadService.buscar(id, this.pagina(), this.tamano)
    })
      .pipe(
        switchMap(datos => {
          const propietario = datos.pools.find(p => p.tipo === 'PROPIETARIO');
          const lanes$ = propietario ? this.laneService.list(id, propietario.id) : of([] as Lane[]);
          return lanes$.pipe(map(lanes => ({ ...datos, lanes })));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ proceso, pools, roles, actividades, arcos, filas, lanes }) => {
          this.proceso.set(proceso);
          this.pools.set(pools);
          this.roles.set(roles);
          this.actividades.set(actividades);
          this.arcos.set(arcos);
          this.filas.set(filas.content);
          this.totalPaginas.set(filas.totalPages);
          this.lanes.set(lanes.sort((a, b) => a.orden - b.orden));
          this.status.set('success');
        },
        error: err => {
          this.message.set(mensajeDeError(err, 'No fue posible cargar las actividades'));
          this.status.set('error');
        }
      });
  }

  irAPagina(pagina: number): void {
    this.pagina.set(pagina);
    this.cargarFilas();
  }

  private cargarFilas(): void {
    this.actividadService
      .buscar(Number(this.procesoId()), this.pagina(), this.tamano)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          this.filas.set(page.content);
          this.totalPaginas.set(page.totalPages);
          if (page.content.length === 0 && this.pagina() > 0) {
            this.irAPagina(this.pagina() - 1);
          }
        },
        error: err => this.actionError.set(mensajeDeError(err, 'No fue posible cargar las actividades'))
      });
  }

  nombreLane(laneId: number): string {
    return this.lanes().find(l => l.id === laneId)?.nombre ?? 'Lane no encontrada';
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
    const procesoId = Number(this.procesoId());
    this.actionError.set('');
    const previas = this.actividades();
    this.actividades.update(lista =>
      lista.map(a => (a.id === actividad.id ? { ...a, laneId, posicionX, posicionY } : a))
    );
    const peticion =
      actividad.laneId === laneId
        ? this.actividadService.mover(procesoId, actividad.id, posicionX, posicionY)
        : this.actividadService.update(procesoId, actividad.id, {
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
        this.filas.update(lista => lista.map(a => (a.id === actualizada.id ? actualizada : a)));
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
    const procesoId = Number(this.procesoId());
    this.actionError.set('');
    this.laneService
      .ordenar(procesoId, propietario.id, lanesIds)
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
    const procesoId = Number(this.procesoId());
    this.actionError.set('');
    this.arcoService
      .create(procesoId, {
        origenId: datos.origenId,
        destinoId: datos.destinoId,
        nombre: null,
        condicion: null
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: nuevo => this.arcos.update(lista => [...lista, nuevo]),
        error: err => this.actionError.set(mensajeDeError(err, 'No fue posible crear el arco'))
      });
  }

  editarArcoDiagrama(datos: EdicionArcoDiagrama): void {
    if (!this.puedeEditar() || datos.arco.origenId === null || datos.arco.destinoId === null) {
      return;
    }
    const procesoId = Number(this.procesoId());
    this.actionError.set('');
    this.arcoService
      .update(procesoId, datos.arco.id, {
        origenId: datos.arco.origenId,
        destinoId: datos.arco.destinoId,
        nombre: datos.nombre,
        condicion: datos.arco.condicion
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: actualizado =>
          this.arcos.update(lista =>
            lista.map(a => (a.id === actualizado.id ? actualizado : a))
          ),
        error: err => this.actionError.set(mensajeDeError(err, 'No fue posible actualizar el arco'))
      });
  }

  // HU-10: avisa cuántos arcos se borran
  remove(actividad: Actividad): void {
    this.actionError.set('');
    const id = Number(this.procesoId());
    this.arcoService.list(id)
      .pipe(
        map(arcos => arcos.filter(a => a.origenId === actividad.id || a.destinoId === actividad.id).length),
        switchMap(afectados => {
          let texto = `¿Eliminar la actividad ${actividad.nombre}?`;
          if (afectados > 0) {
            texto += `\nTambién se eliminarán ${afectados} arco(s) conectado(s).`;
          }
          return confirm(texto) ? this.actividadService.delete(id, actividad.id) : EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.actividades.update(lista => lista.filter(a => a.id !== actividad.id));
          this.arcos.update(lista =>
            lista.filter(a => a.origenId !== actividad.id && a.destinoId !== actividad.id)
          );
          this.cargarFilas();
        },
        error: err => this.actionError.set(mensajeDeError(err, 'No fue posible eliminar la actividad'))
      });
  }
}

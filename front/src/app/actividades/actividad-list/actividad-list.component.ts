import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api-error';
import { Actividad } from '../../models/actividad.model';
import { Lane } from '../../models/lane.model';
import { Pool } from '../../models/pool.model';
import { Proceso } from '../../models/proceso.model';
import { RolProceso } from '../../models/rol-proceso.model';
import { ActividadService } from '../../services/actividad.service';
import { ArcoService } from '../../services/arco.service';
import { LaneService } from '../../services/lane.service';
import { PoolService } from '../../services/pool.service';
import { ProcesoService } from '../../services/proceso.service';
import { RolProcesoService } from '../../services/rol-proceso.service';
import { SesionService } from '../../services/sesion.service';
import { PoolDiagramaComponent } from '../../pools/pool-diagrama/pool-diagrama.component';

// HU-08 a HU-10: actividades del proceso
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

  readonly procesoId = input.required<string>();

  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly proceso = signal<Proceso | null>(null);
  protected readonly pools = signal<Pool[]>([]);
  protected readonly lanes = signal<Lane[]>([]);
  protected readonly roles = signal<RolProceso[]>([]);
  protected readonly actividades = signal<Actividad[]>([]);
  protected readonly message = signal('');
  protected readonly actionError = signal('');

  private readonly propia = computed(() => this.proceso()?.empresaId === this.sesion.usuario()?.empresaId);
  // Crear y editar: administrador y editor. Eliminar: solo administrador
  protected readonly puedeEditar = computed(() => this.propia() && this.sesion.usuario()?.rolAcceso !== 'LECTURA');
  protected readonly puedeEliminar = computed(() => this.propia() && this.sesion.esAdmin());

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = Number(this.procesoId());
    this.status.set('loading');
    Promise.all([
      this.procesoService.get(id),
      this.poolService.list(id),
      this.rolService.list(),
      this.actividadService.list(id)
    ])
      .then(async ([proceso, pools, roles, actividades]) => {
        this.proceso.set(proceso);
        this.pools.set(pools);
        this.roles.set(roles);
        this.actividades.set(actividades);
        const propietario = pools.find(p => p.tipo === 'PROPIETARIO');
        this.lanes.set(propietario ? await this.laneService.list(id, propietario.id) : []);
        this.status.set('success');
      })
      .catch(err => {
        this.message.set(mensajeDeError(err, 'No fue posible cargar las actividades'));
        this.status.set('error');
      });
  }

  nombreLane(laneId: number): string {
    return this.lanes().find(l => l.id === laneId)?.nombre ?? 'Lane no encontrada';
  }

  // HU-10: antes de eliminar se avisa qué arcos se borran con la actividad
  async remove(actividad: Actividad): Promise<void> {
    this.actionError.set('');
    const id = Number(this.procesoId());
    try {
      const arcos = await this.arcoService.list(id);
      const afectados = arcos.filter(a => a.origenId === actividad.id || a.destinoId === actividad.id);
      let texto = `¿Eliminar la actividad ${actividad.nombre}?`;
      if (afectados.length > 0) {
        texto += `\nTambién se eliminarán ${afectados.length} arco(s) conectado(s).`;
      }
      if (!confirm(texto)) {
        return;
      }
      await this.actividadService.delete(id, actividad.id);
      this.actividades.update(lista => lista.filter(a => a.id !== actividad.id));
    } catch (err) {
      this.actionError.set(mensajeDeError(err, 'No fue posible eliminar la actividad'));
    }
  }
}

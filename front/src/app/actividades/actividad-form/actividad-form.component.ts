import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api-error';
import { Actividad, ActividadRequest } from '../../models/actividad.model';
import { Lane } from '../../models/lane.model';
import { ActividadService } from '../../services/actividad.service';
import { LaneService } from '../../services/lane.service';
import { PoolService } from '../../services/pool.service';

// HU-08 y HU-09
@Component({
  selector: 'app-actividad-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './actividad-form.component.html'
})
export class ActividadFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly actividadService = inject(ActividadService);
  private readonly poolService = inject(PoolService);
  private readonly laneService = inject(LaneService);
  private readonly router = inject(Router);

  readonly procesoId = input.required<string>();
  // Parámetro :id de la ruta; no existe al crear
  readonly id = input<string>();
  protected readonly editing = computed(() => this.id() !== undefined);

  protected readonly tipos = ['TAREA', 'TAREA_USUARIO', 'TAREA_SERVICIO', 'TAREA_MANUAL'];
  protected readonly lanes = signal<Lane[]>([]);
  private readonly actividadesExistentes = signal<Actividad[]>([]);
  private readonly actividadActual = signal<Actividad | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly message = signal('');

  // Las coordenadas (posicionX, posicionY) se asignan automáticamente y se ajustan con Drag & Drop
  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    tipoActividad: ['TAREA', Validators.required],
    laneId: [null as number | null, Validators.required]
  });

  ngOnInit(): void {
    const procesoId = Number(this.procesoId());
    const id = this.id();
    Promise.all([
      this.poolService.list(procesoId).then(pools => {
        const propietario = pools.find(p => p.tipo === 'PROPIETARIO');
        return propietario ? this.laneService.list(procesoId, propietario.id) : [];
      }),
      this.actividadService.list(procesoId),
      id === undefined ? Promise.resolve(null) : this.actividadService.get(procesoId, Number(id))
    ])
      .then(([lanes, actividades, actividad]) => {
        this.lanes.set(lanes.sort((a, b) => a.orden - b.orden));
        this.actividadesExistentes.set(actividades);
        if (actividad) {
          this.actividadActual.set(actividad);
          this.form.setValue({
            nombre: actividad.nombre,
            tipoActividad: actividad.tipoActividad,
            laneId: actividad.laneId
          });
        }
        this.loading.set(false);
      })
      .catch(err => {
        this.message.set(mensajeDeError(err, 'No fue posible cargar la actividad'));
        this.loading.set(false);
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = this.form.getRawValue();
    const laneId = Number(datos.laneId);
    const actual = this.actividadActual();
    const coordenadas =
      actual && actual.laneId === laneId
        ? { posicionX: actual.posicionX, posicionY: actual.posicionY }
        : this.calcularPosicionInicial(laneId);

    const actividad: ActividadRequest = {
      nombre: (datos.nombre ?? '').trim(),
      tipoActividad: datos.tipoActividad ?? 'TAREA',
      laneId,
      posicionX: coordenadas.posicionX,
      posicionY: coordenadas.posicionY
    };
    const procesoId = Number(this.procesoId());
    const id = this.id();
    const request: Promise<Actividad> =
      id === undefined
        ? this.actividadService.create(procesoId, actividad)
        : this.actividadService.update(procesoId, Number(id), actividad);

    this.saving.set(true);
    this.message.set('');
    request
      .then(() => this.router.navigate(['/procesos', procesoId, 'actividades']))
      .catch(err => {
        this.message.set(mensajeDeError(err, 'No fue posible guardar la actividad'));
        this.saving.set(false);
      });
  }

  private calcularPosicionInicial(laneId: number): { posicionX: number; posicionY: number } {
    const enLane = this.actividadesExistentes().filter(
      a => a.laneId === laneId && a.id !== this.actividadActual()?.id
    );
    const indice = enLane.length;
    const columna = indice % 4;
    const fila = Math.floor(indice / 4);
    return {
      posicionX: 24 + columna * 160,
      posicionY: 24 + fila * 72
    };
  }
}

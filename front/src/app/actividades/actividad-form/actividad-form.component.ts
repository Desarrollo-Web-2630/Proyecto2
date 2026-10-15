import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api-error';
import { Actividad, ActividadRequest } from '../../models/actividad.model';
import { Lane } from '../../models/lane.model';
import { ActividadService } from '../../services/actividad.service';
import { LaneService } from '../../services/lane.service';
import { PoolService } from '../../services/pool.service';
import { FieldErrorComponent } from '../../shared/field-error/field-error.component';

// HU-08 (crear) y HU-09 (editar). La lane define el rol responsable
@Component({
  selector: 'app-actividad-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent],
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
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly message = signal('');

  // Mismas reglas que ActividadDTO
  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(255)]],
    tipoActividad: ['TAREA', Validators.required],
    laneId: [null as number | null, Validators.required],
    posicionX: [0, [Validators.required, Validators.min(0)]],
    posicionY: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    const procesoId = Number(this.procesoId());
    const id = this.id();
    this.poolService.list(procesoId)
      .then(pools => {
        const propietario = pools.find(p => p.tipo === 'PROPIETARIO');
        return propietario ? this.laneService.list(procesoId, propietario.id) : [];
      })
      .then(lanes => {
        this.lanes.set(lanes);
        return id === undefined ? null : this.actividadService.get(procesoId, Number(id));
      })
      .then(actividad => {
        if (actividad) {
          this.form.setValue({
            nombre: actividad.nombre,
            tipoActividad: actividad.tipoActividad,
            laneId: actividad.laneId,
            posicionX: actividad.posicionX,
            posicionY: actividad.posicionY
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
    const actividad: ActividadRequest = {
      nombre: (datos.nombre ?? '').trim(),
      tipoActividad: datos.tipoActividad ?? 'TAREA',
      laneId: Number(datos.laneId),
      posicionX: Number(datos.posicionX),
      posicionY: Number(datos.posicionY)
    };
    const procesoId = Number(this.procesoId());
    const id = this.id();
    const request: Promise<Actividad> = id === undefined
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
}

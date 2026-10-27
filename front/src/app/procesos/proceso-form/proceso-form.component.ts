import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api-error';
import { Proceso, ProcesoRequest } from '../../models/proceso.model';
import { ProcesoService } from '../../services/proceso.service';
import { SesionService } from '../../services/sesion.service';

// HU-04 (crear) y HU-05 (editar)
@Component({
  selector: 'app-proceso-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './proceso-form.component.html'
})
export class ProcesoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProcesoService);
  private readonly router = inject(Router);
  protected readonly sesion = inject(SesionService);

  // Parámetro :id de la ruta; no existe al crear
  readonly id = input<string>();
  protected readonly editing = computed(() => this.id() !== undefined);
  protected readonly puedeEditar = computed(() => this.sesion.usuario()?.rolAcceso !== 'LECTURA');

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal('');

  // Mismas reglas que ProcesoDTO
  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    descripcion: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    categoria: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]]
  });

  ngOnInit(): void {
    const id = this.id();
    if (id === undefined) {
      return;
    }
    this.loading.set(true);
    this.service.get(Number(id))
      .then(proceso => {
        this.form.setValue({
          nombre: proceso.nombre,
          descripcion: proceso.descripcion,
          categoria: proceso.categoria
        });
        this.loading.set(false);
      })
      .catch(err => {
        this.message.set(mensajeDeError(err, 'No fue posible cargar el proceso'));
        this.loading.set(false);
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = this.form.getRawValue();
    const proceso: ProcesoRequest = {
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      categoria: datos.categoria.trim()
    };
    const id = this.id();
    const request: Promise<Proceso> = id === undefined
      ? this.service.create(proceso)
      : this.service.update(Number(id), proceso);

    this.saving.set(true);
    this.message.set('');
    request
      .then(() => this.router.navigate(['/procesos']))
      .catch(err => {
        this.message.set(mensajeDeError(err, 'No fue posible guardar el proceso'));
        this.saving.set(false);
      });
  }
}

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { mensajeDeError } from '../../core/api-error';
import { RolProceso, RolProcesoRequest } from '../../models/rol-proceso.model';
import { RolProcesoService } from '../../services/rol-proceso.service';
import { SesionService } from '../../services/sesion.service';

// HU-17 (crear) y HU-18 (editar)
@Component({
  selector: 'app-rol-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './rol-form.component.html'
})
export class RolFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(RolProcesoService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly sesion = inject(SesionService);

  // Parámetro :id de la ruta; no existe al crear
  readonly id = input<string>();
  protected readonly editing = computed(() => this.id() !== undefined);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal('');

  // Mismas reglas que RolProcesoRequestDTO. El patrón pide al menos un carácter
  // que no sea espacio: required deja pasar "   " y el backend lo rechazaría
  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    descripcion: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    const id = this.id();
    if (id === undefined) {
      return;
    }
    this.loading.set(true);
    this.service.get(Number(id))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: rol => {
          this.form.setValue({ nombre: rol.nombre, descripcion: rol.descripcion });
          this.loading.set(false);
        },
        error: err => {
          this.message.set(mensajeDeError(err, 'No fue posible cargar el rol'));
          this.loading.set(false);
        }
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = this.form.getRawValue();
    const rol: RolProcesoRequest = { nombre: datos.nombre.trim(), descripcion: datos.descripcion.trim() };
    const id = this.id();
    const request: Observable<RolProceso> = id === undefined
      ? this.service.create(rol)
      : this.service.update(Number(id), rol);

    this.saving.set(true);
    this.message.set('');
    request
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/roles']),
        error: err => {
          this.message.set(mensajeDeError(err, 'No fue posible guardar el rol'));
          this.saving.set(false);
        }
      });
  }
}
